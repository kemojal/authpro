"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        formatError: (error) => {
          if (typeof error === "string") return error;
          if (error && typeof error === "object") {
            return error.message || JSON.stringify(error);
          }
          return "An unknown error occurred";
        },
      }}
    />
  );
}
