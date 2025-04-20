"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ShieldCheck,
  LockKeyhole,
  KeyRound,
  Users,
  RefreshCw,
  Shield,
  Check,
  Database,
  Clock,
  GitBranch,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    {
      icon: <LockKeyhole className="h-12 w-12 text-blue-500" />,
      title: "Passwordless Auth",
      description:
        "Offer users a frictionless experience with magic link and WebAuthn biometric login options.",
      color: "blue",
    },
    {
      icon: <Users className="h-12 w-12 text-indigo-500" />,
      title: "Social Login",
      description:
        "Integrate with all major providers including Google, Facebook, Twitter, and GitHub.",
      color: "indigo",
    },
    {
      icon: <KeyRound className="h-12 w-12 text-violet-500" />,
      title: "Secure JWT Tokens",
      description:
        "Implement HTTP-only cookies with secure, encrypted JWT tokens for maximum security.",
      color: "violet",
    },
    {
      icon: <Shield className="h-12 w-12 text-purple-500" />,
      title: "Role Management",
      description:
        "Define custom roles and permissions with a flexible, scalable access control system.",
      color: "purple",
    },
    {
      icon: <RefreshCw className="h-12 w-12 text-pink-500" />,
      title: "Token Rotation",
      description:
        "Automatic refresh tokens with configurable expiration and rotation policies.",
      color: "pink",
    },
    {
      icon: <Database className="h-12 w-12 text-red-500" />,
      title: "User Metadata",
      description:
        "Store custom user data and preferences alongside authentication information.",
      color: "red",
    },
    {
      icon: <Clock className="h-12 w-12 text-orange-500" />,
      title: "Session Management",
      description:
        "View and manage active sessions with the ability to force logout from any device.",
      color: "orange",
    },
    {
      icon: <GitBranch className="h-12 w-12 text-amber-500" />,
      title: "Extensible API",
      description:
        "Customize the authentication flow with webhooks and middleware integration.",
      color: "amber",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="py-16 md:py-24 flex flex-col items-center justify-center" ref={ref}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.p
            className="text-sm font-medium text-primary mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            POWERFUL FEATURES
          </motion.p>
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Everything You Need to{" "}
            <span className="text-primary">Secure Your App</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-[800px] mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our authentication platform provides all the tools and features
            required for modern, secure applications - from simple email logins
            to complex enterprise deployments.
          </motion.p>
        </div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={container}
          initial="hidden"
          animate={isInView ? "show" : "hidden"}
        >
          {features.map((feature, i) => (
            <motion.div key={i} variants={item}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader>
                  <div
                    className={`p-3 rounded-lg inline-block bg-${feature.color}-50 dark:bg-${feature.color}-900/20`}
                  >
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-lg font-medium">
            And many more features to explore...
          </p>
        </motion.div>
      </div>
    </section>
  );
}
