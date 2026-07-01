import { useEffect, useState } from "react";

const MD_MEDIA = "(min-width: 768px)";

/** True when viewport is at least the trade terminal desktop breakpoint (768px). */
export function useMinMdViewport(): boolean {
  const [matches, setMatches] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(MD_MEDIA);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return matches;
}
