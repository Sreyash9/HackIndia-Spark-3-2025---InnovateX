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

export async function generateCareerAdvice(userMessage: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Error generating career advice:", error);
    throw new Error("Failed to generate career advice. Please try again later.");
  }
}