import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";

export default function Portfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      ...user,
      portfolioTitle: user?.portfolioTitle || "",
      portfolioSummary: user?.portfolioSummary || "",
      portfolioProjects: user?.portfolioProjects || [],
      education: user?.education || [],
      workExperience: user?.workExperience || [],
      certifications: user?.certifications || [],
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your portfolio has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== "freelancer") {
    return null;
  }

  if (!isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{user.portfolioTitle || user.displayName}</h1>
            <p className="text-gray-600 mt-2">{user.portfolioSummary || user.bio}</p>
          </div>
          <Button onClick={() => setIsEditing(true)}>Edit Portfolio</Button>
        </div>

        <div className="space-y-8">
          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.skills?.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {user.portfolioProjects?.map((project, index) => (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <p className="text-gray-600 mt-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.technologies.map((tech) => (
                        <Badge key={tech} variant="outline">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline mt-2 inline-block"
                      >
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Experience Section */}
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {user.workExperience?.map((work, index) => (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <h3 className="text-xl font-semibold">{work.position}</h3>
                    <p className="text-gray-600">
                      {work.company} · {work.startDate} - {work.endDate || "Present"}
                    </p>
                    <p className="mt-2">{work.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {user.education?.map((edu, index) => (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <h3 className="text-xl font-semibold">{edu.degree}</h3>
                    <p className="text-gray-600">
                      {edu.institution} · {edu.fieldOfStudy}
                    </p>
                    <p className="text-gray-500">
                      {edu.startDate} - {edu.endDate || "Present"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications Section */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {user.certifications?.map((cert, index) => (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <h3 className="text-xl font-semibold">{cert.name}</h3>
                    <p className="text-gray-600">
                      {cert.issuer} · {cert.date}
                    </p>
                    {cert.link && (
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline mt-2 inline-block"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="portfolioTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full Stack Developer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portfolioSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Write a brief summary about yourself and your expertise..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
