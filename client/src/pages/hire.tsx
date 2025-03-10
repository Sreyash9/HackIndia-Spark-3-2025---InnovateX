import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function HirePage() {
  const { user } = useAuth();
  const { data: freelancers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/freelancers"],
    enabled: user?.role === "business",
  });

  if (!user || user.role !== "business") {
    return <div>Access denied. Only business users can view this page.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Hire Talented Freelancers</h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <Card key={freelancer.id} className="hover:shadow-lg transition-shadow">
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
          ))}
        </div>
      )}
    </div>
  );
}