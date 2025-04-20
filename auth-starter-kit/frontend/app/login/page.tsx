"use client";

import { useEffect } from "react";
import { LoginForm } from "@/components/auth/login-form";
import AuthMiddleware from "@/lib/auth-middleware";

export default function LoginPage() {
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
