"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const plans = [
    {
      name: "Free",
      description: "Perfect for side projects and personal use",
      price: "$0",
      period: "per month",
      features: [
        "Up to 1,000 active users",
        "Email/password authentication",
        "OAuth providers (Google, GitHub)",
        "Basic user management",
        "Community support"
      ],
      cta: "Start Free",
      link: "/register",
      highlighted: false
    },
    {
      name: "Pro",
      description: "Ideal for growing startups and businesses",
      price: "$29",
      period: "per month",
      features: [
        "Up to 10,000 active users",
        "All Free features",
        "Advanced security features",
        "Custom branding",
        "Priority support",
        "User roles and permissions",
        "Multiple team members"
      ],
      cta: "Get Started",
      link: "/register?plan=pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      description: "For large organizations with custom needs",
      price: "Custom",
      period: "pricing",
      features: [
        "Unlimited active users",
        "All Pro features",
        "Dedicated support",
        "Custom integrations",
        "SSO and SAML",
        "SLA guarantees",
        "On-premise deployment option",
        "Compliance assistance"
      ],
      cta: "Contact Sales",
      link: "/contact",
      highlighted: false
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30 flex flex-col items-center justify-center" id="pricing" ref={ref}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.p
            className="text-sm font-medium text-primary mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            PRICING
          </motion.p>
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-[700px] mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Choose the plan that fits your needs. All plans include our core authentication features.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              className="flex flex-col h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
            >
              <div 
                className={`rounded-xl border ${plan.highlighted ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'} 
                  bg-card flex flex-col h-full overflow-hidden`}
              >
                {plan.highlighted && (
                  <div className="bg-primary py-2 text-center">
                    <span className="text-sm font-medium text-primary-foreground">MOST POPULAR</span>
                  </div>
                )}
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-end">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <Link href={plan.link}>
                      <Button 
                        className="w-full" 
                        variant={plan.highlighted ? "default" : "outline"}
                        size="lg"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}