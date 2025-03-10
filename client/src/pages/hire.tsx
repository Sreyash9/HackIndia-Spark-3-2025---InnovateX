import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Star } from "lucide-react";

interface RecommendedFreelancer {
  freelancer: User;
  score: number;
  explanation: string;
}

export default function HirePage() {
  const { user } = useAuth();
  const { data: freelancers = [], isLoading: isLoadingFreelancers } = useQuery<User[]>({
    queryKey: ["/api/freelancers"],
    enabled: user?.role === "business",
  });

  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ["/api/business/jobs/active"],
    enabled: !!user && user.role === "business",
  });

  const { data: recommendedFreelancers = {}, isLoading: isLoadingRecommended } = useQuery<Record<number, RecommendedFreelancer[]>>({
    queryKey: ["/api/recommended-freelancers", jobs],
    enabled: jobs.length > 0 && user?.role === "business",
    queryFn: async () => {
      const recommendations: Record<number, RecommendedFreelancer[]> = {};
      for (const job of jobs) {
        const res = await fetch(`/api/jobs/${job.id}/recommended-freelancers`);
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        recommendations[job.id] = await res.json();
      }
      return recommendations;
    },
  });

  if (!user || user.role !== "business") {
    return <div>Access denied. Only business users can view this page.</div>;
  }

  const isLoading = isLoadingFreelancers || isLoadingJobs || isLoadingRecommended;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Hire Talented Freelancers</h1>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Freelancers</TabsTrigger>
          {jobs.map(job => (
            <TabsTrigger key={job.id} value={`job-${job.id}`}>
              {job.title}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          {isLoadingFreelancers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => (
                <FreelancerCard key={freelancer.id} freelancer={freelancer} />
              ))}
            </div>
          )}
        </TabsContent>

        {jobs.map(job => (
          <TabsContent key={job.id} value={`job-${job.id}`}>
            {isLoadingRecommended ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h2 className="font-semibold mb-2">Job Details</h2>
                  <p>{job.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.skills?.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <h2 className="text-xl font-semibold">AI-Recommended Matches</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedFreelancers[job.id]?.map(({ freelancer, score, explanation }) => (
                    <FreelancerCard
                      key={freelancer.id}
                      freelancer={freelancer}
                      matchScore={score}
                      matchExplanation={explanation}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function FreelancerCard({ 
  freelancer, 
  matchScore, 
  matchExplanation 
}: { 
  freelancer: User; 
  matchScore?: number;
  matchExplanation?: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl text-gray-500">
            {freelancer.displayName[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{freelancer.displayName}</h3>
            <p className="text-sm text-gray-600">
              {freelancer.hourlyRate ? `$${freelancer.hourlyRate}/hr` : 'Rate not specified'}
            </p>
          </div>
        </div>

        {matchScore !== undefined && (
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{matchScore}% Match</span>
            <p className="text-sm text-muted-foreground mt-1">{matchExplanation}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {freelancer.bio || 'No bio provided'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {freelancer.skills?.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>

        <Link href={`/freelancer/${freelancer.id}`}>
          <Button className="w-full">View Profile</Button>
        </Link>
      </CardContent>
    </Card>
  );
}