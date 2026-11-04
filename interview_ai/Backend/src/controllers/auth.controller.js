const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const tokenBlacklistModel = require("../models/blacklist.model")
const { cookieOptions, clearCookieOptions } = require("../utils/cookie.options")

// compared against when the email doesn't exist, so response time doesn't reveal which emails are registered
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10)

function signToken(user) {
    return jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d", algorithm: "HS256", jwtid: crypto.randomUUID() }   // unique id per token
    )
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 * (req.body is already validated and cleaned by validate(registerSchema))
 */
async function registerUserController(req, res) {

    const { username, email, password } = req.body

    // friendly early check; the unique indexes are the real guarantee
    const isUserAlreadyExists = await userModel.exists({
        $or: [ { username }, { email } ]
    })

    if (isUserAlreadyExists) {
        return res.status(409).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    let user
    try {
        user = await userModel.create({
            username,
            email,
            password: hash
        })
    } catch (err) {
        // 11000 = duplicate key error from the unique index (the race was caught here)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || "username or email"
            return res.status(409).json({
                message: `An account with this ${field} already exists`
            })
        }
        throw err   // anything else: Express 5 passes it to the error handler (500)
    }

    res.cookie("token", signToken(user), cookieOptions)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 * (req.body is already validated and cleaned by validate(loginSchema))
 */
async function loginUserController(req, res) {

    const { email, password } = req.body

    const user = await userModel.findOne({ email }).select("+password")

    // always run bcrypt.compare, even when the user doesn't exist (timing-attack defence)
    const isPasswordValid = await bcrypt.compare(password, user ? user.password : DUMMY_HASH)

    if (!user || !isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password"
        })
    }

    res.cookie("token", signToken(user), cookieOptions)

    res.status(200).json({
        message: "User loggedIn successfully.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}


/**
 * @name logoutUserController
 * @description add the token in blacklist and clear it from the user cookie
 * @access private (authUser has already verified the token and set req.token)
 */
async function logoutUserController(req, res) {

    await tokenBlacklistModel.create({ token: req.token })

    res.clearCookie("token", clearCookieOptions)

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)

    if (!user) {
        res.clearCookie("token", clearCookieOptions)
        return res.status(401).json({ message: "User not found." })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
