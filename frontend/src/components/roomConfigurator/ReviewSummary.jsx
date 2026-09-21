import { CircleDashed, Pencil } from "lucide-react";
import { LAYOUTS, DEVICE_LABELS, CAMERA_FEATURES, TABLE_SIZED_LAYOUTS, TABLE_KIND_LABELS, CLASSROOM_DESK_DEPTH, displaySpec, allInOneSpec, refCode, seatingDensityLabel } from "../../lib/roomConfiguratorEngine";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// "D1 65", VB1 90°" style lists, or a plain "no …" when there are none.
const codes = (devices, category, none, detail) =>
  devices[category].length
    ? devices[category].map((d, i) => (detail ? `${refCode(category, i)} ${detail(d)}` : refCode(category, i))).join(", ")
    : none;

function SummaryRow({ title, facts, onEdit }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-white">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-white/60">{facts.filter(Boolean).join(" · ")}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${title.toLowerCase()}`}
        className="-mr-2 flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-cyan-300 transition-[background-color,transform] duration-100 hover:bg-blue-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.96]"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </li>
  );
}

// The whole configuration in five lines, one per step, so "Edit" goes straight back to
// where each value was set. Every detail is still in its step and in the PDF.
export function ReviewSummary({ state, audience, details, photoCount, onEditStep }) {
  const layoutLabel = LAYOUTS.find((l) => l.id === state.layout)?.label || state.layout;
  const { room, table, chairCount, devices } = state;
  const notes = state.additionalNotes?.trim();
  const controls = ["touchPanel", "contentSharing", "bookingPanel"].filter((c) => devices[c].length).map((c) => DEVICE_LABELS[c]);
  const features = (state.cameraFeatures || []).map((id) => CAMERA_FEATURES.find((f) => f.id === id)?.label || id);
  const tableSize = `${table.length.toFixed(1)} × ${table.width.toFixed(1)} m ${table.orientation === 0 ? "landscape" : "portrait"}`;
  const seats = `${plural(chairCount, "seat")}, ${seatingDensityLabel(state.seatingDensity).toLowerCase()} spacing`;
  const tables = TABLE_SIZED_LAYOUTS.includes(state.layout)
    ? `${tableSize} table`
    : state.layout === "classroom"
    ? `${TABLE_KIND_LABELS.classroom}, ${(table.deskDepth ?? CLASSROOM_DESK_DEPTH.default).toFixed(2)} m deep`
    : TABLE_KIND_LABELS[state.layout];
  const top = state.layout !== "theater" && (state.tableTopMaterial ? `${state.tableTopMaterial} top` : "Top not chosen");
  const floor = state.floorType ? `${state.floorType} floor` : "Floor not chosen";
  const ceiling = state.ceilingType || "Ceiling not chosen";
  const about = (
    <SummaryRow
      title={audience === "customer" ? "About" : "Project"}
      onEdit={() => onEditStep("about")}
      facts={[
        details.customerName.trim() || "Company not added",
        details.roomName.trim() || "Room name not added",
        audience === "reseller" && (details.resellerName.trim() ? `Prepared by ${details.resellerName.trim()}` : "Preparer not added"),
        audience === "customer" && (details.contactName.trim() ? `Sent by ${details.contactName.trim()}` : "Your name not added"),
      ]}
    />
  );
  const siteDetails = (
    <SummaryRow
      title={audience === "customer" ? "Photos and notes" : "Site details"}
      onEdit={() => onEditStep("details")}
      facts={[photoCount ? plural(photoCount, "photo") : "No photos", notes ? `Notes: ${notes}` : "No notes"]}
    />
  );

  // A customer's plan is just the room and its furniture — no devices.
  if (audience === "customer") {
    return (
      <ul className="-my-1 divide-y divide-white/[0.07]">
        {about}
        <SummaryRow
          title="Room"
          onEdit={() => onEditStep("room")}
          facts={[`${room.length.toFixed(1)} × ${room.width.toFixed(1)} × ${room.height.toFixed(1)} m`, floor, ceiling]}
        />
        <SummaryRow
          title="Layout"
          onEdit={() => onEditStep("table")}
          facts={state.layout ? [layoutLabel, seats, tables, top] : ["No layout chosen yet"]}
        />
        {siteDetails}
      </ul>
    );
  }

  return (
    <ul className="-my-1 divide-y divide-white/[0.07]">
      {about}
      <SummaryRow
        title="Room"
        onEdit={() => onEditStep("room")}
        facts={[
          `${room.length.toFixed(1)} × ${room.width.toFixed(1)} × ${room.height.toFixed(1)} m`,
          devices.door.length ? plural(devices.door.length, "door") : "No door marked",
          state.wallMaterials?.length ? state.wallMaterials.join(", ") : "Walls not chosen",
          floor,
          ceiling,
        ]}
      />
      <SummaryRow
        title="Seating"
        onEdit={() => onEditStep("seating")}
        facts={state.layout ? [layoutLabel, seats, tables, top] : ["No layout chosen yet"]}
      />
      <SummaryRow
        title="Video"
        onEdit={() => onEditStep("video")}
        facts={[
          state.platform || "Platform not chosen",
          devices.allInOne.length
            ? [devices.display.length && codes(devices, "display", "", displaySpec), codes(devices, "allInOne", "", (d) => `${allInOneSpec(d)} all-in-one`)].filter(Boolean).join(", ")
            : codes(devices, "display", "No display", displaySpec),
          devices.camera.length || devices.videoBar.length || devices.allInOne.length
            ? [
                devices.camera.length && codes(devices, "camera", "", (c) => (c.isTableCam ? "360°" : `${c.fov}°`)),
                devices.videoBar.length && codes(devices, "videoBar", "", (v) => `${v.fov}°`),
                devices.allInOne.length && `${devices.allInOne.length === 1 ? "camera" : "cameras"} built into the all-in-one`,
              ].filter(Boolean).join(", ")
            : "No camera",
          features.length ? features.join(", ") : "No camera behaviors",
        ]}
      />
      <SummaryRow
        title="Audio and control"
        onEdit={() => onEditStep("audio")}
        facts={[
          state.audioPreference || "Audio setup not chosen",
          devices.microphone.length ? plural(devices.microphone.length, "microphone") : "No microphones",
          devices.speaker.length ? plural(devices.speaker.length, "speaker") : "No speakers",
          controls.length ? controls.join(", ") : "No room control",
        ]}
      />
      {siteDetails}
    </ul>
  );
}

// Sections nobody has opened yet, each with a shortcut straight to it.
export function UncheckedSections({ items, onCheck }) {
  return (
    <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2.5">
      <p className="flex items-start gap-1.5 text-xs font-semibold leading-snug text-amber-200">
        <CircleDashed aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0 text-amber-300" />
        {plural(items.length, "section")} not checked yet. Anything left empty shows as "Not specified" in the PDF, and a layout's starting table and seats as "(default)".
      </p>
      <ul className="mt-1 divide-y divide-amber-400/15">
        {items.map(({ step, section }) => (
          <li key={`${step.id}:${section.id}`} className="flex items-center justify-between gap-3 py-1">
            <span className="min-w-0 text-xs text-white/70">
              <span className="font-semibold text-white">{section.title}</span> · {step.label}
            </span>
            <button
              type="button"
              onClick={() => onCheck(step.id, section.id)}
              aria-label={`Check ${section.title.toLowerCase()} in ${step.label}`}
              className="-mr-1 flex min-h-[32px] shrink-0 items-center rounded-lg px-2 text-xs font-semibold text-cyan-300 transition-[background-color,transform] duration-100 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.96]"
            >
              Check
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
