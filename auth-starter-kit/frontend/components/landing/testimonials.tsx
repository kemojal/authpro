"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const testimonials = [
    {
      quote:
        "Implementing authentication used to be the most time-consuming part of our projects. With this solution, we cut our auth development time by 90% and improved security in the process.",
      author: "Sarah Chen",
      role: "CTO at TechFlow",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60",
    },
    {
      quote:
        "The documentation is excellent, the APIs are intuitive, and the support is responsive. We switched from a competitor and couldn't be happier with the decision.",
      author: "Michael Rodriguez",
      role: "Lead Developer at StartupX",
      avatar:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60",
    },
    {
      quote:
        "Security is our top priority, and after thorough evaluation, this authentication solution exceeded our requirements. The SSO implementation is particularly impressive.",
      author: "Priya Patel",
      role: "Security Engineer at SecureBank",
      avatar:
        "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=60",
    },
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
            What Our Users Say
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-muted-foreground max-w-[700px] mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join thousands of developers who have simplified their
            authentication workflows
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 * i }}
            >
              <Card className="h-full border-border/70 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="mb-4 text-primary">
                    <Quote className="h-7 w-7" />
                  </div>
                  <p className="text-muted-foreground italic">
                    {testimonial.quote}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center space-x-4 border-t border-border/50 pt-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{testimonial.author}</h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
