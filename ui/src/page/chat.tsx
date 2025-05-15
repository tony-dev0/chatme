import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import ChatList from "../components/ChatList";
import MALE from "../assets/avatars/male.jpg";
import FEMALE from "../assets/avatars/female.jpg";
import { useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import ChatTop from "../components/ChatTop";
import logo from "../assets/logo128.png";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import Notification from "../components/Notification";
import { io } from "socket.io-client";

const ChatLayout = () => {
  const { user, dispatch } = useContext(AuthContext);
  const [messages, setMessages] = useState<any>([]); // Initialize messages as an empty array
  const [receiver, setReceiver] = useState<any>(null);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [arrivalMessage, setArrivalMessage] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socket = useRef<any>(null);
  const [caller, setCaller] = useState<any>({
    _id: null,
    username: null,
    gender: null,
  });
  const [callReceiver, setCallReceiver] = useState<any>(null);
  const [outgoingCall, setOutgoingCall] = useState(false);
  const [IncomingCall, setIncomingCall] = useState(false);
  const [onVideoCall, setOnVideoCall] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // ICE servers configuration
  const iceServers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // Helper function to attach stream to video element
  const attachLocalStream = (stream: MediaStream) => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  };

  const attachRemoteStream = (event: RTCTrackEvent) => {
    if (remoteVideoRef.current) {
      const [remoteStream] = remoteVideoRef.current.srcObject
        ? [remoteVideoRef.current.srcObject as MediaStream]
        : [new MediaStream()];
      remoteStream.addTrack(event.track);
      remoteVideoRef.current.srcObject = remoteStream;
    }
    console.log(
      "(mainfunc)remote stream is - ",
      remoteVideoRef.current?.srcObject
    );
  };

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      secure: true,
    });
    socket.current.on("connect_error", (err: any) => {
      console.warn(`connect_error due to ${err.message}`);
    });
    socket.current.on("getMessage", (data: any) => {
      setArrivalMessage({
        sender: data.senderId,
        members: data.members,
        text: data.text,
        createdAt: Date.now(),
      });
    });
    socket.current.on("incoming-call", (caller: any) => {
      if (outgoingCall || IncomingCall) {
        console.warn("line busy");
        return;
      }
      setCaller(caller);
      setIncomingCall(true);
    });

    socket.current.on("call-answered", async ({ from }: any) => {
      console.warn(`call from ${from} answered`);
      setOutgoingCall(false);
      setOnVideoCall(true);
    });

    socket.current.on("call-ended", ({ to }: any) => {
      console.log("socket call ended entered", to);
      closeCallConnection();
    });

    socket.current.on("webrtc-offer", async ({ from, offer }: any) => {
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        socket.current.emit("webrtc-answer", {
          to: from,
          answer,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.current.on("webrtc-answer", async ({ answer }: any) => {
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    });

    socket.current.on("ice-candidate", async ({ candidate }: any) => {
      if (!peerConnection.current) return;

      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error adding received ice candidate:", error);
      }
    });

    return () => {
      socket.current?.off("webrtc-offer");
      socket.current?.off("webrtc-answer");
      socket.current?.off("ice-candidate");
      closeCallConnection();
    };
  }, []);

  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev: any) => {
        const updatedMessages = [...prev, arrivalMessage];
        return updatedMessages;
      });
    }
  }, [arrivalMessage]);

  useEffect(() => {
    socket.current.emit("addUser", user._id);
    socket.current.on("getUsers", (users: any) => {
      setOnlineUsers(
        user.friends.filter((f: any) => users.some((u: any) => u.userId === f))
      );
    });
  }, [user]);

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
  }, []);

  const startVideoCall = async () => {
    try {
      setCallReceiver(receiver);
      setOutgoingCall(true);
      socket.current.emit("call-user", {
        caller: { _id: user._id, username: user.username, gender: user.gender },
        receiverId: receiver._id,
      });

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      attachLocalStream(stream);

      // Create and configure peer connection
      peerConnection.current = new RTCPeerConnection(iceServers);

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.current!.addTrack(track, stream);
      });

      // Handle incoming tracks (remote stream)
      peerConnection.current.ontrack = attachRemoteStream;

      // Handle and send ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            to: receiver._id,
            candidate: event.candidate,
          });
        }
      };

      // Create and send offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.current.emit("webrtc-offer", {
        to: receiver._id,
        offer,
      });
    } catch (error) {
      console.error("Error starting video call:", error);
      closeCallConnection();
    }
  };

  const answerCall = async () => {
    try {
      setIncomingCall(false);
      setOnVideoCall(true);
      socket.current.emit("call-accepted", { to: caller._id });

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      attachLocalStream(stream);

      // Create and configure peer connection
      peerConnection.current = new RTCPeerConnection(iceServers);

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.current!.addTrack(track, stream);
      });

      // Handle incoming tracks (remote stream)
      peerConnection.current.ontrack = attachRemoteStream;

      // Handle and send ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("ice-candidate", {
            to: caller._id,
            candidate: event.candidate,
          });
        }
      };
      console.log(
        "(answer call)remote video - ",
        remoteVideoRef.current?.srcObject
      );
    } catch (error) {
      console.error("Error answering call:", error);
      closeCallConnection();
    }
  };

  const closeCallConnection = () => {
    setOnVideoCall(false);
    setOutgoingCall(false);
    setIncomingCall(false);

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop all tracks in local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const endCall = () => {
    closeCallConnection();
    socket.current.emit("end-call", { to: receiver?._id || user._id });
  };

  return (
    <main>
      <div className="layout">
        <div className="sidebar" id="sidebar" style={{ marginTop: "-10px" }}>
          <div className="ms-3 mb-4 d-flex align-items-center justify-content-between px-2">
            <div className="d-flex align-items-center gap-2">
              <img src={logo} alt="" width={35} height={30} />
              <h5 className="text-primary mt-2">Chat.me</h5>
            </div>
            <Notification user={user} dispatch={dispatch} />
          </div>
          <div className="container">
            <div className="col-md-12">
              <div className="tab-content">
                <ChatList
                  user={user}
                  setReceiver={setReceiver}
                  onlineUsers={onlineUsers}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="main">
          <div
            className={
              onVideoCall || outgoingCall || IncomingCall
                ? "chat d-none"
                : "chat"
            }
            id="chat1"
          >
            <ChatTop
              user={user}
              receiver={receiver}
              onlineUsers={onlineUsers}
              startVideoCall={startVideoCall}
            />
            <ChatBox
              user={user}
              messages={messages}
              receiver={receiver}
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
              socket={socket}
            />
            <ChatInput
              user={user}
              receiver={receiver}
              setMessages={setMessages}
              socket={socket}
            />
          </div>

          {/* outgoing video call start */}
          {outgoingCall && (
            <div className="call d-block">
              <div className="content">
                <div className="container">
                  <div className="col-md-12">
                    <div className="inside">
                      <div className="panel">
                        <div className="participant">
                          <img
                            className="avatar-xxl"
                            src={
                              callReceiver?.gender === "male" ? MALE : FEMALE
                            }
                            alt="avatar"
                          />
                          <span>Calling {callReceiver?.username}</span>
                          <span>Connecting...</span>
                        </div>
                        <div className="options">
                          <button className="btn option">
                            <i className="material-icons md-30">mic</i>
                          </button>
                          <button
                            className="btn option call-end"
                            onClick={endCall}
                          >
                            <i className="material-icons md-30">call_end</i>
                          </button>
                          <button className="btn option">
                            <i className="material-icons md-30">videocam</i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* outgoing video call end */}
          {/* Incoming video call start */}
          {IncomingCall && (
            <div className="call d-block">
              <div className="content">
                <div className="container">
                  <div className="col-md-12">
                    <div className="inside">
                      <div className="panel">
                        <div className="participant">
                          <img
                            className="avatar-xxl"
                            src={caller?.gender === "male" ? MALE : FEMALE}
                            alt="avatar"
                          />
                          <span>Incoming Call...</span>
                          <span>{caller?.username}</span>
                        </div>
                        <div className="options">
                          <button
                            className="btn option call-answer"
                            onClick={answerCall}
                          >
                            <i className="material-icons md-30">call</i>
                          </button>
                          <button
                            className="btn option call-end"
                            onClick={endCall}
                          >
                            <i className="material-icons md-30">call_end</i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Incoming video call end */}
          {/* video call stream start */}
          {onVideoCall && (
            <div className="call d-block bg-dark-light h-100">
              <div className="col-md-12">
                <div className="video-stream">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="local-video"
                  />

                  <video
                    ref={remoteVideoRef}
                    className="remote-video"
                    autoPlay
                  />

                  <div className="videocall-btn">
                    <div>
                      <button className="btn option">
                        <i className="material-icons md-24 text-white">mic</i>
                      </button>

                      <button className="btn option call-end" onClick={endCall}>
                        <i className="material-icons md-24 text-white">
                          call_end
                        </i>
                      </button>
                      <button className="btn option">
                        <i className="material-icons md-24 text-white">
                          videocam
                        </i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* video call stream end */}
        </div>
      </div>
    </main>
  );
};

export default ChatLayout;
