function initButtons() {
    const navButtons = document.querySelectorAll("button.nav")
    navButtons.forEach(button => {
        button.setAttribute("onclick", `document.location.href = "${button.getAttribute("path")}"`)
    })
}

function showDialog(dialogId) {
    const dialog = document.querySelector(`dialog#${dialogId}`)
    dialog.showModal()
}

function closeDialog(dialogId) {
    const dialog = document.querySelector(`dialog#${dialogId}`)
    dialog.close()
}

function initDynamicList(inputId, listId, apiEndpoint, apiAddEndpoint) {
    const input = document.getElementById(inputId)
    const list = document.getElementById(listId)
        
    async function fetchData(query) {
        try {
            const response = await fetch(`${apiEndpoint}?keywords=${encodeURIComponent(query)}`, {
                headers: {
                    Accept: "application/json"
                }
            })
            if (!response.ok) throw new Error("Erreur lors de la récupération des données")
            const json = await response.json()
            return json
        } catch (error) {
            console.error("Erreur AJAX :", error)
            return []
        }
    }

    async function addMember(newMember) {
        try {
            const response = await fetch(apiAddEndpoint, {
                method: "PUT",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newMember: newMember }),
            });

            if (!response.ok) {
                iziToast.error({
                    title: `Erreur`,
                    message: `Merci de contacter l'administrateur du service`
                })
                throw new Error("Erreur lors de l'ajout du membre")
            }
            iziToast.success({
                title: `Succès`,
                message: "Membre ajouté au registre"
            })
            return newMember
        } catch (error) {
            console.error("Erreur lors de l'ajout :", error)
            alert("Erreur lors de l'ajout du membre.")
        }
    }

    async function updateList(query) {
        list.innerHTML = ""
        const results = await fetchData(query)

        if (results.length > 0) {
            list.style.display = "block"
            results.forEach(item => {
                const li = document.createElement("li")
                li.textContent = item
                
                li.addEventListener("click", () => {
                    input.value = item
                    list.style.display = "none"
                })

                list.appendChild(li)
            })
        }

        if (query) {
            const addOption = document.createElement("li")
            addOption.textContent = `Ajouter : "${query}"`
            addOption.style.fontWeight = "bold"
            addOption.addEventListener("click", async () => {
                const newMember = await addMember(query)
                if (newMember) {
                    input.value = newMember
                    list.style.display = "none"
                }
            })
            list.appendChild(addOption)
        }

        list.style.maxHeight = "120px"
        list.style.overflowY = results.length > 3 ? "auto" : "hidden"
    }

    input.addEventListener("input", (e) => {
        const query = e.target.value.trim()
        if (query) {
            updateList(query)
        } else {
            list.style.display = "none"
        }
    })

    document.addEventListener("click", (e) => {
        if (!list.contains(e.target) && e.target !== input) {
            list.style.display = "none"
        }
    })
}

function orderRoses() {
    const purchaser = document.querySelector("#purchaserInputSearch")
    const flowersNumber = document.querySelector("#flowersNumber")
    const orderPaymentStatus = document.querySelector("#orderPaymentStatus")

    if (purchaser.value.trim() != "" && flowersNumber.value != "" && [1, 2, 3, 4, 5].includes(parseInt(flowersNumber.value))) {
        const body = JSON.stringify({
            purchaser: purchaser.value,
            flowersNumber: flowersNumber.value,
            paymentStatus: orderPaymentStatus.selectedIndex.toString()
        })
        console.log(orderPaymentStatus.selectedIndex)
        fetch("/api/v1/roses/add", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: body
        }).then(res => res.json())
        .then(json => {
            console.log(json)
            if (json.success) {
                closeDialog('orderRoses')
                if (json.haveToPay) {
                    prepareOrderInformationDialogForShopPage(json)
                    showDialog("orderInformation")
                }
                purchaser.value = ""
                flowersNumber.value = ""
                orderPaymentStatus.selectedIndex = 0
                iziToast.success({
                    title: `Succès`,
                    message: "Commande effectué avec succès"
                })
            } else {
                console.log(json)
                iziToast.error({
                    title: `Erreur`,
                    message: json.error.message
                })  
            }
        })
        .catch(err => {
            console.log(err)
            iziToast.error({
                title: `Erreur`,
                message: "Merci de contacter l'administrateur du service"
            })
        })
    } else {
        iziToast.error({
            title: `Erreur`,
            message: "Champ(s) manquant"
        })
    }
    
}

function getOrders() {
    const paymentStatus = ["En attente", "Payée", "Gratuité"]
    const status = ["En stock", "Distribué"]
    fetch("/api/v1/orders", {
        headers: {
            Accept: "application/json"
        }
    }).then(res => res.json())
    .then(json => {
        const ordersTable = document.querySelector("table#orders")
        const tbody = ordersTable.querySelector("tbody")
        if (!json.error) {
            tbody.innerHTML = ""
            json.forEach(order => {
                const tr = document.createElement("tr")
                const rosesTd = document.createElement("td")
                const statusId = document.createElement("td")
                const paymentId = document.createElement("td")
                const purchaserTd = document.createElement("td")
    
                paymentId.innerText = paymentStatus[order.paymentStatus]
                statusId.innerText = status[parseInt(order.status)]
                rosesTd.innerText = order.flowersNumber
                purchaserTd.innerText = order.purchaser
    
                tr.appendChild(statusId)
                tr.appendChild(purchaserTd)
                tr.appendChild(rosesTd)
                tr.appendChild(paymentId)
    
                tr.setAttribute("data-tracking-number", order.trackingNumber)
                tr.setAttribute("onclick", `prepareOrderInformationDialog("${order.trackingNumber}")`)
    
                tbody.appendChild(tr)
            })
        } else {
            iziToast.error({
                title: `Erreur : ${json.error.code}`,
                message: json.error.message
            })
        }
    })
}

function searchOrder(keywords) {
    const paymentStatus = ["En attente", "Payée", "Gratuité"]
    const status = ["Non défini", "En stock", "A distribuer", "Distribué", "Reçu"]
    fetch(`/api/v1/orders?keywords=${encodeURIComponent(keywords)}`, {
        headers: {
            Accept: "application/json"
        }
    }).then(res => res.json())
    .then(json => {
        const ordersTable = document.querySelector("table#orders")
        const tbody = ordersTable.querySelector("tbody")
        if (!json.error) {
            tbody.innerHTML = ""
            json.forEach(order => {
                const tr = document.createElement("tr")
                const rosesTd = document.createElement("td")
                const statusId = document.createElement("td")
                const paymentId = document.createElement("td")
                const purchaserTd = document.createElement("td")
    
                paymentId.innerText = paymentStatus[order.paymentStatus]
                statusId.innerText = status[parseInt(order.status)]
                rosesTd.innerText = order.flowersNumber
                purchaserTd.innerText = order.purchaser
    
                tr.appendChild(statusId)
                tr.appendChild(purchaserTd)
                tr.appendChild(rosesTd)
                tr.appendChild(paymentId)
    
                tr.setAttribute("data-tracking-number", order.trackingNumber)
                tr.setAttribute("onclick", `prepareOrderInformationDialog("${order.trackingNumber}")`)
    
                tbody.appendChild(tr)
            })
        } else {
            iziToast.error({
                title: `Erreur : ${json.error.code}`,
                message: json.error.message
            })
        }
    })
    .catch(err => {
        console.log(err)
    })
}

function prepareOrderInformationDialogForShopPage(data) {
    console.log(data)
    const trackingNumberField = document.querySelector("#trackingNumber")
    const priceField = document.querySelector("#price")
    priceField.innerText = `${data.price}€`
    trackingNumberField.innerText = data.trackingNumber
}
 
function prepareOrderInformationDialog(trackingNumber) {
    fetch(`/api/v1/orders/tracking/${trackingNumber}`, {
        headers: {
            Accept: "application/json"
        }
    })
    .then(res => res.json())
    .then(json => {
        const orderPaymentStatus = document.querySelector("#orderPaymentStatus")
        const orderInformation = document.querySelector("#orderInformation")
        const orderNumberTitle = document.querySelector("#orderNumber")
        const purchaser = document.querySelector("#purchaser")
        const orderStatus = document.querySelector("#orderStatus")
        const price = document.querySelector("#price")
        orderNumberTitle.innerText = `Commande : ${trackingNumber}`
        purchaser.setAttribute("value", json.purchaser)
        orderStatus.selectedIndex = parseInt(json.status)
        orderPaymentStatus.selectedIndex = parseInt(json.paymentStatus)
        if (orderPaymentStatus.selectedIndex == 2) {
            orderPaymentStatus.setAttribute("disabled", "")
        }
        if (orderPaymentStatus.selectedIndex == 0) {
            document.querySelector(".price").removeAttribute("hidden")
            price.removeAttribute("hidden")
            price.value = json.price
        } else {
            document.querySelectorAll(".price").forEach(el => el.setAttribute("hidden", ""))
            price.setAttribute("hidden", "")
        }
        orderInformation.setAttribute("data-tracking-number", trackingNumber)
        showDialog("orderInformation")
    })
}

function deleteOrder() {
    const orderInformation = document.querySelector("#orderInformation")
    fetch(`/api/v1/order/${orderInformation.getAttribute("data-tracking-number")}`, {
        method: "delete",
        headers: {
            Accept: "application/json"
        }
    })
    .then(() => {
        document.querySelector(`tr[data-tracking-number=${orderInformation.getAttribute("data-tracking-number")}]`).remove()
        closeDialog("orderInformation")
    })
}

function updateOrder() {
    const orderInformation = document.querySelector("#orderInformation")
    const editedFields = document.querySelectorAll("[data-order-edited]")
    const orderSearch = document.querySelector("#orderSearch")
    editedFields.forEach(field => {
        if (field.name) {
            const body = {}
            if (field.tagName == "SELECT") {
                body[field.name] = field.selectedIndex.toString()
            } else if (field.tagName == "INPUT") {
                body[field.name] = field.value
            }
            console.log(`/api/v1/order/${orderInformation.getAttribute("data-tracking-number")}/${field.name}`)
            fetch(`/api/v1/order/${orderInformation.getAttribute("data-tracking-number")}/${field.name}`, {
                method: "put",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body, null, 4)
            })
            .then(() => {
                if (orderSearch.value.trim() != "") {
                    searchOrder(orderSearch.value)
                } else {
                    getOrders()
                }
                iziToast.success({
                    title: "Succès",
                    message: "Modification effectué"
                })
            }).catch(err => {
                console.log(err)
            })
        }
    })
}

function initialiazeStats() {
    const totalOrders = document.querySelector("#total")
    const paidOrders = document.querySelector("#paid")
    const raisedMoney = document.querySelector("#raised")
    const costs = document.querySelector("#costs")
    const profits = document.querySelector("#profits")
    fetch("/api/v1/orders/total")
    .then(res => res.json())
    .then(json => {
        console.log(json)
        totalOrders.innerText = json.total
    })
    fetch("/api/v1/orders/total/paid")
    .then(res => res.json())
    .then(json => {
        console.log(json)
        paidOrders.innerText = json.total
    })
    fetch("/api/v1/orders/total/paid/raised")
    .then(res => res.json())
    .then(json => {
        console.log(json)
        raisedMoney.innerText = json.total + "€"
    })
    
    fetch("/api/v1/orders/total/paid/costs")
    .then(res => res.json())
    .then(json => {
        console.log(json)
        costs.innerText = json.costs + "€"
    })
    
    fetch("/api/v1/orders/total/paid/profits")
    .then(res => res.json())
    .then(json => {
        console.log(json)
        profits.innerText = json.profits + "€"
    })
}

initButtons()