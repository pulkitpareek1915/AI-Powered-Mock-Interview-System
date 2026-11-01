const { z } = require("zod")

const registerSchema = z.object({
    username: z.string({ message: "Username is required" }).trim().min(3, "Username must be at least 3 characters").max(30),
    email: z.string({ message: "Email is required" }).trim().toLowerCase().email("Invalid email address").max(254),
    password: z.string({ message: "Password is required" }).min(8, "Password must be at least 8 characters").max(72)
})

const loginSchema = z.object({
    email: z.string({ message: "Email is required" }).trim().toLowerCase().email("Invalid email address"),
    password: z.string({ message: "Password is required" }).min(1, "Password is required").max(72)
})

// Rejects non-string values (like {"$ne": null}) and replaces req.body with the cleaned data
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({ message: result.error.issues[0].message })
    }
    req.body = result.data
    next()
}

module.exports = { registerSchema, loginSchema, validate }
