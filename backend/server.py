from pathlib import Path
from dotenv import load_dotenv

# Load environment variables FIRST before any other imports that need them
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Depends, UploadFile, File, Form, Request
from fastapi.responses import Response, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import uuid
import logging
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
import base64

from pydantic import BaseModel

from models import ContactForm, ContactFormCreate, NewsletterSubscription, NewsletterSubscriptionCreate, FAQ, FAQCreate, FAQUpdate
from blog_models import BlogPost, BlogPostCreate, BlogPostSummary, BlogPostUpdate, Token, LoginRequest
from deal_models import Deal, DealCreate, DealUpdate
from auth import verify_password, create_access_token, decode_access_token
from email_service import email_service
from seo_prerender import (
    resolve_route_meta,
    render_seo_html,
    list_static_routes,
    list_dynamic_routes,
    STATIC_ROUTES,
    UNPUBLISHED_ROUTES,
    BLOG_POST_RE,
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Authentication middleware
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    username = payload.get("sub")
    if username is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return username


# Authentication endpoints
@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Admin login"""
    user = await db.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": login_data.username})
    return {"access_token": access_token, "token_type": "bearer"}


# Admin users are created on the server with scripts/create_admin.py — deliberately not
# through an endpoint, which anyone could use to make themselves an admin.


# Blog endpoints

# Fields a listing card actually renders. Projecting to these keeps the giant
# `content` bodies and inline base64 `featured_image` blobs off the wire.
SUMMARY_PROJECTION = {
    "_id": 0,
    "id": 1,
    "title": 1,
    "slug": 1,
    "excerpt": 1,
    "category": 1,
    "author": 1,
    "date": 1,
    "published": 1,
    "views": 1,
    "reading_time": 1,
    "tags": 1,
}


def _summarize(post: dict, has_image: bool) -> BlogPostSummary:
    """Build a card-sized post, pointing featured_image at the image endpoint."""
    return BlogPostSummary(
        **post,
        featured_image=f"/api/blog/posts/{post['id']}/image" if has_image else None,
    )


@api_router.get("/blog/posts", response_model=None)
async def get_all_posts(
    published_only: bool = True,
    summary: bool = False,
    limit: int = 100,
):
    """Get blog posts.

    `summary=true` returns card-sized records (no `content`, and
    `featured_image` as a URL rather than an inline data URI). Listing pages
    should always use it — the full form runs to tens of megabytes because
    featured images are stored base64-encoded in the documents.
    """
    query = {"published": True} if published_only else {}
    limit = max(1, min(limit, 100))

    if not summary:
        posts = await db.blog_posts.find(query).sort("date", -1).to_list(limit)
        return [BlogPost(**post) for post in posts]

    posts = await db.blog_posts.find(query, SUMMARY_PROJECTION).sort("date", -1).to_list(limit)

    # Which of these actually have an image? `distinct` returns just the ids,
    # so this stays cheap — we never pull the base64 payloads across.
    with_images = set(
        await db.blog_posts.distinct(
            "id", {**query, "featured_image": {"$nin": [None, ""]}}
        )
    )
    return [_summarize(post, post["id"] in with_images) for post in posts]


@api_router.get("/blog/posts/{post_ref}/image")
async def get_post_image(post_ref: str):
    """Serve a post's featured image as bytes.

    Images are stored on the document as base64 data URIs. Decoding them here
    lets listing responses carry a URL instead, so the image is fetched only
    when it is displayed, is cached independently of the JSON, and is not
    re-downloaded on every page load.
    """
    post = await db.blog_posts.find_one(
        {"$or": [{"id": post_ref}, {"slug": post_ref}]},
        {"_id": 0, "featured_image": 1},
    )
    if not post or not post.get("featured_image"):
        raise HTTPException(status_code=404, detail="Image not found")

    raw = post["featured_image"]
    if not raw.startswith("data:"):
        # Already a plain URL — send the caller there rather than proxying it.
        return RedirectResponse(raw, status_code=302)

    header, _, payload = raw.partition(",")
    media_type = header[5:].split(";")[0] or "application/octet-stream"
    try:
        content = base64.b64decode(payload)
    except Exception:
        raise HTTPException(status_code=422, detail="Featured image is not valid base64")

    return Response(
        content=content,
        media_type=media_type,
        headers={
            # Content is immutable for a given post revision; the URL changes
            # only if the post id does, so a long TTL is safe.
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    )


@api_router.get("/blog/posts/{slug}", response_model=BlogPost)
async def get_post_by_slug(slug: str):
    """Get a single blog post by slug"""
    post = await db.blog_posts.find_one({"slug": slug})
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Increment views
    await db.blog_posts.update_one(
        {"slug": slug},
        {"$inc": {"views": 1}}
    )
    
    return BlogPost(**post)


@api_router.post("/blog/posts", response_model=BlogPost)
async def create_post(post_data: BlogPostCreate, current_user: str = Depends(get_current_user)):
    """Create a new blog post (protected)"""
    # Check if slug already exists
    existing = await db.blog_posts.find_one({"slug": post_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A post with this slug already exists")
    
    post = BlogPost(**post_data.dict())
    await db.blog_posts.insert_one(post.dict())
    logger.info(f"Blog post created: {post.title} by {current_user}")
    
    return post


@api_router.put("/blog/posts/{post_id}", response_model=BlogPost)
async def update_post(post_id: str, post_data: BlogPostUpdate, current_user: str = Depends(get_current_user)):
    """Update a blog post (protected)"""
    existing = await db.blog_posts.find_one({"id": post_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    update_data = {k: v for k, v in post_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.blog_posts.update_one({"id": post_id}, {"$set": update_data})
    
    updated_post = await db.blog_posts.find_one({"id": post_id})
    logger.info(f"Blog post updated: {post_id} by {current_user}")
    
    return BlogPost(**updated_post)


@api_router.delete("/blog/posts/{post_id}")
async def delete_post(post_id: str, current_user: str = Depends(get_current_user)):
    """Delete a blog post (protected)"""
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    logger.info(f"Blog post deleted: {post_id} by {current_user}")
    return {"message": "Blog post deleted successfully"}


# Maximum file size: 5MB
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MIME_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
}

@api_router.post("/blog/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    """Upload an image for blog post (max 5MB, jpg/png/gif/webp only)
    
    Returns a Base64 data URL for persistent storage in the database.
    This approach works in containerized/ephemeral environments where
    filesystem storage is not persistent.
    """
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size by reading content
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 5MB. Your file: {file_size / (1024*1024):.2f}MB"
        )
    
    # Convert to Base64 data URL
    mime_type = MIME_TYPES.get(file_ext, 'image/jpeg')
    base64_data = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{mime_type};base64,{base64_data}"
    
    logger.info(f"Image uploaded by {current_user}: {file.filename} ({file_size / 1024:.1f}KB)")
    
    # Return Base64 data URL (works directly in <img src>)
    return {"url": data_url}


# Original endpoints
@api_router.get("/")
async def root():
    return {"message": "Fidelis Logic API"}


# ---------------------------------------------------------------------------
# SEO pre-render endpoint
# ---------------------------------------------------------------------------
# Returns a fully rendered HTML document with route-specific <title>,
# meta description, canonical URL, JSON-LD, H1 and summary content.
# Route the following bot/social-scraper User-Agents through this endpoint
# at the edge (nginx/Cloudflare) to feed crawlers pre-rendered HTML:
#   Googlebot, Bingbot, DuckDuckBot, Slurp, Baiduspider, YandexBot,
#   facebookexternalhit, Twitterbot, LinkedInBot, WhatsApp, TelegramBot,
#   Slackbot, Discordbot.
#
# Public routes covered:
#   - Static:  every key of seo_prerender.STATIC_ROUTES
#   - Dynamic: /blog/<slug> and /deals/<slug>  (any published post or deal)
# ---------------------------------------------------------------------------

@api_router.get("/prerender", response_class=Response)
async def prerender_route(path: str):
    """
    Return SEO-enhanced HTML for the given path (query param).

    Example: GET /api/prerender?path=/solutions/business-apps
    """
    if not path.startswith("/"):
        path = "/" + path

    meta = await resolve_route_meta(path, db)
    if meta is None:
        raise HTTPException(status_code=404, detail=f"No pre-render metadata for path: {path}")

    html_doc = render_seo_html(path, meta)
    return Response(
        content=html_doc,
        media_type="text/html; charset=utf-8",
        headers={"Cache-Control": "public, max-age=300"},
    )


@api_router.get("/prerender/routes")
async def prerender_routes_index():
    """List all static SEO-covered routes plus published blog posts and deals."""
    return {
        "static_routes": list_static_routes(),
        "dynamic_routes": await list_dynamic_routes(db),
        "blog_post_pattern": BLOG_POST_RE.pattern,
    }


@api_router.post("/contact", response_model=dict)
async def submit_contact_form(form_data: ContactFormCreate, background_tasks: BackgroundTasks):
    """Handle contact form submission"""
    try:
        # Create contact form object
        contact = ContactForm(**form_data.dict())
        
        # Save to database
        await db.contacts.insert_one(contact.dict())
        
        # Send email notification in background
        background_tasks.add_task(
            email_service.send_consultation_request,
            contact.name,
            contact.company,
            contact.email,
            contact.phone,
            contact.topic,
            contact.preferred_date,
            contact.message,
            contact.audience,
        )
        
        logger.info(f"Contact form submitted by {contact.email}")
        
        return {
            "status": "success",
            "message": "Thank you for your inquiry. We'll contact you within 24 hours."
        }
        
    except Exception as e:
        logger.error(f"Error processing contact form: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process your request. Please try again.")


@api_router.post("/newsletter", response_model=dict)
async def subscribe_newsletter(subscription: NewsletterSubscriptionCreate, background_tasks: BackgroundTasks):
    """Handle newsletter subscription"""
    try:
        # Check if email already exists
        existing = await db.newsletters.find_one({"email": subscription.email})
        if existing:
            return {
                "status": "info",
                "message": "You're already subscribed to our newsletter!"
            }
        
        # Create subscription object
        newsletter_sub = NewsletterSubscription(**subscription.dict())
        
        # Save to database
        await db.newsletters.insert_one(newsletter_sub.dict())
        
        # Send notification in background
        background_tasks.add_task(
            email_service.send_newsletter_subscription,
            newsletter_sub.email
        )
        
        logger.info(f"Newsletter subscription: {newsletter_sub.email}")
        
        return {
            "status": "success",
            "message": "Successfully subscribed to our newsletter!"
        }
        
    except Exception as e:
        logger.error(f"Error processing newsletter subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to subscribe. Please try again.")


@api_router.get("/admin/contacts", response_model=List[ContactForm])
async def get_contacts(current_user: str = Depends(get_current_user)):
    """Admin: latest 100 contact form submissions."""
    contacts = await db.contacts.find().sort("created_at", -1).to_list(100)
    return [ContactForm(**contact) for contact in contacts]


@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "fidelis-logic-api"}


# ==================== DEALS ENDPOINTS ====================

@api_router.get("/deals", response_model=List[Deal])
async def get_all_deals(published_only: bool = True):
    """Get all deals"""
    query = {"published": True} if published_only else {}
    deals = await db.deals.find(query).sort("created_at", -1).to_list(100)
    return [Deal(**deal) for deal in deals]


@api_router.get("/deals/active", response_model=List[Deal])
async def get_active_deals():
    """Return published, non-expired deals (used by the floating Smart Deals button)."""
    now = datetime.utcnow()
    query = {
        "published": True,
        "$or": [
            {"end_date": {"$exists": False}},
            {"end_date": None},
            {"end_date": {"$gte": now}},
        ],
    }
    deals = await db.deals.find(query).sort("created_at", -1).to_list(100)
    return [Deal(**deal) for deal in deals]


@api_router.get("/deals/{slug}", response_model=Deal)
async def get_deal_by_slug(slug: str):
    """Get a single deal by slug"""
    deal = await db.deals.find_one({"slug": slug})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Increment views
    await db.deals.update_one(
        {"slug": slug},
        {"$inc": {"views": 1}}
    )
    
    return Deal(**deal)


@api_router.post("/deals", response_model=Deal)
async def create_deal(deal_data: DealCreate, current_user: str = Depends(get_current_user)):
    """Create a new deal (protected)"""
    # Check if slug already exists
    existing = await db.deals.find_one({"slug": deal_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="A deal with this slug already exists")
    
    deal = Deal(**deal_data.dict())
    await db.deals.insert_one(deal.dict())
    logger.info(f"Deal created: {deal.title} by {current_user}")
    
    return deal


@api_router.put("/deals/{deal_id}", response_model=Deal)
async def update_deal(deal_id: str, deal_data: DealUpdate, current_user: str = Depends(get_current_user)):
    """Update a deal (protected)"""
    existing = await db.deals.find_one({"id": deal_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    update_data = {k: v for k, v in deal_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.deals.update_one({"id": deal_id}, {"$set": update_data})
    
    updated_deal = await db.deals.find_one({"id": deal_id})
    logger.info(f"Deal updated: {deal_id} by {current_user}")
    
    return Deal(**updated_deal)


@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, current_user: str = Depends(get_current_user)):
    """Delete a deal (protected)"""
    result = await db.deals.delete_one({"id": deal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    logger.info(f"Deal deleted: {deal_id} by {current_user}")
    return {"message": "Deal deleted successfully"}


@api_router.post("/deals/upload-image")
async def upload_deal_image(file: UploadFile = File(...), current_user: str = Depends(get_current_user)):
    """Upload an image for a deal (max 5MB, jpg/png/gif/webp only)"""
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size by reading content
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 5MB. Your file: {file_size / (1024*1024):.2f}MB"
        )
    
    # Convert to Base64 data URL
    mime_type = MIME_TYPES.get(file_ext, 'image/jpeg')
    base64_data = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{mime_type};base64,{base64_data}"
    
    logger.info(f"Deal image uploaded by {current_user}: {file.filename} ({file_size / 1024:.1f}KB)")
    
    return {"url": data_url}


# ==================== SITEMAP ====================
#
# The URL list is derived by merging seo_prerender.STATIC_ROUTES (single
# source of truth for pre-rendered pages) with SITEMAP_EXTRA_PAGES below.
# Adding a route to STATIC_ROUTES automatically flows into sitemap.xml
# with no duplicate maintenance.

# Manual pages that are NOT in STATIC_ROUTES but still belong in the sitemap
# (React SPA routes without a pre-render entry, hub pages, etc.).
SITEMAP_EXTRA_PAGES = [
    "/services",
    "/services/consulting",
    "/services/deployment-configuration",
    "/services/managed-support",
    "/services/video-conferencing-rentals",
    "/services/workspace-audits",
    "/services/technology-refresh",
    "/services/relocation-office-moves",
    "/services/training-adoption",
]


def _build_sitemap_static_pages() -> list[str]:
    """
    Merge STATIC_ROUTES with SITEMAP_EXTRA_PAGES and return a de-duplicated
    ordered list of paths. Root first, then alphabetical for stability.
    """
    seen: set[str] = set()
    for path in STATIC_ROUTES.keys():
        seen.add(path)
    for path in SITEMAP_EXTRA_PAGES:
        seen.add(path)
    # Routes that exist in the app but are not publishable yet never appear,
    # even if one is added to the lists above by mistake.
    seen -= set(UNPUBLISHED_ROUTES)
    return sorted(seen, key=lambda p: (p != "/", p))


def _resolve_base_url(request: Request) -> str:
    base = os.environ.get("SITE_BASE_URL", "").strip().rstrip("/")
    if base:
        return base
    # Fallback to request host so preview environments still produce valid URLs
    return str(request.base_url).rstrip("/")


def _fmt_date(d) -> str:
    if isinstance(d, datetime):
        return d.strftime("%Y-%m-%d")
    if isinstance(d, str) and d:
        return d[:10]
    return datetime.utcnow().strftime("%Y-%m-%d")


# ==================== FAQs ====================

@api_router.get("/faqs", response_model=List[FAQ])
async def get_faqs(
    brand_slug: Optional[str] = None,
    service_slug: Optional[str] = None,
    published_only: bool = True,
):
    """Public: list FAQs (optionally filtered by brand or service)."""
    query = {}
    if brand_slug:
        query["brand_slug"] = brand_slug
    if service_slug:
        query["service_slug"] = service_slug
    if published_only:
        query["published"] = True
    faqs = await db.faqs.find(query, {"_id": 0}).sort([("order", 1), ("created_at", 1)]).to_list(500)
    return [FAQ(**f) for f in faqs]


@api_router.get("/admin/faqs", response_model=List[FAQ])
async def list_faqs_admin(
    brand_slug: Optional[str] = None,
    service_slug: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Admin: list all FAQs (published + drafts), optionally filtered."""
    query = {}
    if brand_slug:
        query["brand_slug"] = brand_slug
    if service_slug:
        query["service_slug"] = service_slug
    faqs = await db.faqs.find(query, {"_id": 0}).sort([("brand_slug", 1), ("service_slug", 1), ("order", 1), ("created_at", 1)]).to_list(1000)
    return [FAQ(**f) for f in faqs]


@api_router.get("/faqs/{faq_id}", response_model=FAQ)
async def get_faq(faq_id: str, current_user: str = Depends(get_current_user)):
    """Admin: fetch a single FAQ for editing."""
    faq = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return FAQ(**faq)


@api_router.post("/faqs", response_model=FAQ)
async def create_faq(payload: FAQCreate, current_user: str = Depends(get_current_user)):
    """Admin: create a new FAQ. Requires exactly one of brand_slug or service_slug."""
    if not payload.brand_slug and not payload.service_slug:
        raise HTTPException(status_code=400, detail="Either brand_slug or service_slug is required")
    if payload.brand_slug and payload.service_slug:
        raise HTTPException(status_code=400, detail="Set only one of brand_slug or service_slug, not both")
    now = datetime.utcnow()
    faq = FAQ(
        brand_slug=payload.brand_slug,
        service_slug=payload.service_slug,
        question=payload.question,
        answer=payload.answer,
        order=payload.order if payload.order is not None else 0,
        published=payload.published if payload.published is not None else True,
        created_at=now,
        updated_at=now,
    )
    await db.faqs.insert_one(faq.dict())
    return faq


@api_router.put("/faqs/{faq_id}", response_model=FAQ)
async def update_faq(faq_id: str, payload: FAQUpdate, current_user: str = Depends(get_current_user)):
    """Admin: update an existing FAQ."""
    existing = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="FAQ not found")
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    await db.faqs.update_one({"id": faq_id}, {"$set": update_data})
    updated = await db.faqs.find_one({"id": faq_id}, {"_id": 0})
    return FAQ(**updated)


@api_router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, current_user: str = Depends(get_current_user)):
    """Admin: delete a FAQ."""
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"status": "success", "message": "FAQ deleted"}




# ==================== ROOM CONFIGURATOR USAGE STATS ====================
#
# The configurator reports one "open" event per browser-tab session and one
# "export" event per PDF downloaded, for every visitor. Each event is stored with
# only its time and the local calendar day it happened on (so the admin dashboard
# can count uses per day without timezone arithmetic at query time). Nothing about
# the visitor — no IP address, browser details, or other identifier — is kept.

USAGE_EVENTS = {"open", "export"}

# Days roll over at local midnight for the business, not UTC midnight.
try:
    STATS_TZ = ZoneInfo(os.environ.get("STATS_TIMEZONE", "Asia/Dubai"))
except ZoneInfoNotFoundError:
    STATS_TZ = timezone(timedelta(hours=4))


def _stats_day(moment: datetime) -> str:
    return moment.replace(tzinfo=timezone.utc).astimezone(STATS_TZ).strftime("%Y-%m-%d")


class UsageEventCreate(BaseModel):
    event: str = "open"


@api_router.post("/analytics/room-configurator")
async def record_room_configurator_usage(payload: UsageEventCreate):
    """Public: record one Room Configurator use (or PDF export)."""
    if payload.event not in USAGE_EVENTS:
        raise HTTPException(status_code=400, detail="Unknown event")
    now = datetime.utcnow()
    await db.configurator_usage.insert_one({
        "id": str(uuid.uuid4()),
        "event": payload.event,
        "created_at": now,
        "day": _stats_day(now),
    })
    return {"status": "ok"}


@api_router.get("/admin/analytics/room-configurator")
async def room_configurator_stats(
    days: int = 14,
    date: Optional[str] = None,
    current_user: str = Depends(get_current_user),
):
    """Admin: daily Room Configurator uses, plus the individual uses for one
    day — `date` (YYYY-MM-DD, local time), defaulting to today."""
    days = max(1, min(days, 90))
    today_local = datetime.now(STATS_TZ).date()
    day_list = [(today_local - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days - 1, -1, -1)]
    selected = date if date and re.fullmatch(r"\d{4}-\d{2}-\d{2}", date) else day_list[-1]

    pipeline = [
        {"$match": {"day": {"$gte": day_list[0]}}},
        {"$group": {
            "_id": "$day",
            "uses": {"$sum": {"$cond": [{"$eq": ["$event", "open"]}, 1, 0]}},
            "exports": {"$sum": {"$cond": [{"$eq": ["$event", "export"]}, 1, 0]}},
        }},
    ]
    by_day = {row["_id"]: row async for row in db.configurator_usage.aggregate(pipeline)}
    daily = [
        {
            "date": d,
            "uses": by_day.get(d, {}).get("uses", 0),
            "exports": by_day.get(d, {}).get("exports", 0),
        }
        for d in day_list
    ]

    entries = await db.configurator_usage.find(
        {"day": selected}, {"_id": 0, "event": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(1000)
    for entry in entries:
        # Stored as naive UTC; label it so the browser converts to local time.
        entry["created_at"] = entry["created_at"].replace(tzinfo=timezone.utc).isoformat()

    all_time = await db.configurator_usage.count_documents({"event": "open"})
    return {
        "timezone": str(STATS_TZ),
        "today": daily[-1],
        "daily": daily,
        "all_time_uses": all_time,
        "selected_date": selected,
        "entries": entries,
    }


@api_router.get("/sitemap.xml")
async def sitemap(request: Request):
    """
    Dynamic sitemap covering static SEO pages, published blog posts and
    non-expired deals. Emits only <loc> and <lastmod> per the sitemap spec —
    Google explicitly ignores <priority> and <changefreq>, so we omit them
    to keep the output honest and small.
    """
    import seo_prerender as _seo

    base = _resolve_base_url(request)

    # Use the actual mtime of seo_prerender.py as the honest lastmod for
    # static pages — this is where their SEO copy lives, so its mtime tracks
    # when they were last edited.
    try:
        static_mtime = datetime.utcfromtimestamp(
            os.path.getmtime(_seo.__file__)
        ).strftime("%Y-%m-%d")
    except OSError:
        static_mtime = datetime.utcnow().strftime("%Y-%m-%d")

    url_entries: List[str] = []

    def _emit(loc: str, lastmod: Optional[str]) -> None:
        if lastmod:
            url_entries.append(
                f"  <url>\n"
                f"    <loc>{loc}</loc>\n"
                f"    <lastmod>{lastmod}</lastmod>\n"
                f"  </url>"
            )
        else:
            url_entries.append(f"  <url>\n    <loc>{loc}</loc>\n  </url>")

    # Static pages — merged from seo_prerender.STATIC_ROUTES + SITEMAP_EXTRA_PAGES
    for path in _build_sitemap_static_pages():
        _emit(f"{base}{path}", static_mtime)

    # Published blog posts — lastmod from updated_at / published_at / date
    blog_cursor = db.blog_posts.find(
        {"published": True},
        {"_id": 0, "slug": 1, "updated_at": 1, "published_at": 1, "date": 1},
    )
    async for post in blog_cursor:
        slug = post.get("slug")
        if not slug:
            continue
        raw_date = (
            post.get("updated_at")
            or post.get("published_at")
            or post.get("date")
        )
        _emit(f"{base}/blog/{slug}", _fmt_date(raw_date) if raw_date else None)

    # Active (non-expired) deals
    now = datetime.utcnow()
    deals_cursor = db.deals.find(
        {"published": True},
        {"_id": 0, "slug": 1, "updated_at": 1, "end_date": 1},
    )
    async for deal in deals_cursor:
        slug = deal.get("slug")
        if not slug:
            continue
        end_date = deal.get("end_date")
        if isinstance(end_date, datetime) and end_date < now:
            continue  # skip expired
        _emit(
            f"{base}/deals/{slug}",
            _fmt_date(deal.get("updated_at")) if deal.get("updated_at") else None,
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(url_entries)
        + "\n</urlset>\n"
    )
    return Response(content=xml, media_type="application/xml")


# Include the router in the main app
app.include_router(api_router)


# ---------------------------------------------------------------------------
# Canonical host redirect — www.fidelislogic.com → fidelislogic.com (301)
# ---------------------------------------------------------------------------
# Applies only to requests that reach the FastAPI process. If your edge/CDN
# already handles this (Cloudflare/Nginx map), this middleware is a harmless
# no-op. If not, this ensures the SEO signal is preserved for any traffic
# that lands on the backend directly.

@app.middleware("http")
async def canonical_host_redirect(request: Request, call_next):
    host = (request.headers.get("host") or "").lower().split(":")[0]
    if host.startswith("www."):
        apex = host[4:]
        # Build the target URL preserving path and query.
        scheme = request.headers.get("x-forwarded-proto") or request.url.scheme or "https"
        target = f"{scheme}://{apex}{request.url.path}"
        if request.url.query:
            target += f"?{request.url.query}"
        return RedirectResponse(url=target, status_code=301)
    return await call_next(request)


# ---------------------------------------------------------------------------
# Root-level /sitemap.xml — crawler-friendly alias for /api/sitemap.xml
# ---------------------------------------------------------------------------
# Google/Bing look for /sitemap.xml at the site root. We serve the exact same
# XML that /api/sitemap.xml produces to avoid a redirect hop.

@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap_root(request: Request):
    return await sitemap(request)


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def create_usage_indexes():
    # The stats queries filter by day and sort by time; index both. Idempotent.
    try:
        await db.configurator_usage.create_index([("day", 1), ("created_at", -1)])
        # Unreleased earlier versions of these stats also stored each visitor's IP
        # address and browser user-agent; strip any recorded while they were tried out.
        await db.configurator_usage.update_many(
            {"$or": [{"ip": {"$exists": True}}, {"user_agent": {"$exists": True}}]},
            {"$unset": {"ip": "", "user_agent": ""}},
        )
    except Exception as e:
        logger.warning(f"Could not prepare configurator_usage: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
