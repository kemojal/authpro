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
import api from "@/lib/api";

const registerSchema = z
  .object({
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  // Handle form error with useEffect
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Register the user
      await api.register({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });

      // Log in with the new credentials
      await login(data.email, data.password);

      toast.success("Registration successful!");
      router.push("/dashboard");
    } catch (err: any) {
      // Handle different error formats from API
      let errorMessage = "Registration failed";

      if (err.response) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">
                    First Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        placeholder="John"
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
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80 font-medium">
                    Last Name
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        placeholder="Doe"
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
          </div>

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
                <FormLabel className="text-foreground/80 font-medium">
                  Password
                </FormLabel>
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

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground/80 font-medium">
                  Confirm Password
                </FormLabel>
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
                  <span>Creating account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </motion.div>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Already have an account?{" "}
              <span className="text-primary font-medium ml-1">Sign in</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
