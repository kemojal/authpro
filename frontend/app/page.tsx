"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/footer";
import Features from "@/components/landing/features";
import Benefits from "@/components/landing/benefits";
import Testimonials from "@/components/landing/testimonials";
import Pricing from "@/components/landing/pricing";
import FAQ from "@/components/landing/faqs";
import Newsletter from "@/components/landing/newsletter";

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <section className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
              <motion.div
                className="flex flex-col justify-center space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    <span className="mr-2">🚀</span> Now available in Beta
                  </motion.div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Authentication that{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      just works
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-lg text-gray-600 dark:text-gray-400 md:text-xl">
                    Stop wasting time on auth. Our drop-in solution provides
                    enterprise-grade security with email/password, social
                    logins, and role-based access — ready in under 10 minutes.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  {isAuthenticated ? (
                    <Link href="/dashboard" className="w-full sm:w-auto">
                      <Button
                        size="lg"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/register" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Start for Free
                        </Button>
                      </Link>
                      <Link href="/login" className="w-full sm:w-auto">
                        <Button
                          size="lg"
                          variant="outline"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-4 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 border-2 border-white dark:border-gray-800"
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">1,500+</span> developers
                      trust our auth
                    </p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-4 w-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-xs text-gray-500">4.9/5</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative w-full max-w-xl">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 blur-xl"></div>
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl">
                    <div className="p-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center">
                      <div className="flex space-x-2 p-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-6 text-center">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-6 h-6 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold">
                          Enterprise Security, Developer Simplicity
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                          All the features you need, none of the complexity
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            icon: "🔒",
                            title: "Email & Password",
                            desc: "Secure hashing & validation",
                          },
                          {
                            icon: "🌐",
                            title: "Social Logins",
                            desc: "Google, GitHub, Apple & more",
                          },
                          {
                            icon: "🛡️",
                            title: "JWT Tokens",
                            desc: "HTTP-only secure cookies",
                          },
                          {
                            icon: "👥",
                            title: "Role Management",
                            desc: "Fine-grained access control",
                          },
                          {
                            icon: "🔄",
                            title: "Token Rotation",
                            desc: "Automatic refresh tokens",
                          },
                          {
                            icon: "🚧",
                            title: "Protected Routes",
                            desc: "Middleware protection",
                          },
                        ].map((feature, i) => (
                          <motion.div
                            key={i}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                            whileHover={{ y: -2 }}
                          >
                            <div className="text-2xl mb-2">{feature.icon}</div>
                            <h4 className="font-medium">{feature.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {feature.desc}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                      <div className="mt-6 text-center">
                        <Link
                          href="/docs"
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View API Documentation →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center rounded-lg bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-4">
                <span className="mr-2">⚡</span> Built for modern developers
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Auth shouldn't be a roadblock
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Focus on building your product, not reinventing auth security
                patterns
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Developer First",
                  description:
                    "Clean APIs, SDK support for React, Vue, and Angular, with comprehensive docs to integrate in minutes.",
                  icon: "💻",
                },
                {
                  title: "Production Ready",
                  description:
                    "Battle-tested security patterns used by Fortune 500 companies with 99.99% uptime SLA.",
                  icon: "🏭",
                },
                {
                  title: "Always Secure",
                  description:
                    "Regular security audits and updates to protect against emerging threats and OWASP Top 10.",
                  icon: "🔐",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-2xl mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-2xl font-bold text-center mb-12">
                Trusted by innovative teams
              </h2>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
                {[
                  "Company 1",
                  "Company 2",
                  "Company 3",
                  "Company 4",
                  "Company 5",
                ].map((company, i) => (
                  <div
                    key={i}
                    className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-12 md:py-24 bg-white dark:bg-gray-900 rounded-3xl my-12">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center mb-4">
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="h-6 w-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <blockquote className="text-2xl font-medium mb-6">
                "We implemented this auth solution in our SaaS product and cut
                our development time by 3 weeks. The security is rock-solid and
                our users love the seamless login experience."
              </blockquote>
              <div className="flex items-center justify-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                <div className="text-left">
                  <p className="font-medium">Sarah Chen</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    CTO at TechStartup
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to secure your application?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Get started for free. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-lg"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/demo" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 text-lg"
                  >
                    Request Demo
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Free plan includes up to 1,000 monthly active users
              </p>
            </div>
          </div>
        </section>
      </div>
      <Features />
      <Benefits />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
}
