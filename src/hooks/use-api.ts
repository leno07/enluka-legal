"use client";

import { useAuth } from "@/providers/auth-provider";
import { useCallback } from "react";

export function useApi() {
  const { accessToken } = useAuth();

  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      if (
        options.body &&
        typeof options.body === "string" &&
        !headers["Content-Type"]
      ) {
        headers["Content-Type"] = "application/json";
      }

      const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    [accessToken]
  );

  return { apiFetch };
}
