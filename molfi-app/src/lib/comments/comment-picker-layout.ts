import { useEffect, useState } from "react";
import { useMinMdViewport } from "@/hooks/use-min-md-viewport";

const VIEWPORT_PADDING = 16;
const MAX_PICKER_WIDTH = 360;
const MAX_PICKER_HEIGHT = 360;
const MIN_PICKER_WIDTH = 260;
const MIN_PICKER_HEIGHT = 240;

export function useCommentPickerLayout() {
  const isDesktop = useMinMdViewport();
  const [size, setSize] = useState({ width: 320, height: 360 });

  useEffect(() => {
    const update = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 768;

      const width = Math.min(
        MAX_PICKER_WIDTH,
        Math.max(MIN_PICKER_WIDTH, viewportWidth - VIEWPORT_PADDING * 2),
      );
      const height = Math.min(
        MAX_PICKER_HEIGHT,
        Math.max(MIN_PICKER_HEIGHT, Math.floor(viewportHeight * (isMobile ? 0.42 : 0.5))),
      );

      setSize({ width, height });
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return {
    width: size.width,
    height: size.height,
    scrollHeight: Math.max(MIN_PICKER_HEIGHT - 96, size.height - 96),
    isDesktop,
    popoverProps: {
      side: "top" as const,
      align: isDesktop ? ("start" as const) : ("center" as const),
      collisionPadding: VIEWPORT_PADDING,
      sideOffset: 8,
      avoidCollisions: true,
    },
  };
}
