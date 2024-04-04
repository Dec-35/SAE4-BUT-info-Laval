const socket = io();

/* Gérer les clicks */
let chatDiv = document.getElementById("chatDiv");
let chatDivHeader = document.getElementById("chatDivHeader");
chatDivHeader.addEventListener("click", (e) => {
    if(chatDiv.classList.contains("isOpened")) {
        chatDiv.classList.remove("isOpened");
        chatDiv.classList.add("notOpened");
    }else {
        chatDiv.classList.remove("notOpened");
        chatDiv.classList.add("isOpened");
    }
})

/* Gérer l'envoi de messages */
let chatInputForm = document.getElementById("chatDivInput");
chatInputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    let inputMsg = e.target[0].value;
    socket.emit("sendMsg", inputMsg);
    addNewMessage(inputMsg, true);
    chatInputForm.reset();
})

/* Pour ajouter un message à la liste HTML */
let chatList = document.getElementById("chatDivContent");
function addNewMessage(msg, isSelf) {
    let newMsg = document.createElement("div");
    newMsg.classList.add("chatDivMessage");
    if(isSelf) {
        newMsg.classList.add("self");
    }
    newMsg.textContent = msg;
    chatList.appendChild(newMsg);
    chatList.scrollTop = chatList.scrollHeight;
}

//EVENTS SOCKET.IO
socket.on("msgReceived", (msg) => {
    addNewMessage(msg, false);
})

/* On scrolle jusqu'au messages les plus récents */
chatList.scrollTop = chatList.scrollHeight;