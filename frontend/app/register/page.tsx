"use client";

import { RegisterForm } from "@/components/auth/register-form";
import AuthMiddleware from "@/lib/auth-middleware";
import { motion } from "framer-motion";

export default function RegisterPage() {
  return (
    <AuthMiddleware>
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/5 dark:from-background dark:via-background/98 dark:to-primary/10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background opacity-60 dark:from-primary/10 dark:via-background/80 dark:to-background"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md px-4 py-8"
        >
          <div className="absolute inset-0 bg-card/20 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl dark:bg-card/30 dark:border-border/20 -z-10"></div>

          <div className="px-6 py-8">
            <div className="flex flex-col items-center mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-primary">
                AuthPro
              </h1>
              <p className="text-muted-foreground mt-1 text-center">
                Create your account to get started
              </p>
            </div>

            <RegisterForm />
          </div>
        </motion.div>
      </div>
    </AuthMiddleware>
  );
}
