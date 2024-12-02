'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();
    console.log("Attempting to connect with username: ", username); // Debugging line

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        console.log("Username is valid. Proceeding with connection.");

        var socket = new SockJS('http://192.168.0.118:8081/ws');  // Updated WebSocket URL
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    } else {
        console.log("No username entered."); // Debugging line if username is empty
    }
    event.preventDefault();
}

function onConnected() {
    console.log("Connected to WebSocket server! Subscribing to topic...");

    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);
    console.log("Subscribed to /topic/public");

    // Send user join message
    stompClient.send("/app/chat.addUser", {},
        JSON.stringify({sender: username, type: 'JOIN'})
    );
    console.log(`Sent JOIN message for user: ${username}`);

    connectingElement.classList.add('hidden');
}

function onError(error) {
    console.error("WebSocket connection error:", error); // Log error
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    console.log("Sending message:", messageContent); // Debugging line

    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        console.log("Message sent: ", chatMessage); // Debugging line
        messageInput.value = '';
    } else {
        console.log("Message content is empty or no WebSocket connection available.");
    }
    event.preventDefault();
}

function onMessageReceived(payload) {
    console.log("Message received: ", payload.body); // Debugging line

    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if (message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    console.log(`Generated color for username '${messageSender}': ${colors[index]}`); // Debugging line
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);
