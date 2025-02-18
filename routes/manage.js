const expres = require("express")
const router = expres.Router()
const users = require("../modules/users")
const helpers = require("../modules/helpers")
const config = require("../config.json")

router.use("", helpers.serializeCookieExpress)

router.get("/", users.checkAuthentificated, (req, res) => {
    helpers.logger.log(req, `Chargement de la page de gestion.`)
    res.render("manager/index.ejs", {
        user: req.user,
        page: {
            title: "Acceuil",
            type: "home"
        },
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

router.get("/shop", users.checkAuthentificated, (req, res) => {
    helpers.logger.log(req, `Chargement de la page de gestion.`)
    res.render("manager/shop.ejs", {
        user: req.user,
        page: {
            title: "Passage descommandes", 
            type: "shop"
        },
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

router.get("/orders", users.checkAuthentificated, (req, res) => {
    helpers.logger.log(req, `Chargement de la page de gestion.`)
    res.render("manager/orders.ejs", {
        user: req.user,
        page: {
            title: "Gestion des commandes", 
            type: "orders"
        },
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

router.get("/login", users.checkNotAuthentificated, (req, res) => {
    helpers.logger.log(req, `Chargement de la page de connexion.`)
    res.render("manager/login.ejs", {
        contacts: config.web.contacts,
        school: config.web.school,
        url: config.web.url
    })
})

router.get("/logout", users.checkAuthentificated, (req, res) => {
    res.redirect("/api/v1/logout")
})

module.exports = router