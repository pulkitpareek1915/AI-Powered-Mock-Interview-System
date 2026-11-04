const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")



async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }


        // 1. verify first: cheap, no database read, and pinned algorithm blocks "alg: none"
    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token." })
    }

     // 2. only then check the blacklist
    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    req.user = decoded
    req.token = token          
    next()

}


module.exports = { authUser }
