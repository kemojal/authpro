"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Shield, Lock, User } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import AuthMiddleware from "@/lib/auth-middleware";
import { useAuthStore, useIsAdmin } from "@/lib/store";
import api from "@/lib/api";

// Mock user data
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    is_verified: true,
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    roles: [{ name: "admin" }, { name: "user" }],
  },
  {
    id: "2",
    email: "john@example.com",
    first_name: "John",
    last_name: "Doe",
    is_verified: true,
    is_active: true,
    created_at: "2023-01-02T00:00:00Z",
    roles: [{ name: "user" }],
  },
  {
    id: "3",
    email: "jane@example.com",
    first_name: "Jane",
    last_name: "Smith",
    is_verified: false,
    is_active: true,
    created_at: "2023-01-03T00:00:00Z",
    roles: [{ name: "user" }],
  },
];

export default function AdminPage() {
  const { user } = useAuthStore();
  const isAdmin = useIsAdmin();
  const [users, setUsers] = useState(mockUsers);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch admin data with React Query
  const {
    data: adminData,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["adminData"],
    queryFn: async () => {
      const { data } = await api.getAdminData();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: isAdmin, // Only run if user is admin
  });

  // Show error toast if API call fails
  useEffect(() => {
    if (error) {
      toast.error("Failed to load admin data");
    }
  }, [error]);

  // Handle role toggle
  const handleRoleToggle = (userId: string, role: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          const hasRole = user.roles.some((r) => r.name === role);
          if (hasRole) {
            return {
              ...user,
              roles: user.roles.filter((r) => r.name !== role),
            };
          } else {
            return {
              ...user,
              roles: [...user.roles, { name: role }],
            };
          }
        }
        return user;
      })
    );
  };

  // Handle user activation/deactivation
  const handleToggleActive = (userId: string) => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            is_active: !user.is_active,
          };
        }
        return user;
      })
    );
  };

  // Handle edit user dialog
  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // Get user role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AuthMiddleware requireAuth requireAdmin>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Site Settings
              </Button>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Admin Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Users</CardTitle>
                <CardDescription>All registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            {/* Active Users Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Users with active accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {users.filter((u) => u.is_active).length}
                </div>
              </CardContent>
            </Card>

            {/* Admin Users Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Users with admin privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {
                    users.filter((u) => u.roles.some((r) => r.name === "admin"))
                      .length
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Information Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
              <CardDescription>
                Your admin credentials and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Failed to load admin data</p>
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
                  <p className="text-lg">
                    You are logged in as an administrator with elevated
                    privileges.
                  </p>
                  {adminData && (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
                      {JSON.stringify(adminData, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Management Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.first_name} {user.last_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "success" : "destructive"}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_verified ? "outline" : "secondary"}
                        >
                          {user.is_verified ? "Verified" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role.name}
                              variant={getRoleBadgeVariant(role.name)}
                            >
                              {role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={user.is_active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleActive(user.id)}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Edit user information and roles
                </DialogDescription>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        defaultValue={selectedUser.first_name}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        defaultValue={selectedUser.last_name}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={selectedUser.email}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedUser.roles.some(
                            (r: any) => r.name === "user"
                          )}
                          onCheckedChange={() =>
                            handleRoleToggle(selectedUser.id, "user")
                          }
                          id="user-role"
                        />
                        <Label htmlFor="user-role">User</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedUser.roles.some(
                            (r: any) => r.name === "admin"
                          )}
                          onCheckedChange={() =>
                            handleRoleToggle(selectedUser.id, "admin")
                          }
                          id="admin-role"
                        />
                        <Label htmlFor="admin-role">Admin</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={selectedUser.is_active}
                      onCheckedChange={() =>
                        handleToggleActive(selectedUser.id)
                      }
                      id="account-active"
                    />
                    <Label htmlFor="account-active">Account Active</Label>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("User updated successfully");
                    setIsEditDialogOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </AuthMiddleware>
  );
}
