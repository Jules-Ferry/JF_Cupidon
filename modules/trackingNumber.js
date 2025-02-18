const fs = require("node:fs")
const path = require("node:path")

function generateTrackingNumber(prefix = "BVS") {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase()

    return `${prefix}-${datePart}-${randomPart}`
}

module.exports = {
    generateTrackingNumber
}