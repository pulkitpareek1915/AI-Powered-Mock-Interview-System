require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET is missing or too short (use at least 32 random characters).")
    process.exit(1)
}

const PORT = process.env.PORT || 3000

connectToDB()
    .then(() => {
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
    })
    .catch((err) => {
        console.error("Database connection failed:", err)
        process.exit(1)
    })
