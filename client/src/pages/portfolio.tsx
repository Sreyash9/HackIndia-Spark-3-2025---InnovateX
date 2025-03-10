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
import { Calendar, X } from "lucide-react";

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
                {user.portfolioProjects?.map((project: any, index) => (
                  <div key={index} className="border-b pb-6 last:border-0">
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    <p className="text-gray-600 mt-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.technologies?.map((tech: string) => (
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
                {user.workExperience?.map((work: any, index) => (
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
                {user.education?.map((edu: any, index) => (
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
                {user.certifications?.map((cert: any, index) => (
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

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Add your notable projects and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch("portfolioProjects")?.map((project: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Project #{index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const projects = form.getValues("portfolioProjects");
                          form.setValue(
                            "portfolioProjects",
                            projects.filter((_: any, i: number) => i !== index)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`portfolioProjects.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`portfolioProjects.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`portfolioProjects.${index}.link`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Link (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`portfolioProjects.${index}.technologies`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Technologies Used</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Type a technology and press Enter"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value) {
                                      const technologies = field.value || [];
                                      field.onChange([...technologies, value]);
                                      e.currentTarget.value = "";
                                    }
                                  }
                                }}
                              />
                            </FormControl>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {field.value?.map((tech: string, techIndex: number) => (
                                <Badge
                                  key={techIndex}
                                  variant="secondary"
                                  className="gap-1"
                                >
                                  {tech}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => {
                                      const technologies = field.value.filter(
                                        (_: string, i: number) => i !== techIndex
                                      );
                                      field.onChange(technologies);
                                    }}
                                  />
                                </Badge>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const projects = form.getValues("portfolioProjects") || [];
                    form.setValue("portfolioProjects", [
                      ...projects,
                      {
                        title: "",
                        description: "",
                        link: "",
                        technologies: [],
                      },
                    ]);
                  }}
                >
                  Add Project
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Work Experience Section */}
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>Add your professional experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch("workExperience")?.map((work: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Experience #{index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const experiences = form.getValues("workExperience");
                          form.setValue(
                            "workExperience",
                            experiences.filter((_: any, i: number) => i !== index)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`workExperience.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`workExperience.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`workExperience.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`workExperience.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date (or leave blank if current)</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`workExperience.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const experiences = form.getValues("workExperience") || [];
                    form.setValue("workExperience", [
                      ...experiences,
                      {
                        company: "",
                        position: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                      },
                    ]);
                  }}
                >
                  Add Work Experience
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Add your educational background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch("education")?.map((edu: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Education #{index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const education = form.getValues("education");
                          form.setValue(
                            "education",
                            education.filter((_: any, i: number) => i !== index)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`education.${index}.institution`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institution</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.degree`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Degree</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.fieldOfStudy`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field of Study</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`education.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date (or leave blank if current)</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const education = form.getValues("education") || [];
                    form.setValue("education", [
                      ...education,
                      {
                        institution: "",
                        degree: "",
                        fieldOfStudy: "",
                        startDate: "",
                        endDate: "",
                      },
                    ]);
                  }}
                >
                  Add Education
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Certifications Section */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Add your professional certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch("certifications")?.map((cert: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">Certification #{index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const certifications = form.getValues("certifications");
                          form.setValue(
                            "certifications",
                            certifications.filter((_: any, i: number) => i !== index)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certification Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.issuer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Issuing Organization</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Issued</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.link`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certificate Link (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const certifications = form.getValues("certifications") || [];
                    form.setValue("certifications", [
                      ...certifications,
                      {
                        name: "",
                        issuer: "",
                        date: "",
                        link: "",
                      },
                    ]);
                  }}
                >
                  Add Certification
                </Button>
              </div>
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