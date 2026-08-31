const { GoogleGenAI, Type } = require("@google/genai")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
   apiKey: process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GEN_API_KEY || process.env.GEMINI_API_KEY
})

/**
 * Generate AI-tailored Human-written Resume Data in structured JSON
 */
async function generateTailoredResumeData({ title, resume, selfDescription, jobDescription }) {
  const prompt = `
You are a senior executive resume writer and hiring director with 15+ years of experience crafting top 1% resumes.
Your task is to write a tailored, highly professional, 100% human-sounding resume for the candidate targeting this specific role.

Candidate's Original Resume / Background:
${resume || 'Experienced software professional with strong technical background'}

Candidate's Self Description:
${selfDescription || ''}

Target Job / Role:
${title || 'Software Engineering Professional'}

Target Job Description:
${jobDescription || ''}

Guidelines for Human-Written Quality:
- Write in strong, active, natural human voice — NO generic AI cliches ("spearheaded synergy", "passionate developer", "leverage dynamic solutions").
- Tailor technical skills, projects, and work experience bullet points to match the target job description.
- Use the STAR format (Action + Context + Quantified Impact / Result) for experience bullet points.
- Ensure all sections are complete, realistic, and highly compelling to engineering hiring managers.
`

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fullName: { type: Type.STRING },
          headline: { type: Type.STRING },
          contact: {
            type: Type.OBJECT,
            properties: {
              email: { type: Type.STRING },
              phone: { type: Type.STRING },
              location: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              github: { type: Type.STRING },
              portfolio: { type: Type.STRING }
            },
            required: ["email", "location"]
          },
          summary: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "e.g. Languages & Frameworks, Cloud & DevOps, Databases, Tools" },
                items: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["category", "items"]
            }
          },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING },
                company: { type: Type.STRING },
                location: { type: Type.STRING },
                period: { type: Type.STRING },
                highlights: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["role", "company", "period", "highlights"]
            }
          },
          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                techStack: { type: Type.STRING },
                description: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "techStack", "description"]
            }
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING },
                institution: { type: Type.STRING },
                year: { type: Type.STRING },
                details: { type: Type.STRING }
              },
              required: ["degree", "institution", "year"]
            }
          }
        },
        required: ["fullName", "headline", "contact", "summary", "skills", "experience", "education"]
      }
    }
  })

  return JSON.parse(response.text)
}

/**
 * Render structured resume data to clean, human-crafted modern HTML
 */
function buildResumeHtml(data) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.5;
    font-size: 10.5pt;
    padding: 24px 28px;
  }
  .header {
    border-bottom: 2px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .header h1 {
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    text-transform: uppercase;
  }
  .header .headline {
    font-size: 11.5pt;
    font-weight: 600;
    color: #4338ca;
    margin-top: 2px;
    margin-bottom: 6px;
  }
  .contact-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 9pt;
    color: #475569;
  }
  .contact-bar span {
    display: inline-flex;
    align-items: center;
  }
  .section {
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 3px;
    margin-bottom: 8px;
  }
  .summary-text {
    font-size: 9.8pt;
    color: #334155;
    text-align: justify;
    line-height: 1.55;
  }
  .skills-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .skill-row {
    font-size: 9.5pt;
    line-height: 1.45;
  }
  .skill-category {
    font-weight: 700;
    color: #0f172a;
  }
  .skill-items {
    color: #334155;
  }
  .item-group {
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .item-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f172a;
  }
  .item-company {
    font-size: 10pt;
    font-weight: 600;
    color: #4338ca;
  }
  .item-meta {
    font-size: 9pt;
    color: #64748b;
    font-weight: 500;
  }
  ul.bullet-list {
    margin-top: 4px;
    padding-left: 18px;
  }
  ul.bullet-list li {
    font-size: 9.5pt;
    color: #334155;
    margin-bottom: 3px;
    line-height: 1.45;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${data.fullName || "Professional Candidate"}</h1>
    <div class="headline">${data.headline || "Software Engineer"}</div>
    <div class="contact-bar">
      ${data.contact?.email ? `<span>✉ ${data.contact.email}</span>` : ''}
      ${data.contact?.phone ? `<span>📱 ${data.contact.phone}</span>` : ''}
      ${data.contact?.location ? `<span>📍 ${data.contact.location}</span>` : ''}
      ${data.contact?.linkedin ? `<span>🔗 ${data.contact.linkedin}</span>` : ''}
      ${data.contact?.github ? `<span>💻 ${data.contact.github}</span>` : ''}
      ${data.contact?.portfolio ? `<span>🌐 ${data.contact.portfolio}</span>` : ''}
    </div>
  </div>

  ${data.summary ? `
  <div class="section">
    <div class="section-title">Professional Summary</div>
    <p class="summary-text">${data.summary}</p>
  </div>` : ''}

  ${data.skills && data.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">Technical Skills & Competencies</div>
    <div class="skills-grid">
      ${data.skills.map(s => `
        <div class="skill-row">
          <span class="skill-category">${s.category}:</span>
          <span class="skill-items">${s.items.join(', ')}</span>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  ${data.experience && data.experience.length > 0 ? `
  <div class="section">
    <div class="section-title">Work Experience</div>
    ${data.experience.map(exp => `
      <div class="item-group">
        <div class="item-header">
          <div>
            <span class="item-title">${exp.role}</span> &mdash; <span class="item-company">${exp.company}</span>
            ${exp.location ? `<span class="item-meta">, ${exp.location}</span>` : ''}
          </div>
          <div class="item-meta">${exp.period}</div>
        </div>
        ${exp.highlights && exp.highlights.length > 0 ? `
        <ul class="bullet-list">
          ${exp.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>` : ''}
      </div>
    `).join('')}
  </div>` : ''}

  ${data.projects && data.projects.length > 0 ? `
  <div class="section">
    <div class="section-title">Key Engineering Projects</div>
    ${data.projects.map(proj => `
      <div class="item-group">
        <div class="item-header">
          <span class="item-title">${proj.name}</span>
          <span class="item-meta">${proj.techStack}</span>
        </div>
        ${proj.description && proj.description.length > 0 ? `
        <ul class="bullet-list">
          ${proj.description.map(d => `<li>${d}</li>`).join('')}
        </ul>` : ''}
      </div>
    `).join('')}
  </div>` : ''}

  ${data.education && data.education.length > 0 ? `
  <div class="section">
    <div class="section-title">Education & Credentials</div>
    ${data.education.map(edu => `
      <div class="item-group">
        <div class="item-header">
          <div>
            <span class="item-title">${edu.degree}</span> &mdash; <span class="item-company">${edu.institution}</span>
          </div>
          <div class="item-meta">${edu.year}</div>
        </div>
        ${edu.details ? `<div class="item-meta" style="margin-top: 2px;">${edu.details}</div>` : ''}
      </div>
    `).join('')}
  </div>` : ''}
</body>
</html>`
}

/**
 * Generate Resume PDF with Puppeteer
 */
async function generateResumePdf({ title, resume, selfDescription, jobDescription }) {
  const resumeData = await generateTailoredResumeData({ title, resume, selfDescription, jobDescription })
  const htmlContent = buildResumeHtml(resumeData)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--no-zygote",
      "--disable-extensions"
    ]
  })

  try {
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "domcontentloaded" })
    await page.emulateMediaType("screen")

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        bottom: "12mm",
        left: "12mm",
        right: "12mm"
      }
    })

    return {
      pdfBuffer,
      resumeData,
      filename: `${(resumeData.fullName || "Resume").replace(/\s+/g, "_")}_Tailored_Resume.pdf`
    }
  } finally {
    await browser.close()
  }
}

module.exports = { generateResumePdf }
