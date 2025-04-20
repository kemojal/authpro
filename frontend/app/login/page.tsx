"use client";

import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import AuthMiddleware from "@/lib/auth-middleware";
import { useAuthStore } from "@/lib/store";

export default function LoginPage() {
  // Ensure we reset any problematic auth state when landing on login page
  useEffect(() => {
    // Reset stored auth failure tracking
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_last_failure_time");
      localStorage.removeItem("auth_failure_count");
    }
  }, []);

  return (
    <AuthMiddleware>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <LoginForm />
        </div>
      </div>
    </AuthMiddleware>
  );
}
