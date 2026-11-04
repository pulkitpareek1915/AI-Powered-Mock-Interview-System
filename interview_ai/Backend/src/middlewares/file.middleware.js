const multer = require("multer")

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024,   // 3MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            const err = new Error("Only PDF files are allowed.")
            err.code = "INVALID_FILE_TYPE"
            return cb(err)
        }
        cb(null, true)
    }
})

module.exports = upload
