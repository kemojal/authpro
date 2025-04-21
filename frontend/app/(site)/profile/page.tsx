"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, User, Mail, CheckCircle, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import AuthMiddleware from "@/lib/auth-middleware";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

// Schema for profile form
const profileFormSchema = z.object({
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address" })
    .readonly(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
  });

  // Reset form when user data changes
  // if (
  //   user &&
  //   (user.first_name !== form.getValues().first_name ||
  //     user.last_name !== form.getValues().last_name ||
  //     user.email !== form.getValues().email)
  // ) {
  //   form.reset({
  //     first_name: user.first_name || "",
  //     last_name: user.last_name || "",
  //     email: user.email || "",
  //   });
  // }
  useEffect(() => {
    if (
      user &&
      (user.first_name !== form.getValues().first_name ||
        user.last_name !== form.getValues().last_name ||
        user.email !== form.getValues().email)
    ) {
      form.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  // Update profile mutation
  const mutation = useMutation({
    mutationFn: (data: Partial<ProfileFormValues>) => {
      return api.updateProfile(data);
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      fetchUser(); // Refresh user data
      queryClient.invalidateQueries({ queryKey: ["protectedData"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    },
  });

  // Form submission handler
  function onSubmit(data: ProfileFormValues) {
    mutation.mutate({
      first_name: data.first_name,
      last_name: data.last_name,
    });
  }

  // Toggle edit mode
  function toggleEdit() {
    if (isEditing) {
      form.reset({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
      });
    }
    setIsEditing(!isEditing);
  }

  return (
    <AuthMiddleware requireAuth>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Profile</h1>
            <Button
              onClick={toggleEdit}
              variant={isEditing ? "destructive" : "default"}
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            {/* Profile sidebar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-blue-500 text-white text-xl">
                      {user?.first_name?.[0]}
                      {user?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-xl font-bold">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>

                  <Separator />

                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Email Verified
                      </span>
                      {user?.is_verified ? (
                        <Badge
                          variant="success"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-800"
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Unverified
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Account Type</span>
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 text-blue-800"
                      >
                        {user?.oauth_provider || "Email"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Roles</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {user?.roles?.map((role) => (
                          <Badge key={role.name} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main profile content */}
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John"
                                    {...field}
                                    disabled={!isEditing || mutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Doe"
                                    {...field}
                                    disabled={!isEditing || mutation.isPending}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="john.doe@example.com"
                                  {...field}
                                  disabled={true}
                                />
                              </FormControl>
                              <FormDescription>
                                Your email cannot be changed
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {isEditing && (
                          <Button
                            type="submit"
                            className="w-full md:w-auto"
                            disabled={mutation.isPending}
                          >
                            {mutation.isPending ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        )}
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Change Password</h3>
                      <p className="text-sm text-gray-500">
                        Update your password to keep your account secure
                      </p>
                      <Button variant="outline">Change Password</Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">
                        Connected Accounts
                      </h3>
                      <p className="text-sm text-gray-500">
                        Manage your connected social accounts
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                            <span>Google</span>
                          </div>
                          <Badge
                            variant={
                              user?.oauth_provider === "google"
                                ? "default"
                                : "outline"
                            }
                          >
                            {user?.oauth_provider === "google"
                              ? "Connected"
                              : "Connect"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      </div>
    </AuthMiddleware>
  );
}
