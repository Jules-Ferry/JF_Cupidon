const fs = require("node:fs")
const path = require("node:path")
const config = require("../config.json")
require("colors")

function handleError(req, res, code, cause) {
    if (req.headers["accept"]?.includes("application/json")) {
        return res.status(code).json({ success: false, error: { code, message: cause } })
    } else {
        return res.render("error", {
            error: {
                code,
                message: cause 
            },
            contacts: config.web.contacts,
            school: config.web.school,
            url: config.web.url
        })
    }
}

function serializeCookie(cookie) {
    return cookie
        .split(";")
        .map((v) => v.split("="))
        .reduce((acc, v) => {
            acc[decodeURIComponent(v[0]?.trim())] = decodeURIComponent(v[1]?.trim())
            return acc
        }, {})
}

function serializeCookieExpress(req, res, next) {
    if (req.headers?.cookie) {
        req.cookies = serializeCookie(req.headers?.cookie)
    } else {
        req.cookies = {}
    }
    next()
}

function log(req, message) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    console.log(`[${new Date().toISOString().magenta}] [${"INFO".green}] [${req.method.cyan.bold}] <user:${req.user ? req.user.name : "notlogged"};ip=${ip}> ${req.url} :\r\n${message}`)
    fs.appendFileSync(path.join(__dirname, "..", "logs", "info.log") ,`[${new Date().toISOString()}] [INFO] [${req.method}] <user:${req.user ? req.user.name : "notlogged"};ip=${ip}> ${req.url} :\r\n${message}\r\n`)
}

function error(req, message) {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    console.error(`[${new Date().toISOString().magenta}] [${"ERROR".red}] [${req.method.cyan.bold}] <user:${req.user ? req.user.name : "notlogged"};ip=${ip}> ${req.url} :\r\n${message}`)
    fs.appendFileSync(path.join(__dirname, "..", "logs", "error.log") ,`[${new Date().toISOString()}] [ERROR] [${req.method}] <user:${req.user ? req.user.name : "notlogged"};ip=${ip}> ${req.url} :\r\n${message}\r\n`)
}

function dateRestrictionExpress(req, res, next) {
    const currentDate = new Date()
    const startDate = new Date(config.roses.startDate)
    const endDate = new Date(config.roses.endDate)
  
    if (currentDate >= startDate && currentDate <= endDate) {
        next()
    } else {
        handleError(req, res, 410, "Le service de commande est indisponnible à cette date")
        log(req, "Tentative de commande rose refusé pour le motif : Le service ne peut être utilisé hors de la période définie.")
    }
}

module.exports = {
    handleError,
    serializeCookie,
    serializeCookieExpress,
    dateRestrictionExpress,
    logger: {
        log,
        error
    },
}