import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "../lib/utils";

/**
 * Scroll-linked parallax for a photo: the image drifts `distance` px against
 * the page as its frame crosses the viewport. Linked to scroll position, not
 * triggered by it, so it moves exactly as fast as the reader scrolls.
 *
 * The image is scaled 1.1 so the drift never exposes the frame's edge. Under
 * the OS reduced-motion setting neither the drift nor the scale is applied.
 * The frame needs a height of its own (e.g. min-h-*); the image fills it.
 */
export const ParallaxMedia = ({ children, className, distance = 24 }) => {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-distance, distance]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        style={reduceMotion ? undefined : { y, scale: 1.1 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
