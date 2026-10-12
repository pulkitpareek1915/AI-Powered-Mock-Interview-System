const mongoose = require('mongoose')


const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "token is required"],
    index: true            // fast lookup, no more full collection scan
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24  // TTL: delete 24 hours (86400 s) after createdAt
  }
})

blacklistTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 })

const tokenBlacklistModel = mongoose.model("blacklistTokens", blacklistTokenSchema)


module.exports = tokenBlacklistModel
