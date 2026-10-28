const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true      // so A@x.com and a@x.com count as the same email
    },
    password: {
        type: String,
        required: true
    }
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel
