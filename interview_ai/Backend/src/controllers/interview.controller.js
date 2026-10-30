const pdfParse = require("pdf-parse")
const crypto = require("crypto")   
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


// removes harmless differences (extra spaces, line breaks) before hashing
const normalize = (s = "") => s.trim().replace(/\s+/g, " ")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    

    
    const { selfDescription, jobDescription } = req.body

    //  basic input checks (jobDescription is required by the schema)
    if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required." })
    }

    //  do not crash when no file is uploaded (self-description-only path)
    let resumeText = ""
    if (req.file) {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        resumeText = resumeContent.text
    }

    if (!resumeText && !selfDescription) {
        return res.status(400).json({ message: "Provide a resume or a self description." })
    }


     //  fingerprint of the three inputs (SHA-256, not bcrypt, so the same input gives the same hash)
    const inputHash = crypto
        .createHash("sha256")
        .update(JSON.stringify([
            normalize(resumeText),
            normalize(selfDescription),
            normalize(jobDescription)
        ]))
        .digest("hex")

   
    const existing = await interviewReportModel.findOne({ user: req.user.id, inputHash })
    if (existing) {
        return res.status(200).json({
            message: "Report already exists for this resume and job description.",
            interviewReport: existing
        })
    }

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

     //  try/catch for the duplicate-key race, and trusted fields after the AI spread
    let interviewReport
    try {
        interviewReport = await interviewReportModel.create({
            ...interViewReportByAi,
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            inputHash                                                        // NEW
        })
    } catch (err) {
        // an identical request saved first, so return that one
        if (err.code === 11000) {
            const winner = await interviewReportModel.findOne({ user: req.user.id, inputHash })
            return res.status(200).json({
                message: "Report already exists for this resume and job description.",
                interviewReport: winner
            })
        }
        throw err
    }

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findOne({
    _id: interviewReportId,
    user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
