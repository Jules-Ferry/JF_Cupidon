async function order() {
    const purchaser = document.querySelector("#purchaser")
    const roses = document.querySelector("#flowersNumber")
    if (purchaser.value.trim() != "" && roses.value != 0) {
        const body = {
            purchaser: purchaser.value,
            flowersNumber: roses.value,
        }
        fetch("/api/v1/roses/order", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }, 
            body: JSON.stringify(body)
        })
        .then(res => res.json())
        .then(json => {
            console.log(json)
            if (json.success) {
                closeDialog("orderRoses")
                showDialog("orderInformation")
                prepareOrderInformation(json)
                roses.value = ""
                purchaser.value = ""
            } else {
                iziToast.error({
                    title: "Erreur",
                    message: json.error.message
                })
            }
        })
        .catch(err => {
            console.error(err)
        })
    }
}

function prepareOrderInformation(data) {
    const trackingNumberField = document.querySelector("#trackingNumber")
    const priceField = document.querySelector("#price")
    priceField.innerText = `${data.price}€`
    trackingNumberField.innerText = data.trackingNumber
}

function initDynamicList(inputId, listId, apiEndpoint) {
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

initDynamicList("purchaser", "purchaserList", "/api/v1/registry/search")