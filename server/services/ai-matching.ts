import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface MatchScore {
  score: number;
  explanation: string;
}

export async function calculateJobMatch(
  jobDescription: string,
  jobSkills: string[],
  freelancerBio: string,
  freelancerSkills: string[],
): Promise<MatchScore> {
  try {
    const prompt = `
      Analyze the compatibility between a job and a freelancer profile.

      Job Details:
      Description: ${jobDescription}
      Required Skills: ${jobSkills.join(", ")}

      Freelancer Profile:
      Bio: ${freelancerBio}
      Skills: ${freelancerSkills.join(", ")}

      Provide a JSON response with:
      1. A match score from 0 to 100
      2. A brief explanation of the score

      Focus on:
      - Skill match percentage
      - Experience relevance
      - Project requirements alignment

      Return only the JSON object with "score" and "explanation" keys.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    if (!completion.choices[0].message.content) {
      throw new Error("No response from OpenAI");
    }

    const response = JSON.parse(completion.choices[0].message.content);
    return {
      score: response.score,
      explanation: response.explanation,
    };
  } catch (error) {
    console.error("Error calculating job match:", error);

    // Fallback: Calculate a basic match score based on skill overlap
    const matchingSkills = jobSkills.filter(skill => 
      freelancerSkills.includes(skill)
    );

    const skillMatchPercentage = jobSkills.length > 0 
      ? (matchingSkills.length / jobSkills.length) * 100
      : 0;

    return {
      score: Math.round(skillMatchPercentage),
      explanation: `Basic match based on ${matchingSkills.length} overlapping skills`,
    };
  }
}

export async function getTopMatches(
  jobId: number,
  freelancers: any[],
  job: any,
  limit: number = 5
): Promise<Array<{ freelancer: any; score: number; explanation: string }>> {
  const matches = await Promise.all(
    freelancers.map(async (freelancer) => {
      const match = await calculateJobMatch(
        job.description,
        job.skills || [],
        freelancer.bio || "",
        freelancer.skills || []
      );

      return {
        freelancer,
        score: match.score,
        explanation: match.explanation,
      };
    })
  );

  // Sort by score in descending order and take top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}