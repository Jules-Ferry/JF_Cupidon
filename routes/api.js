const express = require("express")
const fs = require("fs")
const path = require("path")
const router = express.Router()
const config = require("../config.json")
const users = require("../modules/users")
const helpers = require("../modules/helpers")
const tracking = require("../modules/trackingNumber")

router.use("", express.json())
router.use("", express.urlencoded({ extended: true }))
router.use("", helpers.serializeCookieExpress)

router.get("/ping", (req, res) => {
    helpers.logger.log(req, "Ping de l'API")
    res.send("pong")
})

router.get("/v1/grades", (req, res) => {
    helpers.logger.log(req, "Récupération de la liste des classes")
    res.json(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "grades.json"))))
})

router.post("/v1/login", users.checkNotAuthentificated, (req, res) => {
    const { username, password } = req.body
    if (username && password) {
        try {
            const user = users.loginWithJWT(username, password, true)
            helpers.logger.log(req, `Tentative de connexion réussie en tant que ${username}.`)
            res.status(200).cookie("accessToken", user.accessToken).redirect("/manage")
        } catch (error) {
            helpers.logger.log(req, `Tentative de connexion échoué en tant que ${username}.`)
            helpers.handleError(req, res, 401, "Indentifiants invalides.")
        }
    } else {
        helpers.logger.log(req, `Tentative de connexion échoué.`)
        helpers.handleError(req, res, 422, "Indentifiant(s) manquant(s).")
    }
})

router.post("/v1/register", users.checkNotAuthentificated, (req, res) => {
    const { username, password } = req.body
    if (username && password) {
        try {
            users.isUserExist(username)
            helpers.logger.log(req, `Tentative de d'ajout de membre au registre rejeté pour cause de duplicata de nom d'utilisateur.`)
            helpers.handleError(req, res, 409, "Un·e utilisateur·rice existe déjà sous cette identifiant.")
        } catch (error) {
            try {
                const user = users.addUser(username, password)
                helpers.logger.log(req, `Membre ajouté au registre.`)
                res.status(200).cookie("accessToken", users.generateTokenWithoutExpiration(user)).json({ success: true })
            } catch (error) {
                console.log(error)
                helpers.logger.log(req, `Tentative de d'ajout de membre au registre échoué.`)
                helpers.handleError(req, res, 418, "I'm a teapot")
            }
        }
    } else {
        helpers.logger.log(req, `Tentative de d'ajout de membre au registre échoué.`)
        helpers.handleError(req, res, 401, "Indentifiant(s) manquant(s).")
    }
})

router.get("/v1/logout", users.checkAuthentificated, (req, res) => {
    helpers.logger.log(req, `Déconnexion de l'utilisateur ${req.user.name ? req.user.name : "anonyme"}.`)
    if (req.query.callback) {
        res.clearCookie("accessToken").status(200).redirect(req.query.callback)
    } else {
        res.clearCookie("accessToken").status(200).json({ success: true })
    }
})

router.get("/v1/users/@me", users.checkAuthentificated, (req, res) => {
    helpers.logger.log(req, `Récupération des données de l'utilisateur par celui-ci.`)
    res.json(req.user)
})

router.get("/v1/registry/search", (req, res) => {
    const { keywords } = req.query
    if (keywords) {
        if (keywords.length >= 3) {
            const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "registry.json")))
            helpers.logger.log(req, `Recherche de membre effectué dans le registre <keywords:${decodeURIComponent(keywords)}>.`)
            res.json(registry.filter(value => value.toLowerCase().includes(decodeURIComponent(keywords.toLowerCase()))))
        } else {
            helpers.handleError(req, res, 400, "Mot(s)-clef(s) trop court (minimum 3 caractère).")
        }
    } else {
        helpers.handleError(req, res, 422, "Paramètre manquant.")
    }
})

router.get("/v1/registry/list", users.checkAuthentificated, (req, res) => {
    helpers.logger.log(req, `Récupération du registre.`)
    res.sendFile(path.join(__dirname, "..", "db", "registry.json"))
})

router.put("/v1/registry/add", users.checkAuthentificated, (req, res) => {
    const { newMember } = req.body
    if (newMember) {
        const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "registry.json")))
        if (!registry.includes(newMember)) {
            registry.push(newMember)
            helpers.logger.log(req, `Tentative d'ajout d'un membre sous le nom de <${newMember}> réussie.`)
            fs.writeFileSync(path.join(__dirname, "..", "db", "registry.json"), JSON.stringify(registry, null, 4))
            res.status(201).json({ success: true })
        } else {
            helpers.logger.log(req, `Tentative d'ajout d'un membre dans le registre, rejeté pour cause de duplicata.`)
            helpers.handleError(req, res, 409, "Membre déjà présent dans le registre.")
        }
    } else {
        helpers.handleError(req, res, 422, "Paramètre manquant.")
    }
})

router.post("/v1/roses/add", helpers.dateRestrictionExpress, users.checkAuthentificated, (req, res) => {
    const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "registry.json")))
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const { purchaser, flowersNumber, paymentStatus } = req.body
    if (purchaser && [0, 1, 2].includes(parseInt(paymentStatus)) && parseInt(flowersNumber) <= config.roses.quantity.max && parseInt(flowersNumber) >= config.roses.quantity.min) {
        if (registry.includes(purchaser)) {
            const order = {
                purchaser,
                status: "0",
                flowersNumber,
                paymentStatus: paymentStatus.toString(),
                trackingNumber: parseInt(paymentStatus) == 2 ? tracking.generateTrackingNumber("GRA") : tracking.generateTrackingNumber()
            }
            orders.push(order)
            fs.writeFileSync(path.join(__dirname, "..", "db", "orders.json"), JSON.stringify(orders, null, 4))
            helpers.logger.log(req, `Commande d'une ou plusieurs rose(s) effectué avec succès depuis le panel [${order.trackingNumber}]`)
            res.status(201).json({ success: true, trackingNumber: order.trackingNumber, haveToPay: parseInt(paymentStatus) == 0 ? true : false, price: config.roses.prices[flowersNumber.toString()] || parseInt(flowersNumber) * 3 })
        } else {
            helpers.logger.error(req, "Tentative de commande d'une ou plusieurs rose(s) depuis le panel refusé pour : Utilisateur introuvable dans le registre")
            helpers.handleError(req, res, 404, "Utilisateur introuvable dans le registre")
        }
    } else {
        helpers.logger.error(req, "Tentative de commande d'une ou plusieurs rose(s) depuis le panel refusé pour : paramètre(s) manquant(s) ou invalide(s) dans la requête.")
        helpers.handleError(req, res, 422, "Paramètre(s) manquant(s) ou invalide(s).")
    }
})

router.post("/v1/roses/order", helpers.dateRestrictionExpress, (req, res) => {
    const registry = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "registry.json")))
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const { purchaser, flowersNumber } = req.body
    if (purchaser && parseInt(flowersNumber) <= config.roses.quantity.max && parseInt(flowersNumber) >= config.roses.quantity.min) {
        if (registry.includes(purchaser)) {
            const order = {
                purchaser,
                status: "0",
                flowersNumber,
                paymentStatus: "0",
                trackingNumber: tracking.generateTrackingNumber("WEB")
            }
            orders.push(order)
            fs.writeFileSync(path.join(__dirname, "..", "db", "orders.json"), JSON.stringify(orders, null, 4))
            helpers.logger.log(req, `Commande d'une ou plusieurs rose(s) effectué avec succès depuis le site web [${order.trackingNumber}]`)
            res.status(201).json({ success: true, trackingNumber: order.trackingNumber, price: config.roses.prices[flowersNumber.toString()] || parseInt(flowersNumber) * 3 })
        } else {
            helpers.logger.error(req, "Tentative de commande d'une ou plusieurs rose(s) depuis le site web refusé pour : Utilisateur introuvable dans le registre")
            helpers.handleError(req, res, 404, "Utilisateur introuvable dans le registre")
        }
    } else {
        helpers.logger.error(req, "Tentative de commande d'une ou plusieurs rose(s) depuis le site web refusé pour : paramètre(s) manquant(s) ou invalide(s) dans la requête.")
        helpers.handleError(req, res, 422, "Paramètre(s) manquant(s) ou invalide(s).")
    }
})

router.get("/v1/orders", users.checkAuthentificated, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const { keywords } = req.query
    if (!keywords) {
        helpers.logger.log(req, "Récupération de liste des commandes)")
        res.json(orders)
    } else {
        helpers.logger.log(req, "Récupération de liste des commandes")
        if (!req.query.keywords <= 3) {
            const filteredflowers = []
            if (!keywords.startsWith("ps:")) {
                orders.forEach(order => {
                    if (order.purchaser.toLowerCase().includes(encodeURIComponent(keywords.toLowerCase())) || order.trackingNumber.toLowerCase().includes(encodeURIComponent(keywords.toLowerCase()))) {
                        filteredflowers.push(order)
                    }
                })
                res.json(filteredflowers)
            } else {
                const paymentStaus = decodeURIComponent(keywords.split(":")[1])
                if (config.aliases[paymentStaus]) {
                    orders.forEach(order => {
                        if (order.paymentStatus.toString() == config.aliases[paymentStaus].toString()) {
                            filteredflowers.push(order)
                        }
                    })
                    res.json(filteredflowers)
                } else {
                    helpers.handleError(req, res, 400, "Filtres valides : ps:[en attente/payée/Gratuité].")
                }
            }
        } else {
            helpers.handleError(req, res, 400, "Mot(s)-clef(s) trop court (minimum 3 caractère).")
        }
    }
})

router.get("/v1/orders/tracking/:trackingNumber", users.checkAuthentificated, (req, res) => {
    const { trackingNumber } = req.params
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const order = orders.find($order => $order.trackingNumber === trackingNumber)
    if (order) {
        order.price = (config.roses.prices[order.flowersNumber.toString()] || parseInt(order.flowersNumber) * 3) + ".00€"
        helpers.logger.log(req, `Tentative de récupération des informations de suivie de la commande : ${trackingNumber}, réussie`)
        res.status(200).json(order)
    } else {
        helpers.logger.log(req, `Tentative de récupération des informations de suivie de la commande : ${trackingNumber}, échoué, ce numéro de suivi n'a pas été/n'est plus attribué`)
        helpers.handleError(req, res, 404, "Numéro de suivi non attribué")
    }
})

router.put("/v1/order/:trackingNumber/status", users.checkAuthentificated, (req, res) => {
    const { trackingNumber } = req.params
    const { status } = req.body
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const order = orders.find($order => $order.trackingNumber === trackingNumber)
    if (order != {}) {
        if ([0, 1].includes(parseInt(status))) {
            helpers.logger.log(req, `Mise à jour du status de la commande ${trackingNumber} <old:${order.status}> ➜  <new:${status}> réussi`)
            order.status = status
            fs.writeFileSync(path.join(__dirname, "..", "db", "orders.json"), JSON.stringify(orders, null, 4))
            res.status(201).json({ success: true })
        } else {
            helpers.logger.log(req, `Tentative de mise à jour du status de la commande ${trackingNumber} <old:${order.status}> ➜  <new:${status}> refusé, champ(s) manquant(s)`)
            helpers.handleError(req, res, 422, "Paramètre manquant ou incorrect dans le corps de la requête (status).")
        }
    } else {
        helpers.handleError(req, res, 404, "Numéro de suivie non attribué")
    }
})

router.put("/v1/order/:trackingNumber/payment", users.checkAuthentificated, (req, res) => {
    const { trackingNumber } = req.params
    const { payment } = req.body
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const order = orders.find($order => $order.trackingNumber === trackingNumber)
    if (order != {}) {
        if ([0, 1, 2].includes(parseInt(payment))) {
            helpers.logger.log(req, `Mise à jour du status de payment de la commande ${trackingNumber} <old:${order.paymentStatus}> ➜ <new:${payment}> réussi`)
            order.paymentStatus = payment
            fs.writeFileSync(path.join(__dirname, "..", "db", "orders.json"), JSON.stringify(orders, null, 4))
            res.status(201).json({ success: true })
        } else {
            helpers.logger.log(req, `Tentative de mise à jour du status de payment de la commande ${trackingNumber} <old:${order.paymentStatus}> ➜ <new:${payment}> refusé, champ(s) manquant(s)`)
            helpers.handleError(req, res, 422, "Paramètre manquant ou incorrect dans le corps de la requête (status).")
        }
    } else {
        helpers.handleError(req, res, 404, "Numéro de suivie non attribué")
    }
})

router.delete("/v1/order/:trackingNumber", users.checkAuthentificated, (req, res) => {
    const { trackingNumber } = req.params
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    const order = orders.find($order => $order.trackingNumber === trackingNumber)
    if (order) {
        helpers.logger.log(req, `Suppression de la commande ${trackingNumber}`)
        orders.splice(orders.indexOf(order), 1)
        fs.writeFileSync(path.join(__dirname, "..", "db", "orders.json"), JSON.stringify(orders, null, 4))
        res.sendStatus(204)
    } else {
        helpers.logger.log(req, `Tentative de suppression de la commande ${trackingNumber} échoué, numéro de suivi invalide`)
        helpers.handleError(req, res, 404, "Numéro de suivi invalide")
    }
})

router.get("/v1/orders/total", users.checkAuthentificated, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    res.status(200).json({ success: true, total: orders.length })
})

router.get("/v1/orders/total/paid", users.checkAuthentificated, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    res.status(200).json({ success: true, total: orders.filter(order => parseInt(order.paymentStatus) >= 1).length })
})

router.get("/v1/orders/total/paid/raised", users.checkAuthentificated, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    let raised = 0
    for (const order of orders) {
        const paymentStatus = parseInt(order.paymentStatus)
        const flowersNumber = parseInt(order.flowersNumber)
        if (paymentStatus == 1) {
            raised = raised + config.roses.prices[flowersNumber.toString()] || parseInt(flowersNumber) * 3
        }
    }
    res.status(200).json({ success: true, total: raised })
})

router.get("/v1/orders/total/paid/costs", users.checkAuthentificated, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    let costs = 0
    for (const order of orders) {
        const paymentStatus = parseInt(order.paymentStatus)
        const flowersNumber = parseInt(order.flowersNumber)
        if (paymentStatus != 0) {
            let money = config.roses.defaultPrice * flowersNumber
            costs = costs + money
        }
    }
    res.json({ success: true, costs })
})

router.get("/v1/orders/total/paid/profits", users.checkAuthentificated, (req, res) => {
    const orders = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "db", "orders.json")))
    let raised = 0
    let costs = 0
    for (const order of orders) {
        const paymentStatus = parseInt(order.paymentStatus)
        const flowersNumber = parseInt(order.flowersNumber)
        if (paymentStatus == 1) {
            raised = raised + (config.roses.prices[flowersNumber.toString()] ||  parseInt(flowersNumber) * 3)
        }
    }
    for (const order of orders) {
        const paymentStatus = parseInt(order.paymentStatus)
        const flowersNumber = parseInt(order.flowersNumber)
        if (paymentStatus != 0) {
            let money = config.roses.defaultPrice * flowersNumber
            costs = costs + money
        }
    }
    res.json({ success: true, profits: raised - costs })
})


module.exports = router