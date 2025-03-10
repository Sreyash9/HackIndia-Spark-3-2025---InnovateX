import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Job } from "@shared/schema";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function FreelancerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const { data: freelancer, isLoading: isLoadingFreelancer, error: freelancerError } = useQuery<User>({
    queryKey: [`/api/freelancers/${id}`],
    enabled: !!id && !!user && user.role === "business",
    retry: 1,
    onError: (error: Error) => {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const { data: activeJobs = [], isLoading: isLoadingJobs } = useQuery<Job[]>({
    queryKey: ["/api/business/jobs/active"],
    enabled: !!user && user.role === "business",
  });

  const offerJobMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobId) throw new Error("Please select a job");
      const res = await apiRequest("POST", "/api/job-requests", {
        jobId: selectedJobId,
        freelancerId: parseInt(id!),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job request sent successfully",
      });
      setSelectedJobId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending job request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (freelancerError) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Failed to load profile</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  if (isLoadingFreelancer || !freelancer) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500">
              {freelancer.displayName[0].toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-2xl">{freelancer.displayName}</CardTitle>
              <CardDescription>
                {freelancer.hourlyRate ? `$${freelancer.hourlyRate}/hr` : 'Rate not specified'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-gray-600">{freelancer.bio || 'No bio provided'}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {freelancer.portfolioProjects && freelancer.portfolioProjects.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Portfolio Projects</h3>
                <div className="grid gap-4">
                  {freelancer.portfolioProjects.map((project, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold">{project.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {user?.role === "business" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">Offer a Job</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select a Job to Offer</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    {isLoadingJobs ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : activeJobs.length === 0 ? (
                      <p className="text-center text-muted-foreground">No active jobs available</p>
                    ) : (
                      <RadioGroup
                        value={selectedJobId?.toString()}
                        onValueChange={(value) => setSelectedJobId(parseInt(value))}
                        className="space-y-2"
                      >
                        {activeJobs.map((job) => (
                          <div key={job.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={job.id.toString()} id={`job-${job.id}`} />
                            <Label htmlFor={`job-${job.id}`} className="w-full">
                              <div className="border rounded-md p-3 hover:bg-accent cursor-pointer">
                                <h4 className="font-medium">{job.title}</h4>
                                <p className="text-sm text-muted-foreground">{job.description}</p>
                                <p className="text-sm font-medium mt-1">Budget: ${job.budget}</p>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                  <Button
                    onClick={() => offerJobMutation.mutate()}
                    disabled={!selectedJobId || offerJobMutation.isPending}
                    className="w-full"
                  >
                    {offerJobMutation.isPending ? "Sending..." : "Send Job Request"}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}