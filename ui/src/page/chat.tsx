import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import { useContext, useLayoutEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatTop from "../components/ChatTop";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import VideoCall from "../components/VideoCall";
import { useSocket } from "../context/SocketContext";
import VoiceCall from "../components/VoiceCall";
import { peerConnectionConfig } from "../config.ts";

const ChatLayout = () => {
  const socket = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState<any>([]);
  const [receiver, setReceiver] = useState<any>(null);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [arrivalMessage, setArrivalMessage] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [callReceiver, setCallReceiver] = useState<any>(null);
  const [onCall, setOnCall] = useState<boolean>(false);
  const [outgoingVideoCall, setOutgoingVideoCall] = useState(false);
  const [incomingVideoCall, setincomingVideoCall] = useState(false);
  const [outgoingVoiceCall, setOutgoingVoiceCall] = useState(false);
  const [incomingVoiceCall, setincomingVoiceCall] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoStream = useRef<MediaStream | null>(null);
  const remoteVideoStream = useRef<MediaStream | null>(null);
  const localAudioStream = useRef<MediaStream | null>(null);
  const remoteAudioStream = useRef<MediaStream | null>(null);

  useLayoutEffect(() => {
    socket.on("connect_error", (err: any) => {
      console.warn(`connect_error due to ${err.message}`);
    });
    socket.on("getMessage", (data: any) => {
      setArrivalMessage({
        sender: data.senderId,
        members: data.members,
        text: data.text,
        createdAt: Date.now(),
      });
    });
    // Clean up listeners on unmount
    return () => {
      socket.off("connect_error");
      socket.off("getMessage");
    };
  }, [socket]);

  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev: any) => {
        const updatedMessages = [...prev, arrivalMessage];
        return updatedMessages;
      });
    }
  }, [arrivalMessage]);

  useEffect(() => {
    socket.emit("addUser", user._id);
    socket.on("getUsers", (users: any) => {
      setOnlineUsers(
        user.friends.filter((f: any) => users.some((u: any) => u.userId === f))
      );
    });
    return () => {
      socket.off("getUsers");
    };
  }, [user, socket]);

  useEffect(() => {
    const getMessages = async () => {
      try {
        const res = await axios.get("/messages/" + user._id);
        setMessages(res.data);
      } catch (err) {
        toast.error("an error ocurred from server");
      }
    };
    getMessages();
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  const getVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      localVideoStream.current = stream;
      return stream;
    } catch (err) {
      console.log("failed to get stream", err);
      localVideoStream.current = null;
      return null;
    }
  };

  const getAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      localAudioStream.current = stream;
      return stream;
    } catch (err) {
      console.log("failed to get stream", err);
      localAudioStream.current = null;
      return null;
    }
  };

  const startVideoCall = async () => {
    try {
      setCallReceiver(receiver);
      setOnCall(true);
      setOutgoingVideoCall(true);

      // Get local media stream first
      const stream = await getVideoStream();
      if (!stream) {
        throw new Error("Failed to get local stream");
      }
      localVideoStream.current = stream;

      // Create peer connection
      peerConnection.current = new RTCPeerConnection(peerConnectionConfig);

      // Monitor connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log(
          "Connection state:",
          peerConnection.current?.connectionState
        );
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE Connection state:",
          peerConnection.current?.iceConnectionState
        );
      };

      peerConnection.current.onsignalingstatechange = () => {
        console.log("Signaling state:", peerConnection.current?.signalingState);
      };

      peerConnection.current.onicegatheringstatechange = () => {
        console.log(
          "ICE gathering state:",
          peerConnection.current?.iceGatheringState
        );
      };

      // Set up ontrack handler early
      peerConnection.current.ontrack = (event) => {
        console.log("Received remote track in startVideoCall");
        remoteVideoStream.current = event.streams[0];
      };

      // Add tracks to peer connection
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        peerConnection.current?.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("video-call-ice-candidate", {
            to: receiver._id,
            candidate: event.candidate,
          });
        }
      };

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      console.log(user);

      socket.emit("video-call-offer", {
        caller: {
          _id: user._id,
          username: user.username,
          profilePic: user?.profilePic,
        },
        receiverId: receiver._id,
        offer: {
          type: "offer",
          sdp: offer.sdp,
        },
      });
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };
  const startVoiceCall = async () => {
    try {
      setCallReceiver(receiver);
      setOnCall(true);
      setOutgoingVoiceCall(true);

      // Get local media stream first
      const stream = await getAudioStream();
      if (!stream) {
        throw new Error("Failed to get local stream");
      }
      localAudioStream.current = stream;

      // Create peer connection
      peerConnection.current = new RTCPeerConnection(peerConnectionConfig);

      // Monitor connection state changes
      peerConnection.current.onconnectionstatechange = () => {
        console.log(
          "Connection state:",
          peerConnection.current?.connectionState
        );
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE Connection state:",
          peerConnection.current?.iceConnectionState
        );
      };

      peerConnection.current.onsignalingstatechange = () => {
        console.log("Signaling state:", peerConnection.current?.signalingState);
      };

      peerConnection.current.onicegatheringstatechange = () => {
        console.log(
          "ICE gathering state:",
          peerConnection.current?.iceGatheringState
        );
      };

      // Set up ontrack handler early
      peerConnection.current.ontrack = (event) => {
        console.log("Received remote track in startVideoCall");
        remoteAudioStream.current = event.streams[0];
      };

      // Add tracks to peer connection
      stream.getTracks().forEach((track: MediaStreamTrack) => {
        peerConnection.current?.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("voice-call-ice-candidate", {
            to: receiver._id,
            candidate: event.candidate,
          });
        }
      };

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("voice-call-offer", {
        caller: {
          _id: user._id,
          username: user.username,
          profilePic: user.profilePic,
        },
        receiverId: receiver._id,
        offer: {
          type: "offer",
          sdp: offer.sdp,
        },
      });
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  return (
    <main>
      {isLoading ? (
        <div id="loader">
          {" "}
          <div className="loader"></div>{" "}
        </div>
      ) : (
        <div className="layout">
          <Sidebar setReceiver={setReceiver} onlineUsers={onlineUsers} />
          <div className="main">
            <div
              className={
                localAudioStream.current || localVideoStream.current || onCall
                  ? "chat d-none"
                  : "chat"
              }
              id="chat1"
              style={{ zIndex: 999 }}
            >
              <ChatTop
                user={user}
                receiver={receiver}
                onlineUsers={onlineUsers}
                startVoiceCall={startVoiceCall}
                startVideoCall={startVideoCall}
              />
              <ChatBox
                user={user}
                messages={messages}
                receiver={receiver}
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
              />
              <ChatInput
                user={user}
                receiver={receiver}
                setMessages={setMessages}
              />
            </div>
            <VideoCall
              setOnCall={setOnCall}
              peerConnection={peerConnection}
              getVideoStream={getVideoStream}
              callReceiver={callReceiver}
              setCallReceiver={setCallReceiver}
              localVideoStream={localVideoStream}
              remoteVideoStream={remoteVideoStream}
              outgoingVideoCall={outgoingVideoCall}
              setOutgoingVideoCall={setOutgoingVideoCall}
              incomingVideoCall={incomingVideoCall}
              setincomingVideoCall={setincomingVideoCall}
            />
            <VoiceCall
              setOnCall={setOnCall}
              peerConnection={peerConnection}
              getAudioStream={getAudioStream}
              callReceiver={callReceiver}
              setCallReceiver={setCallReceiver}
              localAudioStream={localAudioStream}
              remoteAudioStream={remoteAudioStream}
              outgoingVoiceCall={outgoingVoiceCall}
              setOutgoingVoiceCall={setOutgoingVoiceCall}
              incomingVoiceCall={incomingVoiceCall}
              setincomingVoiceCall={setincomingVoiceCall}
            />
          </div>
        </div>
      )}
    </main>
  );
};

export default ChatLayout;
