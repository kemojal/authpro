"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Newsletter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    
    // In a real app, this would submit to an API
    toast.success("Thanks for subscribing!");
    setEmail("");
  };

  return (
    <section 
      className="py-16 md:py-24 relative overflow-hidden flex flex-col items-center justify-center" 
      ref={ref}
    >
      {/* Background elements */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      
      <div className="container px-4 md:px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm p-8 md:p-12"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Stay Updated
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Subscribe to our newsletter for the latest authentication best practices,
                security updates, and product news.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-grow">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit">
                Subscribe
              </Button>
            </form>
            
            <p className="text-sm text-muted-foreground mt-4 text-center">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}