"use client";

import { RegisterForm } from "@/components/auth/register-form";
import AuthMiddleware from "@/lib/auth-middleware";

export default function RegisterPage() {
  return (
    <AuthMiddleware>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <RegisterForm />
        </div>
      </div>
    </AuthMiddleware>
  );
}
