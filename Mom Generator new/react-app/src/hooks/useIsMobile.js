import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Safety check
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    );

    const handleChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    handleChange();

    // Listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () =>
        mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Safari support
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isMobile;
}
