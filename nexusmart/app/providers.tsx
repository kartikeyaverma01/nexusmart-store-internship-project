"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

// The curly braces around { children } here are also critical!
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}