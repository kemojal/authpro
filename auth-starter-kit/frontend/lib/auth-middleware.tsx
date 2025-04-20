"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

interface AuthMiddlewareProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export default function AuthMiddleware({
  children,
  requireAuth = false,
  requireAdmin = false,
}: AuthMiddlewareProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, fetchUser, isLoading } = useAuthStore();

  // Use refs to track if we've already attempted certain actions
  const hasFetchedUser = useRef(false);
  const hasRedirected = useRef(false);

  // Check if user has admin role
  const isAdmin = user?.roles?.some((role) => role.name === "admin") || false;

  useEffect(() => {
    // Reset tracking refs when authentication state changes
    if (!isLoading) {
      hasRedirected.current = false;
    }

    // Add some debug logging (only once per state change)
    console.log("AuthMiddleware state:", {
      isAuthenticated,
      isLoading,
      requireAuth,
      requireAdmin,
      pathname,
      user: user ? `${user.email} (${user.id})` : "null",
      cookies: document.cookie
        ? document.cookie.substring(0, 40) + "..."
        : "None",
      hasFetchedUser: hasFetchedUser.current,
      hasRedirected: hasRedirected.current,
    });

    // Attempt to fetch user only once if needed and not already loading
    if (!isLoading && !isAuthenticated && !hasFetchedUser.current) {
      console.log("Attempting to fetch user data");
      hasFetchedUser.current = true; // Mark that we've attempted to fetch

      fetchUser().catch((error) => {
        console.error("Failed to fetch user:", error);
        // Only redirect to login if this is a protected route and we haven't already redirected
        if (requireAuth && !hasRedirected.current) {
          console.log("Redirecting to login");
          hasRedirected.current = true;
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      });

      return; // Exit early to prevent multiple actions in the same effect cycle
    }

    // Redirect logic (only if not already loading and not already redirected)
    if (!isLoading && !hasRedirected.current) {
      // Redirect unauthenticated users away from protected routes
      if (requireAuth && !isAuthenticated) {
        console.log("Protected route, redirecting to login");
        hasRedirected.current = true;
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Redirect authenticated users away from auth pages (login/register)
      if (
        isAuthenticated &&
        (pathname === "/login" || pathname === "/register")
      ) {
        console.log("Already authenticated, redirecting to dashboard");
        hasRedirected.current = true;
        router.push("/dashboard");
        return;
      }

      // Redirect non-admin users away from admin routes
      if (requireAdmin && (!isAuthenticated || !isAdmin)) {
        console.log("Admin route, user is not admin, redirecting to dashboard");
        hasRedirected.current = true;
        router.push("/dashboard");
        return;
      }
    }
  }, [
    isAuthenticated,
    isAdmin,
    isLoading,
    pathname,
    requireAuth,
    requireAdmin,
    router,
    fetchUser,
    user,
  ]);

  // Reset fetch tracking when component unmounts or key dependencies change
  useEffect(() => {
    return () => {
      hasFetchedUser.current = false;
    };
  }, [pathname, isAuthenticated]);

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render children if authentication requirements are met
  if (
    (requireAuth && isAuthenticated) ||
    (requireAdmin && isAdmin) ||
    !requireAuth
  ) {
    return <>{children}</>;
  }

  // Render nothing while redirecting
  return null;
}
