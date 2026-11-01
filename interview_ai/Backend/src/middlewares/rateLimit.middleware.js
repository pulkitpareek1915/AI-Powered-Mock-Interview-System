const rateLimit = require("express-rate-limit")

// 10 failed login attempts per 15 minutes per IP (successful logins don't count)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." }
})

// 10 registrations per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many accounts created. Try again later." }
})

// 5 new reports per hour per USER (each report costs a Gemini call)
// must run after authUser, because it reads req.user
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    keyGenerator: (req) => req.user.id,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Report limit reached. Try again later." }
})

// broad safety net for the whole API: 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Slow down." }
})

module.exports = { loginLimiter, registerLimiter, reportLimiter, apiLimiter }
