import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Job, Proposal } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { user } = useAuth();

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: user?.role === "business",
  });

  const { data: proposals } = useQuery<Proposal[]>({
    queryKey: [`/api/freelancer/${user?.id}/proposals`],
    enabled: user?.role === "freelancer",
  });

  if (user?.role === "business") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.displayName}</h1>
            <p className="text-gray-600 mt-2">Manage your job postings and find the perfect freelancer</p>
          </div>
          <Link href="/post-job">
            <Button>Post a New Job</Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Active Jobs</CardTitle>
              <CardDescription>Jobs you've posted that are currently open</CardDescription>
            </CardHeader>
            <CardContent>
              {jobs?.filter(job => job.status === "open").map(job => (
                <div key={job.id} className="p-4 border rounded-lg mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                      <div className="flex gap-2 mt-2">
                        {job.skills.map(skill => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                    <Badge>{job.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.displayName}</h1>
          <p className="text-gray-600 mt-2">Find your next opportunity</p>
        </div>
        <Link href="/jobs">
          <Button>Browse Jobs</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Proposals</CardTitle>
            <CardDescription>Track the status of your job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {proposals?.map(proposal => (
              <div key={proposal.id} className="p-4 border rounded-lg mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">Job #{proposal.jobId}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Proposed Rate: ${proposal.proposedRate}/hr
                    </p>
                  </div>
                  <Badge>{proposal.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
