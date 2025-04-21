"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthMiddleware from "@/lib/auth-middleware";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

export default function VerificationPendingPage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  // Function to resend verification email
  const handleResendVerification = async () => {
    setResending(true);
    try {
      await api.resendVerification();
      toast.success("Verification email sent. Please check your inbox.");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resend verification email";
      toast.error(errorMessage);
    } finally {
      setResending(false);
    }
  };

  // Function to check verification status
  const checkVerificationStatus = async () => {
    setChecking(true);
    try {
      await fetchUser();

      // Get the user again after refresh
      const { user } = useAuthStore.getState();

      if (user?.is_verified) {
        toast.success("Your email is verified!");
        router.push("/dashboard");
      } else {
        toast.info("Your email is not verified yet. Please check your inbox.");
      }
    } catch (error) {
      toast.error("Failed to check verification status");
    } finally {
      setChecking(false);
    }
  };

  // If user is already verified, redirect to dashboard
  if (user?.is_verified) {
    router.push("/dashboard");
    return null;
  }

  return (
    <AuthMiddleware requireAuth>
      <div className="container max-w-md mx-auto py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-center">
                We've sent a verification email to{" "}
                <span className="font-medium">{user?.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Please check your inbox and click the verification link to
                activate your account. You need to verify your email before you
                can access your dashboard.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, check your spam folder or click
                below to resend.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Resending...
                  </>
                ) : (
                  <>Resend Verification Email</>
                )}
              </Button>

              <Button
                className="w-full"
                onClick={checkVerificationStatus}
                disabled={checking}
              >
                {checking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Checking...
                  </>
                ) : (
                  <>
                    I've Verified My Email{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </AuthMiddleware>
  );
}
