"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LucideShield, User, Clock } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AuthMiddleware from "@/lib/auth-middleware";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Fetch protected data with React Query
  const {
    data: protectedData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["protectedData"],
    queryFn: async () => {
      const { data } = await api.getProtectedData();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Show error toast if API call fails
  useEffect(() => {
    if (error) {
      toast.error("Failed to load protected data");
    }
  }, [error]);

  return (
    <AuthMiddleware requireAuth>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Profile</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-medium">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <User size={16} className="text-gray-500" />
                    <span>Account ID: {user?.id?.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock size={16} className="text-gray-500" />
                    <span>
                      Last Login:{" "}
                      {user?.last_login
                        ? new Date(user.last_login).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <LucideShield size={16} className="text-gray-500" />
                    <span>
                      Roles:{" "}
                      {user?.roles?.map((role) => role.name).join(", ") ||
                        "No roles assigned"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>

            {/* Protected Data Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Protected Data</CardTitle>
                <CardDescription>
                  Information from a protected API endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    <p>Failed to load data</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p>Successfully accessed protected endpoint!</p>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(protectedData, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  Update Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  Two-Factor Authentication
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AuthMiddleware>
  );
}
