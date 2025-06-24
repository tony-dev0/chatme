# Chatme Messenger

Chatme Messenger is a real time chat application built with Mern stack . users can chat with friends, accept/decline friend request. P2P Voice and Video Calling. The Libraries used are Socket.io for Signalling (messaging and notification) and WebRTC for Voice and Video Call.

# Project Requirements

- [NodeJS](https://nodejs.org/en/download/) v20.12.1
- [ReactJS](https://reactjs.org/) v19
- [Bootstrap](https://https://getbootstrap.com/) v5.3.0
- [Mongodb](https://mongodb.com/)

# Quick Setup

Set mongodb.exe as environment valuable
On terminal type `docker compose up --build` in the root directory.
This will start 3 containers : frontend , backend and socket server together. You can access the project at http://localhost:5173

```
Warning : Be sure that no other app is running on port 5173, 4000 or 5000
```

# Manual Setup (Development)

Import database. you can do this either by importing the collections individually through mongodb compass import button the json data for all collection is at db/json or you can import the DB at once on the terminal using the command `mongorestore --db chatme c:\files\database\dump `
For development purpose, the DB is filled with default users (password: 123123)

```
Note: Mongodb must be installed and mongostore should be set as environmental variable otherwise navigate to the folder where you have mongostore.exe and run the command via terminal.
```

### Start backend

- cd server
- npm install
- npm start

### Start Socket Server

- cd socket
- npm install
- npm start

### Start frontend

- cd ui
- npm install
- npm run dev

# Project overview

## Chatting

![Project overview](assets/chatme10383.png?raw=true "Project overview 1")

Once a user types a message and send. the message gets appended to the chatbox, the message is stored in the DB for offline purpose, and the message is sent to the socker server which forwards the message to the intended user. at the reciever's the socket event handler recieves the message and appends it to the messsage state.

## Video Call

![Project overview](assets/chatme10383.png?raw=true "Project overview 2")

Once a user clicks the video call button the startVideo call functions run. the localstream is gotten from getUserMedia.

```js
const stream = await navigator.mediaDevices.getUserMedia();
```

icecandidates are sent to the reciever,
A webrtc offer is created and sent to the user

```js
const offer = await peerConnection.current.createOffer();
await peerConnection.current.setLocalDescription(offer);
```

![Project overview](assets/chatme10383.png?raw=true "Project overview 3")

the ice candidates are recieved and sent back, the call offer is recieved, and a webrtc answer is returned to the caller.

```js
const answer = await peerConnection.current.createAnswer();
await peerConnection.current.setLocalDescription(answer);
```

once the receiver answers call. the localstream is acquired from the getUserMedia and sent to the caller.the call is completed.

![Project overview](assets/chatme10383.png?raw=true "Project overview 4")

Once the call is completed both the caller and the call receiver have the two streams [ localstream and remote stream ] which is displayed on the ui. they can both have the options to mute the call or hide the video.

## Voice Call

![Project overview](assets/chatme10383.png?raw=true "Project overview 5")

the voice call follows the same implementation but the getIserMedia video option is set to false. the ui only shows the profile pics of the caller/callee and a timer. when the caller/callee ends the call a socket signal is sent to the caller/callee notifying them that the other has ended the call closing the peerconnection and setting both video refs to null.
