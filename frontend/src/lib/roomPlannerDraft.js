import { initialPlan } from "./roomPlanState";
import { emptyDevices } from "./roomTemplates";

// Room Planner keeps a draft of the plan in this browser, so a refresh, a closed tab or
// a dropped connection partway through a site visit doesn't lose the work. Nothing is
// sent anywhere: the plan goes in localStorage and the photos in IndexedDB, and both
// are cleared by Start over. Storage can be blocked or full (private windows, strict
// settings), so every call fails quietly and the planner simply works without a draft.

const DRAFT_KEY = "rc_draft_v1";
const DRAFT_VERSION = 1;
// An old draft is more likely a room long since finished than one to pick back up.
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (!draft || draft.v !== DRAFT_VERSION || !draft.plan || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) return null;
    return { savedAt: draft.savedAt, plan: restorePlan(draft.plan), ui: draft.ui || {} };
  } catch {
    return null;
  }
}

// Anything added to the plan since it was saved starts at its default.
const restorePlan = (plan) => ({ ...initialPlan(), ...plan, devices: { ...emptyDevices(), ...plan.devices } });

export function saveDraft(plan, ui) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: DRAFT_VERSION, savedAt: Date.now(), plan, ui }));
  } catch {
    // Storage blocked or full: carry on without a draft.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear.
  }
  savePhotos([]);
}

// --- photos -------------------------------------------------------------------------

const DB_NAME = "room-planner";
const PHOTO_STORE = "photos";

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(PHOTO_STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Replaces the stored photos with `photos` ([{ id, file }]), in order.
export async function savePhotos(photos) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      const store = tx.objectStore(PHOTO_STORE);
      store.clear();
      photos.forEach(({ id, file }, order) => store.put({ id, order, file }));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Photos just won't survive a reload.
  }
}

// The stored photos ([{ id, file }]), in the order they were added.
export async function loadPhotos() {
  try {
    const db = await openDb();
    const rows = await new Promise((resolve, reject) => {
      const request = db.transaction(PHOTO_STORE, "readonly").objectStore(PHOTO_STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return rows.sort((a, b) => a.order - b.order).map(({ id, file }) => ({ id, file }));
  } catch {
    return [];
  }
}

// --- shared links -------------------------------------------------------------------

// A link that opens Room Planner on another computer with this plan loaded, for the PDF.
// The plan travels compressed in the link's #fragment, which browsers never send to the
// server, so it stays as private as the PDF it's in. Photos don't fit in a link.
const LINK_PREFIX = "#plan=";

const toBase64Url = (bytes) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join("")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromBase64Url = (text) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
const pipe = async (bytes, transform) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer());

export async function planLink(plan, checkedSections = []) {
  const json = new TextEncoder().encode(JSON.stringify({ v: DRAFT_VERSION, plan, checkedSections }));
  const packed = await pipe(json, new CompressionStream("deflate-raw"));
  return `${window.location.origin}${window.location.pathname}${LINK_PREFIX}${toBase64Url(packed)}`;
}

export const hasPlanLink = () => typeof window !== "undefined" && window.location.hash.startsWith(LINK_PREFIX);

const finite = (v) => typeof v === "number" && Number.isFinite(v);
// A link can be mistyped, truncated or tampered with: only a plan whose room and devices
// are the right shape is loaded.
function validPlan(plan) {
  if (!plan || typeof plan !== "object" || !plan.room || !["length", "width", "height"].every((k) => finite(plan.room[k]))) return false;
  const devices = plan.devices || {};
  return Object.values(devices).every((list) => Array.isArray(list) && list.every((d) => d && finite(d.x) && finite(d.y)));
}

// The plan in this page's link ({ plan, checkedSections }), or null if there isn't one
// or it can't be read.
export async function readPlanLink() {
  if (!hasPlanLink()) return null;
  try {
    const packed = fromBase64Url(window.location.hash.slice(LINK_PREFIX.length));
    const shared = JSON.parse(new TextDecoder().decode(await pipe(packed, new DecompressionStream("deflate-raw"))));
    if (shared?.v !== DRAFT_VERSION || !validPlan(shared.plan)) return null;
    return { plan: restorePlan(shared.plan), checkedSections: Array.isArray(shared.checkedSections) ? shared.checkedSections.filter((k) => typeof k === "string") : [] };
  } catch {
    return null;
  }
}
