import { Building2, Users, Ruler, RotateCcw, Undo2, Redo2 } from "lucide-react";
import { classifyRoomType } from "../../lib/roomConfiguratorEngine";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

function Stat({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-white/35" />
      <span className="sr-only">{label}: </span>
      <span className="text-sm font-medium tabular-nums text-white/70">{children}</span>
    </div>
  );
}

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-[background-color,color,transform] duration-100 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.94] disabled:pointer-events-none disabled:text-white/20";

// Live read-out above the plan (room type, capacity, size), so each change made in a
// step is confirmed at a glance, with undo and redo beside it. Starting over throws away
// every step's work, so it asks first.
//
// `showHistory` hides undo and redo. The 3D view turns them off: it only shows
// the room, so an undo there would change something the visitor cannot see.
// Start Over stays, because it is about the whole plan rather than the view.
export function PlanStatusBar({
  room,
  layout,
  capacity,
  onReset,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showHistory = true,
}) {
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const mod = mac ? "⌘" : "Ctrl+";
  const roomType = classifyRoomType({ layout, room });
  const area = room.length * room.width;
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-5 gap-y-2 lg:mb-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <Stat icon={Building2} label="Room type">
          <span className="font-semibold text-white">{roomType}</span>
        </Stat>
        <Stat icon={Users} label="Capacity">
          {capacity ? `${capacity} ${capacity === 1 ? "person" : "people"}` : "No seating yet"}
        </Stat>
        <Stat icon={Ruler} label="Room size">
          {room.length.toFixed(1)} × {room.width.toFixed(1)} m <span className="text-white/45">· {area.toFixed(1)} m²</span>
        </Stat>
      </div>
      <div className="-mr-2 flex items-center gap-0.5">
        {showHistory && (
          <>
            <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title={`Undo (${mod}Z)`} className={ICON_BUTTON}>
              <Undo2 className="h-4 w-4" />
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title={`Redo (${mod}${mac ? "⇧Z" : "Y"})`} className={ICON_BUTTON}>
              <Redo2 className="h-4 w-4" />
            </button>
          </>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="ml-1 flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-orange-400 transition-[background-color,color,transform] duration-100 hover:bg-orange-500/10 hover:text-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start Over
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rc-theme max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Start over?</AlertDialogTitle>
              <AlertDialogDescription>
                This clears everything you've entered (details, room, table, devices, photos and notes), including the
                draft saved in this browser, and takes you back to the start. It can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Editing</AlertDialogCancel>
              <AlertDialogAction onClick={onReset} className="bg-red-600 text-white hover:bg-red-700">
                Start Over
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
