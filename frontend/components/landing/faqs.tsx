"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const faqs = [
    {
      question: "How secure is your authentication solution?",
      answer: "Our authentication system uses industry best practices including secure hashing, JWTs with appropriate expiration, HTTP-only cookies, and protection against common attacks like CSRF, XSS, and injection attacks. We also conduct regular security audits and penetration testing."
    },
    {
      question: "Can I migrate from another authentication provider?",
      answer: "Yes, we provide migration tools and guides to help you seamlessly move from Auth0, Firebase, Cognito, or custom solutions. Our team can also assist with complex migrations to ensure user data integrity."
    },
    {
      question: "Do you support multi-factor authentication (MFA)?",
      answer: "Absolutely. We support various second-factor authentication methods including SMS, email codes, authenticator apps (TOTP), security keys (WebAuthn/FIDO2), and biometric authentication where supported."
    },
    {
      question: "Can I customize the login and registration pages?",
      answer: "Yes, you have full control over the authentication UI. You can use our pre-built components and customize them to match your brand, or build entirely custom interfaces using our headless APIs."
    },
    {
      question: "Do you provide support for user management?",
      answer: "Our platform includes comprehensive user management features including user creation, profile updates, password resets, account deactivation/deletion, and administrative functions."
    },
    {
      question: "What programming languages and frameworks do you support?",
      answer: "We provide SDKs and libraries for major web and mobile platforms including JavaScript/TypeScript (React, Vue, Angular, Next.js), Node.js, Python, Ruby, Java, Swift, Kotlin, Flutter, and more."
    }
  ];

  return (
    <section className="py-16 md:py-24 flex flex-col items-center justify-center" ref={ref}>
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <motion.h2
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-[700px] mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Got questions? We've got answers.
          </motion.p>
        </div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-lg font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <p className="text-muted-foreground">
            Still have questions? <Link href="/contact" className="text-primary font-medium hover:underline">Contact our team</Link> for more information.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Add the missing Link import
import Link from "next/link";