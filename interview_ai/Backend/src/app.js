const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const { apiLimiter } = require("./middlewares/rateLimit.middleware")

const app = express()

// trust the proxy only in production (Render, Nginx, etc.); locally it would let clients spoof their IP
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1)
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

// cors first, so every response (including errors and 429s) carries CORS headers
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}))

app.use(express.json({ limit: "100kb" }))
app.use(cookieParser())
app.use("/api", apiLimiter)

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* unknown routes */
app.use((req, res) => {
    res.status(404).json({ message: "Route not found." })
})

/* central error handler (must be last, must have 4 parameters) */
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ message: "Invalid JSON body." })
    if (err.type === "entity.too.large") return res.status(413).json({ message: "Request body too large." })
    if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ message: "File too large (max 3 MB)." })
    if (err.code === "INVALID_FILE_TYPE") return res.status(400).json({ message: err.message })
    if (err.name === "ValidationError") return res.status(400).json({ message: err.message })
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid id." })

    console.error(err)
    res.status(500).json({ message: "Something went wrong on the server." })
})

module.exports = app
