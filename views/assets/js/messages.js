async function getJson(url) {
    const response = await fetch(`/api/v1/${url}`)
    const json = await response.json()
    return json
}

async function initializeGradesSelector() {
    const gradesSelector = document.querySelector("select#gradeSelector")
    const defaultOption = document.createElement("option")
    const grades = await getJson("grades")
    defaultOption.setAttribute("value", "En classe de ?")
    defaultOption.setAttribute("hidden", "")
    defaultOption.setAttribute("disabled", "")
    defaultOption.setAttribute("selected", "")
    defaultOption.innerText = "En classe de ?"
    gradesSelector.innerHTML = ""
    gradesSelector.appendChild(defaultOption)
    for (const grade of grades) {
        const gradeOption = document.createElement("option")
        gradeOption.setAttribute("value", grade)
        gradeOption.innerText = grade
        gradesSelector.appendChild(gradeOption)
    }
}

async function sendMessage() {
    const grade = document.querySelector("select#gradeSelector")
    const message = document.querySelector("textarea#message")
    const recipient = document.querySelector("input#message_recipient")
    await fetch(`/api/v1/message/${encodeURIComponent(grade.value)}`, {
        body: JSON.stringify({
            message: message.value,
            recipient: message.value
        }),
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        }
    })
    message.value = ""
    recipient.value = ""
    initializeGradesSelector
    showFrame("")
}