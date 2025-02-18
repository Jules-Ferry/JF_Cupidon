const { rateLimit } = require("express-rate-limit")
const config = require("./config.json")
const express = require("express")
const path = require("node:path")
const apiRoute = require("./routes/api")
const manageRoute = require("./routes/manage")
const app = express()
const helpers = require("./modules/helpers")

const rateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 100,
    message: { error: "Trop de requêtes, réessayez plus tard." },
    standardHeaders: true,
    legacyHeaders: false,
})

app.use("/", rateLimiter)
app.set("view engine", "ejs")
app.use("/assets", express.static(path.join(__dirname, "views", "assets")))
app.use("/api", apiRoute)
app.use("/manage", manageRoute)

app.get("/", (req, res) => {
    helpers.logger.log(req, `Chargement de la page d'acceuil.`)
    res.render("index", {
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

app.get("/about", (req, res) => {
    helpers.logger.log(req, `Chargement de la page d'information.`)
    res.render("concept", {
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

app.get("/contact", (req, res) => {
    helpers.logger.log(req, `Chargement de la page de contact.`)
    res.render("contact", {
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

app.get("/legal", (req, res) => {
    helpers.logger.log(req, `Chargement de la page des mentions légales.`)
    res.render("legal-notices", {
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

app.get("*", (req, res) => {
    if (req.headers["accept"]?.includes("application/json")) {
        res.status(404).json({
            success: false,
            error: {
                code: 404,
                message: "Page not found"
            }
        })
    } else {
        res.render("error.ejs", {
            error: {
                code: 404,
                message: "Page non trouvé"
            },
            contacts: config.web.contacts,
            school: config.web.school,
            url: config.web.url
        })
    }
})

app.listen(config.web.port, () => {
    console.log(`Server listening at port : ${config.web.port}`)
})