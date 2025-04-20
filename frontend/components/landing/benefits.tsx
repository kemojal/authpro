"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { 
  Clock, Shield, Rocket, Code, Server, Lock
} from "lucide-react";

export default function Benefits() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const benefits = [
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Save Development Time",
      description: "Implement authentication in hours instead of weeks. Focus on your core features and let us handle the security complexities."
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: "Enterprise-Grade Security",
      description: "Built on industry best practices with regular security audits, penetration testing, and compliance with OWASP top 10."
    },
    {
      icon: <Rocket className="h-10 w-10 text-primary" />,
      title: "Scale With Confidence",
      description: "Our infrastructure handles millions of authentications daily, with 99.99% uptime and automatic scaling during traffic surges."
    },
    {
      icon: <Code className="h-10 w-10 text-primary" />,
      title: "Developer Experience",
      description: "Clean, well-documented APIs with SDK support for major frameworks. Implement complex flows with simple components."
    },
    {
      icon: <Server className="h-10 w-10 text-primary" />,
      title: "Managed Infrastructure",
      description: "No need to maintain authentication servers or databases. We handle updates, patches, and scaling automatically."
    },
    {
      icon: <Lock className="h-10 w-10 text-primary" />,
      title: "Compliance Ready",
      description: "Stay compliant with GDPR, CCPA, SOC 2, and other regulations with built-in privacy controls and audit logs."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/50 flex flex-col items-center justify-center" ref={ref}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Why Choose Our Solution?
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-[800px] mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Focus on building great products while we handle the authentication complexities
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-border p-6 bg-card transition-all hover:shadow-md hover:border-primary/20"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}