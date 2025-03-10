import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI Career Guide specialized in providing advice about technology careers, certifications, and skill development. Your responses should:

1. Focus on practical, actionable advice
2. Recommend relevant certifications and courses
3. Suggest skill development paths based on current job market trends
4. Provide specific resources when possible
5. Keep responses concise and structured

When recommending certifications or courses:
- Prioritize widely recognized certifications
- Consider the user's current skill level
- Explain why specific certifications are valuable
- Include estimated time commitments and prerequisites

For skill recommendations:
- Focus on in-demand technologies
- Suggest learning paths
- Consider both technical and soft skills
- Base advice on current industry trends

Always maintain a professional yet encouraging tone.`;

const FALLBACK_RESPONSES = {
  general: `I'm currently experiencing some technical limitations, but I can provide some general career advice:

1. Focus on in-demand skills like:
   - Full-stack development
   - Cloud computing (AWS, Azure, GCP)
   - Data Science & AI/ML
   - DevOps & CI/CD

2. Recommended certifications:
   - AWS Certified Developer
   - Microsoft Azure Fundamentals
   - Google Cloud Associate Engineer
   - CompTIA Security+

3. Learning platforms:
   - Coursera
   - Udemy
   - freeCodeCamp
   - LinkedIn Learning

Would you like to know more about any of these areas?`,

  skills: `Here are some key technical skills that are currently in high demand:

1. Programming Languages:
   - JavaScript/TypeScript
   - Python
   - Java
   - Go

2. Frameworks:
   - React/Next.js
   - Node.js
   - Django/Flask
   - Spring Boot

3. Tools & Technologies:
   - Docker & Kubernetes
   - Git
   - CI/CD tools
   - Cloud Platforms`,

  certifications: `Popular technology certifications that can boost your career:

1. Cloud:
   - AWS Solutions Architect
   - Google Cloud Professional
   - Azure Administrator

2. Development:
   - Oracle Java Certification
   - MongoDB Developer
   - Kubernetes Application Developer

3. Project Management:
   - PMP
   - Scrum Master
   - PRINCE2`
};

export async function generateCareerAdvice(userMessage: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error generating career advice:", error);

    // Provide relevant fallback responses based on keywords in the user's message
    const message = userMessage.toLowerCase();
    if (message.includes("skill") || message.includes("learn")) {
      return FALLBACK_RESPONSES.skills;
    } else if (message.includes("certif") || message.includes("course")) {
      return FALLBACK_RESPONSES.certifications;
    } else {
      return FALLBACK_RESPONSES.general;
    }
  }
}