const pdfModule = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const interviewReportModel = require("../models/interviwReport.model")
const { generateResumePdf } = require("../services/resume.service")

async function extractTextFromPdf(buffer) {
  if (typeof pdfModule === "function") {
    const data = await pdfModule(buffer)
    return data.text
  }
  if (pdfModule && pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse(Uint8Array.from(buffer))
    const data = await parser.getText()
    return typeof data === "string" ? data : (data.text || "")
  }
  throw new Error("Unable to parse PDF buffer with installed pdf-parse version")
}

async function generateInterviewReportController(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume PDF file is required" })
    }

    const resumeContent = await extractTextFromPdf(req.file.buffer)

    const title = req.body.title || req.body.jobTitle || req.body.role || ""
    const selfDescription = req.body.selfDescription || req.body.selfdescription
    const jobDescription = req.body.jobDescription || req.body["job description"] || req.body.jobdescription

    if (!selfDescription || !jobDescription) {
      return res.status(400).json({ message: "selfDescription and jobDescription are required" })
    }

    const interviewReportByAi = await generateInterviewReport({
      title,
      resume: resumeContent,
      selfDescription,
      jobDescription
    })

    const finalTitle = title || interviewReportByAi.title || "Interview Strategy Report"

    const interviewReport = await interviewReportModel.create({
      user: req.user?.id || req.user?._id,
      title: finalTitle,
      resume: resumeContent,
      selfDescription,
      jobDescription,
      ...interviewReportByAi
    })

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport
    })
  } catch (err) {
    console.error("Error in generateInterviewReportController:", err)
    res.status(500).json({ message: "Server error generating interview report", error: err.message })
  }
}

async function getInterviewReportByIdController(req, res) {
  try {
    const userId = req.user?.id || req.user?._id
    // Strict user isolation: user can only see their own report
    const interviewReport = await interviewReportModel.findOne({
      _id: req.params.interviewId,
      user: userId
    })

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found or access denied" })
    }
    res.status(200).json({ interviewReport })
  } catch (err) {
    console.error("Error in getInterviewReportByIdController:", err)
    res.status(500).json({ message: "Server error fetching report", error: err.message })
  }
}

async function getAllInterviewReportController(req, res) {
  try {
    const userId = req.user?.id || req.user?._id
    // Strict user isolation: only fetch reports for the logged in user
    const reports = await interviewReportModel.find({ user: userId }).sort({ createdAt: -1 })
    res.status(200).json({
      message: "Interview reports fetched successfully",
      reports
    })
  } catch (err) {
    console.error("Error in getAllInterviewReportController:", err)
    res.status(500).json({ message: "Server error fetching reports", error: err.message })
  }
}

async function generateResumePdfController(req, res) {
  try {
    const userId = req.user?.id || req.user?._id
    // Strict user isolation: user can only generate PDF for their own report
    const interviewReport = await interviewReportModel.findOne({
      _id: req.params.interviewId,
      user: userId
    })

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found or access denied" })
    }

    const { pdfBuffer, filename } = await generateResumePdf({
      title: interviewReport.title,
      resume: interviewReport.resume,
      selfDescription: interviewReport.selfDescription,
      jobDescription: interviewReport.jobDescription
    })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (err) {
    console.error("Error in generateResumePdfController:", err)
    res.status(500).json({ message: "Server error generating resume PDF", error: err.message })
  }
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportController,
  generateResumePdfController
}