const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

/**
 * @route GET /api/interview
 * @description get all interview reports for authenticated user
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportController)

/**
 * @route POST /api/interview
 * @description generate new interview report on the basis of user self description, resume pdf and job description
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterviewReportController)

/**
 * @route GET /api/interview/:interviewId
 * @description get interview report by ID
 * @access private
 */
interviewRouter.get("/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/:interviewId/resume-pdf
 * @description generate and download AI-tailored Human-written Resume PDF using Puppeteer
 * @access private
 */
interviewRouter.get("/:interviewId/resume-pdf", authMiddleware.authUser, interviewController.generateResumePdfController)

module.exports = interviewRouter