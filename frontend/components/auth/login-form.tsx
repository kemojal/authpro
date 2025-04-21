"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useAuthStore } from "@/lib/store";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Add a 2FA verification dialog
function TwoFactorVerificationDialog() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { verify2FALogin, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verify2FALogin(code);
      // If successful, redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      // Error state is handled by the store
      console.error("2FA verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500">
          Enter the verification code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="2fa-code">Verification Code</Label>
          <Input
            id="2fa-code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-11 px-4 bg-background/50 dark:bg-background/30 border-border/60 focus:border-primary/60 transition-all duration-200 rounded-lg"
            maxLength={6}
            required
          />
        </div>

        <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
          <Button
            type="submit"
            className="w-full h-11 font-medium rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
            disabled={isLoading || code.length < 6}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                <span>Verifying...</span>
              </div>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const {
    login,
    loginWithGoogle,
    error,
    isLoading,
    clearError,
    loginVerificationRequired,
  } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle store errors with useEffect
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  async function onSubmit(data: LoginFormValues) {
    try {
      // Clear any existing errors
      form.clearErrors();

      console.log("Form submitted. Attempting login with:", {
        email: data.email,
      });

      // Add specific timeout notification
      const loginTimeoutWarning = setTimeout(() => {
        toast.loading(
          "Login attempt is taking longer than expected. Please wait..."
        );
      }, 3000);

      await login(data.email, data.password);

      // Clear timeout if login succeeds
      clearTimeout(loginTimeoutWarning);

      // Check auth state after login
      console.log("Login successful, checking authentication state...");

      // If we get here, login was successful
      toast.success("Login successful!");

      // Small delay before redirect to ensure state is updated
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: unknown) {
      // Error is already handled by the store through useEffect
      console.error("Login error:", err);

      // Display more specific network errors
      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          toast.error(
            "Login request timed out. Please check your internet connection and verify the backend server is running."
          );
        } else if (err.message.includes("Network Error")) {
          toast.error(
            "Network error. Please check if the backend server is running at http://localhost:8000"
          );
        } else if (err.message.includes("No access token")) {
          toast.error(
            "Login succeeded but no access token was received. Please check your backend configuration."
          );
        }
      }

      // If we have validation errors, display them in the form
      const anyError = err as any;
      if (
        anyError?.response?.status === 422 &&
        anyError?.response?.data?.detail
      ) {
        const validationErrors = anyError.response.data.detail;

        // Check if the error is about missing fields
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((error) => {
            const fieldName = error.loc[1];
            if (fieldName === "username" || fieldName === "email") {
              form.setError("email", {
                type: "manual",
                message: error.msg,
              });
            } else if (fieldName === "password") {
              form.setError("password", {
                type: "manual",
                message: error.msg,
              });
            }
          });
        }
      } else if (anyError?.response?.status === 401) {
        // Special handling for unauthorized
        form.setError("email", {
          type: "manual",
          message: "Invalid email or password",
        });
        form.setError("password", {
          type: "manual",
          message: "Invalid email or password",
        });
      }
    }
  }

  async function handleGoogleLogin() {
    try {
      await loginWithGoogle();
      // No toast needed here as the page will redirect to Google
    } catch (error) {
      // Error is handled by the store
    }
  }

  // If 2FA verification is required, show the verification dialog
  if (loginVerificationRequired) {
    return <TwoFactorVerificationDialog />;
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 font-medium">
                  Email
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input
                      placeholder="email@example.com"
                      className="h-11 px-4 bg-background/50 dark:bg-background/30 border-border/60 focus:border-primary/60 transition-all duration-200 rounded-lg"
                      {...field}
                    />
                    <div className="absolute inset-0 rounded-lg border border-primary/0 group-hover:border-primary/10 pointer-events-none transition-all duration-300"></div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-medium" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel className="text-foreground/80 font-medium">
                    Password
                  </FormLabel>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs font-medium text-primary/80 hover:text-primary"
                  >
                    Forgot password?
                  </Button>
                </div>
                <FormControl>
                  <div className="relative group">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-11 px-4 bg-background/50 dark:bg-background/30 border-border/60 focus:border-primary/60 transition-all duration-200 rounded-lg"
                      {...field}
                    />
                    <div className="absolute inset-0 rounded-lg border border-primary/0 group-hover:border-primary/10 pointer-events-none transition-all duration-300"></div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs font-medium" />
              </FormItem>
            )}
          />
          <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 font-medium rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200 shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.1)]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60 dark:border-border/40"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="outline"
          className="w-full h-11 font-medium border-border/60 bg-background/50 dark:bg-background/20 hover:bg-background/80 rounded-lg text-foreground/90 transition-all duration-200"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </motion.div>

      <div className="mt-6 text-center">
        <Button
          variant="link"
          onClick={() => router.push("/register")}
          className="text-sm font-medium text-muted-foreground hover:text-primary"
        >
          Don&apos;t have an account?{" "}
          <span className="text-primary font-medium ml-1">Register</span>
        </Button>
      </div>
    </div>
  );
}
