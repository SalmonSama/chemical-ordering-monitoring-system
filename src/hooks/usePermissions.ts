"use client";

import { useUser } from "@/hooks/useUser";
import type { UserRole } from "@/types/database.types";

/** Route access matrix — which roles can access which path prefixes. */
const ACCESS_MATRIX: Record<string, UserRole[]> = {
  "/dashboard":           ["admin", "requester", "focal_point", "staff", "compliance"],
  "/orders/new":          ["admin", "requester", "staff"],
  "/orders":              ["admin", "requester", "focal_point", "staff", "compliance"],
  "/approvals":           ["admin", "focal_point"],
  "/check-in":            ["admin", "staff"],
  "/check-out":           ["admin", "requester", "staff"],
  "/inventory":           ["admin", "requester", "focal_point", "staff", "compliance"],
  "/peroxide":            ["admin", "staff", "compliance"],
  "/shelf-life":          ["admin", "staff", "compliance"],
  "/regulatory":          ["admin", "compliance"],
  "/transactions":        ["admin", "requester", "focal_point", "staff", "compliance"],
  "/settings":            ["admin", "requester", "focal_point", "staff", "compliance"],
  "/admin/users":         ["admin"],
  "/admin/items":         ["admin"],
  "/admin/villages":      ["admin"],
  "/admin/settings":      ["admin"],
};

export function usePermissions() {
  const { profile } = useUser();
  const role = profile?.role;

  function canAccess(path: string): boolean {
    if (!role) return false;
    // Find the most specific matching prefix
    const match = Object.keys(ACCESS_MATRIX)
      .filter((prefix) => path.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0];
    if (!match) return true; // unregistered paths: allow
    return ACCESS_MATRIX[match].includes(role);
  }

  const isAdmin = role === "admin";
  const isFocalPoint = role === "focal_point";
  const isStaff = role === "staff";
  const isCompliance = role === "compliance";
  const isRequester = role === "requester";

  return { role, canAccess, isAdmin, isFocalPoint, isStaff, isCompliance, isRequester };
}
