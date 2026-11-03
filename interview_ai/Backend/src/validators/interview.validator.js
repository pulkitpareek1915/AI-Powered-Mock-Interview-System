const { z } = require("zod")

const reportSchema = z.object({
    jobDescription: z
        .string({ message: "Job description is required" })
        .trim()
        .min(20, "Job description is too short")
        .max(10000, "Job description is too long (max 10000 characters)"),
    selfDescription: z
        .string({ message: "Self description must be text" })
        .trim()
        .max(5000, "Self description is too long (max 5000 characters)")
        .default("")
})

module.exports = { reportSchema }
