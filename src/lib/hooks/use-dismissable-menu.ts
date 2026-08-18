"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useDismissableMenu<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  setOpen: (open: boolean) => void,
  triggerRef?: RefObject<HTMLElement | null>,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef?.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  return ref;
}
