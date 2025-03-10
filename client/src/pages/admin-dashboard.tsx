import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Redirect non-admin users
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/admin/jobs"],
  });

  if (isLoadingUsers || isLoadingJobs) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users?.map((user: any) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-sm text-gray-600">{user.username}</p>
                      <Badge>{user.role}</Badge>
                    </div>
                    <Button variant="destructive" size="sm">
                      Suspend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs</CardTitle>
            <CardDescription>Monitor job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs?.map((job: any) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-gray-600">Budget: ${job.budget}</p>
                      <Badge>{job.status}</Badge>
                    </div>
                    <Button variant="destructive" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}