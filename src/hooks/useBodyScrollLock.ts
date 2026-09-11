import { useEffect } from "react";

let activeLocks = 0;
let lockedScrollY = 0;
let previousStyles = {
  position: "",
  top: "",
  width: "",
  overflow: "",
};

export function useBodyScrollLock(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const body = document.body;
    if (activeLocks === 0) {
      lockedScrollY = window.scrollY;
      previousStyles = {
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        overflow: body.style.overflow,
      };
      body.style.position = "fixed";
      body.style.top = `-${lockedScrollY}px`;
      body.style.width = "100%";
      body.style.overflow = "hidden";
    }
    activeLocks += 1;

    return () => {
      activeLocks -= 1;
      if (activeLocks > 0) return;

      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.width = previousStyles.width;
      body.style.overflow = previousStyles.overflow;
      window.scrollTo(0, lockedScrollY);
    };
  }, [enabled]);
}