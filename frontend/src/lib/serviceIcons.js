// Maps the `icon` name stored on each service in data/services.json to its
// lucide component. Explicit imports keep the bundle from pulling in the whole
// icon set (as `import * as LucideIcons` would).
import {
  Compass,
  Wrench,
  Headphones,
  Video,
  ClipboardCheck,
  RefreshCw,
  Truck,
  GraduationCap
} from "lucide-react";

export const serviceIcons = {
  Compass,
  Wrench,
  Headphones,
  Video,
  ClipboardCheck,
  RefreshCw,
  Truck,
  GraduationCap
};

export const getServiceIcon = (name) => serviceIcons[name] || Compass;
