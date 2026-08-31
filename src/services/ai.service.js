const { GoogleGenAI, Type } = require("@google/genai")

const ai = new GoogleGenAI({
   apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GEN_API_KEY || process.env.GEMINI_API_KEY
})

async function generateInterviewReport({ title, resume, selfDescription, selfdescription, jobDescription, jobdescription }) {
  const jobTitle = title || ""
  const resumeText = resume || ""
  const selfDesc = selfDescription || selfdescription || ""
  const jobDesc = jobDescription || jobdescription || ""

  const prompt = `
You are an expert technical interviewer and hiring manager.
Analyze the candidate's target job title, resume, self description, and job description to generate a structured interview report:

${jobTitle ? `Target Job Title / Role: ${jobTitle}` : ''}

Candidate Resume:
${resumeText}

Candidate Self Description:
${selfDesc}

Job Description:
${jobDesc}
`

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
       responseMimeType: "application/json",
       responseSchema: {
          type: Type.OBJECT,
          properties: {
             title: { type: Type.STRING, description: "Professional role title or report header, e.g. Full Stack Developer Strategy" },
             matchScore: { type: Type.NUMBER, description: "Match score between 0 and 100" },
             technicalQuestions: {
                type: Type.ARRAY,
                description: "List of 4 to 6 technical questions with intention and model answer",
                items: {
                   type: Type.OBJECT,
                   properties: {
                      question: { type: Type.STRING },
                      intention: { type: Type.STRING },
                      answer: { type: Type.STRING }
                   },
                   required: ["question", "intention", "answer"]
                }
             },
             behaviouralQuestions: {
                type: Type.ARRAY,
                description: "List of 3 to 5 behavioral questions with intention and model answer",
                items: {
                   type: Type.OBJECT,
                   properties: {
                      question: { type: Type.STRING },
                      intention: { type: Type.STRING },
                      answer: { type: Type.STRING }
                   },
                   required: ["question", "intention", "answer"]
                }
             },
             skillGap: {
                type: Type.ARRAY,
                description: "List of key skill gaps identified",
                items: {
                   type: Type.OBJECT,
                   properties: {
                      skill: { type: Type.STRING },
                      severity: { type: Type.STRING, enum: ["low", "medium", "high"] }
                   },
                   required: ["skill", "severity"]
                }
             },
             preparationPlan: {
                type: Type.ARRAY,
                description: "Day wise preparation roadmap (3 to 7 days)",
                items: {
                   type: Type.OBJECT,
                   properties: {
                      day: { type: Type.NUMBER },
                      focus: { type: Type.STRING },
                      tasks: {
                         type: Type.ARRAY,
                         items: { type: Type.STRING }
                      }
                   },
                   required: ["day", "focus", "tasks"]
                }
             }
          },
          required: ["title", "matchScore", "technicalQuestions", "behaviouralQuestions", "skillGap", "preparationPlan"]
       }
    }
  })

  return JSON.parse(response.text)
}

module.exports = generateInterviewReport
