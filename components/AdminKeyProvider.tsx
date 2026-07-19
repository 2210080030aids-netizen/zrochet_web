"use client";

import { createContext, useCallback, useContext } from "react";

const AdminKeyContext = createContext<string>("");

export function AdminKeyProvider({
  adminKey,
  children,
}: {
  adminKey: string;
  children: React.ReactNode;
}) {
  return <AdminKeyContext.Provider value={adminKey}>{children}</AdminKeyContext.Provider>;
}

export function appendAdminKey(path: string, key: string): string {
  if (!key) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}key=${encodeURIComponent(key)}`;
}

export function useAdminKey(): string {
  return useContext(AdminKeyContext);
}

/**
 * Returns a helper that appends the admin secret key to any admin path, so the
 * key is preserved across client-side navigation (router.push / Link).
 */
export function useAdminHref(): (path: string) => string {
  const key = useAdminKey();
  return useCallback((path: string) => appendAdminKey(path, key), [key]);
}
