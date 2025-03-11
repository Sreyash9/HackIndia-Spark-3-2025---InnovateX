import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobRequest {
  id: number;
  jobId: number;
  freelancerId: number;
  status: string;
  job: {
    title: string;
    description: string;
    budget: number;
  };
  business: {
    displayName: string;
    username: string;
  };
}

export default function JobRequests() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: jobRequests = [], isLoading } = useQuery<JobRequest[]>({
    queryKey: ["/api/freelancer/job-requests"],
    enabled: !!user && user.role === "freelancer",
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/freelancer/job-requests"] });
      toast({
        title: "Success",
        description: "Job request updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== "freelancer") {
    return <div>Access denied. Only freelancers can view this page.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Job Requests</h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {jobRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No job requests yet</p>
          ) : (
            jobRequests
              .filter(request => request.status !== "rejected")
              .map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle>{request.job.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">From {request.business.displayName}</p>
                        <p className="mt-2">{request.job.description}</p>
                        <p className="mt-2 font-medium">Budget: ${request.job.budget}</p>
                      </div>

                      {request.status === "applied" && (
                        <div className="flex gap-4">
                          <Button 
                            onClick={() => updateRequestMutation.mutate({
                              proposalId: request.id,
                              status: "approved"
                            })}
                            disabled={updateRequestMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => updateRequestMutation.mutate({
                              proposalId: request.id,
                              status: "rejected"
                            })}
                            disabled={updateRequestMutation.isPending}
                            className="text-red-600 hover:text-red-600"
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {request.status !== "applied" && (
                        <Badge className={
                          request.status === "approved" ? "bg-green-100 text-green-800" :
                          request.status === "rejected" ? "bg-red-100 text-red-800" :
                          ""
                        }>
                          {request.status === "approved" ? "Accepted" : 
                           request.status === "rejected" ? "Declined" : 
                           request.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      )}
    </div>
  );
}