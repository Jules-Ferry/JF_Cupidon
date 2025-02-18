const fs = require("node:fs")
const jwt = require("jsonwebtoken")
const path = require("node:path")
const bcrypt = require("bcryptjs")
const helpers = require("./helpers")
const config = require("../config.json")

class UserNotFoundException extends Error {
    constructor(message) {
        super(message)
        this.name = "UserNotFoundException"
        this.cause = "No users with this username has been found."
    }
}

class UserAlreadyRegisteredException extends Error {
    constructor(message) {
        super(message)
        this.name = "UserAlreadyRegisteredException"
        this.cause = "It already exist with this username."
    }
}

class WrongPasswordException extends Error {
    constructor(message) {
        super(message)
        this.name = "WrongPasswordException"
        this.cause = "Bad/wrong password."
    }
}

class AlredyHaveThisPermissionException extends Error {
    constructor(message) {
        super(message)
        this.name = "AlredyHaveThisPermissionException"
        this.cause = "You already have this permission."
    }
}

class DontHaveThisPermissionException extends Error {
    constructor(message) {
        super(message)
        this.name = "DontHaveThisPermissionException"
        this.cause = "You already have this permission."
    }
}

class InvalidTokenException extends Error {
    constructor(message) {
        super(message)
        this.name = "InvalidTokenException"
        this.cause = "Token expired or invalid."
    }
}

function isUserExist(username) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.name === username)
    if (user) {
        return user
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function addUser(displayName, username, password) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.name === username)
    if (!user) {
        const $user = {
            name: username,
            displayName,
            password: bcrypt.hashSync(password),
            id: Date.now().toString(),
            permissions: [
                ""
            ]
        }
        users.push($user)
        fs.writeFileSync(path.join(__dirname, "..", "db", "users.json"), JSON.stringify(users, null, 4))
        return $user
    } else {
        throw new UserAlreadyRegisteredException("The user is already registered in the database.")
    }
}

function delUser(userId) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.id === userId)
    if (user) {
        users.splice(users.indexOf(user), 1)
        fs.writeFileSync(path.join(__dirname, "..", "db", "users.json"), JSON.stringify(users, null, 4))
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function getUserById(userId) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.id === userId)
    if (user) {
        return user
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function getUserByToken($jwt) {
    try {
        const decoded = jwt.decode($jwt, { json: true })
        if (decoded.id) {
            return getUserById(decoded.id)
        } else {
            throw new InvalidTokenException("Illegal token.")
        }
    } catch (error) {
        throw new Error("500 - Internal Servor Error.")
    }
}

function changePassword(userId, password, newPassword) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.id === userId)
    if (user) {
        if (bcrypt.compareSync(password, user.password)) {
            user.password = bcrypt.hashSync(newPassword)
            fs.writeFileSync(path.join(__dirname, "..", "db", "users.json"), JSON.stringify(users, null, 4))
        } else {
            throw new WrongPasswordException("Bad password.")
        }
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function authentificate(username, password) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.name === username)
    if (user) {
        if (bcrypt.compareSync(password, user.password)) {
            return user
        } else {
            throw new WrongPasswordException("Bad password.")
        }
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            name: user.name
        },
        config.jwt.secret,
        { expiresIn: "1h" }
    )
}

function generateTokenWithoutExpiration(user) {
    return jwt.sign(
        {
            id: user.id,
            name: user.name
        },
        config.jwt.secret
    )
}

function loginWithJWT(username, password, rememberMe = false) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.name === username)

    if (user) {
        if (bcrypt.compareSync(password, user.password)) {
            const accessToken = rememberMe 
                ? generateTokenWithoutExpiration(user) 
                : generateToken(user)

            delete user.password
            return { ...user, accessToken }
        } else {
            throw new WrongPasswordException("Bad password.")
        }
    } else {
        throw new UserNotFoundException("The user doesn't exist in the database.")
    }
}

function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwt.secret)
    } catch (err) {
        throw new Error("Invalid token.")
    }
}

function revokeToken(token) {
    const revokedTokens = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "revokedTokens.json")))
    revokedTokens.revokedTokens.push(token)
    fs.writeFileSync(path.join(__dirname, "db", "revokedTokens.json"), JSON.stringify(revokedTokens, null, 4))
}

function verifyTokenWithRevocation(token) {
    const revokedTokens = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "revokedTokens.json")))

    if (revokedTokens.revokedTokens.includes(token)) {
        throw new Error("Token has been revoked.")
    }

    return verifyToken(token)
}

function logout(token) {
    revokeToken(token)
}

function refreshJWT(token) {
    const payload = verifyToken(token)
    if (!payload) {
        throw new Error("Invalid token.")
    }
    const newToken = generateToken({ id: payload.id, name: payload.name })
    return { accessToken: newToken }
}

function addPermission(userId, permission) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.id === userId)
    if (user) {
        if (!user.permissions.includes(permission)) {
            user.permissions.push(permission)
            fs.writeFileSync(path.join(__dirname, "..", "db", "users.json"), JSON.stringify(users, null, 4))
        } else {
            throw new AlredyHaveThisPermissionException("The user already have this permission.")
        }
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function hasPermission(permission, user) {
    const perm = permission.split(".")
    if (user.permissions.includes(permission)) {
        return true
    } else {
        if (user.permissions.includes("*")) {
            return true
        } else {
            perm.pop()
            if (user.permissions.includes(perm.join("."))) {
                return true
            } else {
                return false
            }
        }
    }
}

function removePermission(userId, permission) {
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "users.json")))
    const user = users.find(user => user.id === userId)
    if (user) {
        if (user.permissions.includes(permission)) {
            user.permissions.splice(user.permissions.indexOf(permission))
            fs.writeFileSync(path.join(__dirname, "..", "db", "users.json"), JSON.stringify(users, null, 4))
        } else {
            throw new DontHaveThisPermissionException("The user already not have this permission.")
        }
    } else {
        throw new UserNotFoundException("The user doesn't exists in the database.")
    }
}

function authenticateToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1]
    if (!token) {
        return res.status(401).json({ message: "Token is required." })
    }
    try {
        const user = verifyToken(token)
        req.user = isUserExist(user.name)
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid or revoked token." })
    }
}
function checkAuthentificated(req, res, next) {
    const token = req.headers["authorization"]?.replace("Bearer ", "") || req.cookies?.accessToken;

    if (!token) {
        return res.redirect(`/manage/login?callback=${encodeURIComponent(req.originalUrl)}`)
    }

    try {
        verifyToken(token)
        const user = getUserByToken(token)
        req.user = { id: user.id, name: user.name, displayName: user.displayName, permissions: user.permissions }
        return next()
    } catch (error) {
        console.error("Erreur de vérification du token:", error)
        return helpers.handleError(req, res, 401, "Token invalide.").clearCookie("accessToken")
    }
}

function checkNotAuthentificated(req, res, next) {
    const token = req.headers["authorization"]?.replace("Bearer ", "") || req.cookies?.accessToken

    if (!token) {
        return next()
    }

    try {
        verifyToken(token)
        const user = getUserByToken(token)
        req.user = { id: user.id, name: user.name, displayName: user.displayName, permissions: user.permissions }

        const callbackUrl = req.query.callback
        if (callbackUrl && isSafeRedirect(callbackUrl)) {
            return res.redirect(callbackUrl)
        }
        return res.redirect("/manage")
    } catch (error) {
        console.error("Erreur de vérification du token:", error)
        return helpers.handleError(req, res, 401, "Token invalide.")
    }
}

function isSafeRedirect(path) {
    const authorizedPatterns = config.auth.trusted
    const patternsAsRegex = authorizedPatterns.map((pattern) => {
        const escapedPattern = pattern.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&")
        const regexPattern = escapedPattern.replace(/\*/g, ".*")
        return new RegExp(`^${regexPattern}$`)
    });

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return patternsAsRegex.some((regex) => regex.test(path))
    }

    return patternsAsRegex.some((regex) => regex.test(path))
}


module.exports = {
    AlredyHaveThisPermissionException,
    DontHaveThisPermissionException,
    UserAlreadyRegisteredException,
    WrongPasswordException,
    UserNotFoundException,
    InvalidTokenException,
    addUser,
    delUser,
    logout,
    refreshJWT,
    verifyToken,
    getUserById,
    isUserExist,
    revokeToken,
    loginWithJWT,
    generateToken,
    hasPermission,
    addPermission,
    authentificate,
    changePassword,
    getUserByToken,
    removePermission,
    authenticateToken,
    checkAuthentificated,
    checkNotAuthentificated,
    verifyTokenWithRevocation,
    generateTokenWithoutExpiration,
}