"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import api from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function verifyEmail() {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        await api.verifyEmail(token);
        setStatus("success");
        setMessage("Your email has been successfully verified!");
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.detail ||
            "Failed to verify email. The token may be invalid or expired."
        );
      }
    }

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Email Verification
            </CardTitle>
            <CardDescription className="text-center">
              {status === "loading" ? "Verifying your email..." : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            )}
            {status === "success" && (
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
            )}
            <p className="text-center text-lg">{message}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            {status !== "loading" && (
              <Button onClick={() => router.push("/profile")}>
                Go to Profile
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
