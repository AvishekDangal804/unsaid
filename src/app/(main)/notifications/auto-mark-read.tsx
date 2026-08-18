"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "./actions";

export function AutoMarkRead() {
  useEffect(() => {
    markAllNotificationsRead();
  }, []);

  return null;
}
