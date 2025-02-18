function showDialog(dialogId) {
    const dialog = document.querySelector(`dialog#${dialogId}`)
    dialog.showModal()
}

function closeDialog(dialogId) {
    const dialog = document.querySelector(`dialog#${dialogId}`)
    dialog.close()
}