import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DataTable } from "@/components/ui/data-table";
import { Loader2, UserX, UserCheck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["/api/admin/jobs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/jobs");
      return res.json();
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      </div>
    );
  }

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      toast({
        title: "Success",
        description: `User ${currentStatus ? "deactivated" : "activated"} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loadingUsers || loadingJobs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
            <CardDescription>Platform users count</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{users?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Jobs</CardTitle>
            <CardDescription>Open positions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {jobs?.filter((job: any) => job.status === "open").length || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>Platform revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">$0</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users?.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {u.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{u.displayName}</p>
                        <p className="text-sm text-gray-600">{u.username}</p>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role}
                        </Badge>
                      </div>
                    </div>
                    {u.role !== "admin" && (
                      <Button
                        variant={u.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                      >
                        {u.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>Monitor and manage job postings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobs?.map((job: any) => (
                  <div key={job.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-gray-600">{job.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge>{job.status}</Badge>
                          <Badge variant="outline">${job.budget}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          try {
                            await apiRequest("PATCH", `/api/admin/jobs/${job.id}`, {
                              status: "closed",
                            });
                            toast({
                              title: "Success",
                              description: "Job closed successfully",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Close Job
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
