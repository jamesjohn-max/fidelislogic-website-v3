import { createContext, useContext } from "react";

// The plan's colours, provided by RoomCanvas. A leaf of its own so CoverageOverlay can read
// them without importing RoomCanvas back (a cycle, which React Refresh turns into a dead bundle).
export const PaletteContext = createContext(null);
export const usePalette = () => useContext(PaletteContext);
