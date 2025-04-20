"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BellRing, Moon, SunMedium, Laptop } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import AuthMiddleware from "@/lib/auth-middleware";

export default function SettingsPage() {
  // Theme preferences
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    productUpdates: true,
  });

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value);
    // In a real app, you'd save this to localStorage or user preferences in the backend
  };

  const handleNotificationToggle = (
    setting: keyof typeof notificationSettings
  ) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    });
    // In a real app, you'd save this to user preferences in the backend
  };

  return (
    <AuthMiddleware requireAuth>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">Settings</h1>

          <div className="grid gap-6">
            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select your preferred theme
                  </p>
                  <RadioGroup
                    value={theme}
                    onValueChange={(value) =>
                      handleThemeChange(value as "light" | "dark" | "system")
                    }
                    className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="light" />
                      <Label htmlFor="light" className="flex items-center">
                        <SunMedium className="h-4 w-4 mr-2" />
                        Light
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="dark" />
                      <Label htmlFor="dark" className="flex items-center">
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="system" />
                      <Label htmlFor="system" className="flex items-center">
                        <Laptop className="h-4 w-4 mr-2" />
                        System
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Interface Density</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Adjust the spacing and density of the user interface
                  </p>
                  <RadioGroup
                    defaultValue="comfortable"
                    className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="compact" id="compact" />
                      <Label htmlFor="compact">Compact</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="comfortable" id="comfortable" />
                      <Label htmlFor="comfortable">Comfortable</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="email-notifications"
                        className="text-base"
                      >
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() =>
                        handleNotificationToggle("emailNotifications")
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing-emails" className="text-base">
                        Marketing Emails
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive marketing and promotional emails
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={() =>
                        handleNotificationToggle("marketingEmails")
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="security-alerts" className="text-base">
                        Security Alerts
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Get notified about security events like login attempts
                      </p>
                    </div>
                    <Switch
                      id="security-alerts"
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={() =>
                        handleNotificationToggle("securityAlerts")
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="product-updates" className="text-base">
                        Product Updates
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications about new features and updates
                      </p>
                    </div>
                    <Switch
                      id="product-updates"
                      checked={notificationSettings.productUpdates}
                      onCheckedChange={() =>
                        handleNotificationToggle("productUpdates")
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>
                  Manage your privacy settings and data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Data Collection</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose how your data is collected and used
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="analytics" className="text-base">
                        Analytics & Usage Data
                      </Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow collection of anonymous usage data to improve the
                        service
                      </p>
                    </div>
                    <Switch id="analytics" defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Account Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage your account data
                  </p>
                  <div className="flex space-x-4 pt-2">
                    <Button variant="outline">Download My Data</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </AuthMiddleware>
  );
}
