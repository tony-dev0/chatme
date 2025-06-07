import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { peerConnectionConfig } from "../config.ts";
import OutgoingVideoCall from "./OutgoingVideoCall";
import IncomingVideoCall from "./IncomingVideoCall";
import OngoingVideoCall from "./OngoingVideoCall";
import toast from "react-hot-toast";

const VideoCall = ({
  peerConnection,
  callReceiver,
  setOnCall,
  setCallReceiver,
  incomingVideoCall,
  setincomingVideoCall,
  outgoingVideoCall,
  setOutgoingVideoCall,
  getVideoStream,
  localVideoStream,
  remoteVideoStream,
}: any) => {
  const socket = useSocket();
  const [isLocalStreamVideo, setIsLocalStreamVideo] = useState<boolean>(false);
  const [isRemoteStreamVideo, setIsRemoteStreamVideo] =
    useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVidOn, setIsVidOn] = useState<boolean>(true);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  const [caller, setCaller] = useState<any>({
    _id: null,
    username: null,
    profilePic: null,
  });

  useEffect(() => {
    socket.on("video-call-offer", async ({ caller, offer }: any) => {
      console.log("video-call-offer received");
      if (outgoingVideoCall || incomingVideoCall) {
        toast.error("line busy");
        return;
      }
      console.log(caller);
      setCaller(caller);
      setOnCall(true);
      setincomingVideoCall(true);
      try {
        // Get local stream first
        const stream = await getVideoStream();
        if (!stream) {
          throw new Error("Failed to get local stream");
        }
        localVideoStream.current = stream;

        // Create peer connection
        peerConnection.current = new RTCPeerConnection(peerConnectionConfig);
        // Monitor connection state changes with better error handling

        peerConnection.current.onconnectionstatechange = () => {
          const state = peerConnection.current?.connectionState;
          console.log("Connection state changed:", state);

          switch (state) {
            case "connected":
              console.log("🟢 Peers connected successfully!");
              break;
            case "disconnected":
              console.log("🟡 Peer connection disconnected");
              break;
            case "failed":
              console.log("🔴 Peer connection failed");
              closeCallConnection();
              break;
            case "closed":
              console.log("Peer connection closed normally");
              break;
          }
        };

        peerConnection.current.oniceconnectionstatechange = () => {
          const state = peerConnection.current?.iceConnectionState;
          console.log("ICE Connection state changed:", state);

          switch (state) {
            case "checking":
              console.log("🔄 Checking ICE connection...");
              break;
            case "connected":
              console.log("🟢 ICE Connection established!");
              break;
            case "failed":
              console.error("🔴 ICE Connection failed");
              endCall();
              break;
          }
        };

        // Add local tracks to peer connection BEFORE setting remote description
        stream.getTracks().forEach((track: MediaStreamTrack) => {
          peerConnection.current?.addTrack(track, stream);
        });

        // Set up ontrack handler early
        peerConnection.current.ontrack = (event: { streams: any[] }) => {
          console.log("Received remote track in offer handler");
          remoteVideoStream.current = event.streams[0];
        };

        // Handle ICE candidates
        peerConnection.current.onicecandidate = (event: {
          candidate: { type: any; protocol: any };
        }) => {
          if (event.candidate) {
            console.log(
              "New ICE candidate:",
              event.candidate.type,
              event.candidate.protocol
            );

            socket.emit("video-call-ice-candidate", {
              to: caller._id,
              candidate: event.candidate,
            });
          }
        };

        // Now set remote description (the offer)
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription({
            type: "offer",
            sdp: offer.sdp,
          })
        );

        // Process any queued ICE candidates after setting remoteDescription
        await processIceCandidates();
        // Create and send answer
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.emit("video-call-answer", {
          to: caller._id,
          answer: {
            type: "answer",
            sdp: answer.sdp,
          },
        });
      } catch (error) {
        console.log("error while handling incoming call - ", error);
        closeCallConnection();
      }
    });

    socket.on("video-call-ended", ({ to }: any) => {
      console.log("call ended", to);
      closeCallConnection();
    });

    socket.on("video-call-answer", async ({ answer }: any) => {
      if (!peerConnection.current) {
        console.log("No peer Connection found (caller)");
        return;
      }
      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription({
            type: "answer",
            sdp: answer.sdp,
          })
        );
        // Process any queued ICE candidates after setting remoteDescription
        await processIceCandidates();
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    });

    socket.on("video-call-ice-candidate", async ({ candidate }: any) => {
      if (!peerConnection.current) {
        // Buffer the candidate until peerConnection is ready
        console.log("No peer Connection found, buffering ICE candidate");
        iceCandidatesQueue.current.push(new RTCIceCandidate(candidate));
        return;
      }
      try {
        if (!peerConnection.current.remoteDescription) {
          // Buffer the candidate until remoteDescription is set
          console.log(
            "PeerConnection ready but no remoteDescription, buffering ICE candidate"
          );
          iceCandidatesQueue.current.push(new RTCIceCandidate(candidate));
        } else {
          console.log("Received ICE candidate:", candidate);
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
      } catch (error) {
        console.error("Error adding received ice candidate:", error);
      }
    });

    // After setting remoteDescription, process any queued ICE candidates
    const processIceCandidates = async () => {
      if (
        peerConnection.current?.remoteDescription &&
        iceCandidatesQueue.current.length > 0
      ) {
        try {
          for (const candidate of iceCandidatesQueue.current) {
            await peerConnection.current.addIceCandidate(candidate);
          }
          iceCandidatesQueue.current = [];
        } catch (error) {
          console.error("Error processing queued candidates:", error);
        }
      }
    };

    socket.on("video-call-completed", async ({ to }: any) => {
      if (!peerConnection.current) {
        console.log("No peer Connection found", to);
        return;
      }
      console.log("video-call-completed received from", to);
      setOutgoingVideoCall(false);
      console.log(outgoingVideoCall);
      if (!localVideoStream.current) {
        console.log("localVideoStream is null");
        return;
      }
      setIsLocalStreamVideo(true);
      // isLocalStreamVideo(localVideoStream.current);

      if (!remoteVideoStream.current) {
        console.log("localVideoStream is null");
        return;
      }
      setIsRemoteStreamVideo(true);
      // isRemoteStreamVideo(remoteVideoStream.current);
    });

    return () => {
      socket.off("video-call-offer");
      socket.off("video-call-answer");
      socket.off("video-call-ice-candidate");
      socket.off("video-call-completed");
      socket.off("video-call-ended");
    };
  }, [socket, outgoingVideoCall, incomingVideoCall, getVideoStream]);
  const answerCall = async () => {
    try {
      setincomingVideoCall(false);
      if (!localVideoStream.current) {
        console.log("an error occurred localVideoStream is null (ref)");
        return;
      }
      setIsLocalStreamVideo(true);

      if (!remoteVideoStream.current) {
        console.log("remoteVideoStream is null");
        return;
      }
      setIsRemoteStreamVideo(true);

      socket.emit("video-call-completed", {
        to: caller._id,
      });
    } catch (error) {
      console.log("an error occurred - ", error);
    }
  };

  const closeCallConnection = () => {
    toast("call ended", { icon: "📞", duration: 2000, position: "top-center" });
    setOutgoingVideoCall(false);
    setincomingVideoCall(false);
    setOnCall(false);
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop all tracks in local stream
    if (localVideoStream.current) {
      localVideoStream.current
        .getTracks()
        .forEach((track: any) => track.stop());
      localVideoStream.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallReceiver(null);
    setCaller({ _id: null, username: null, profilePic: null });
  };

  const endCall = useCallback(() => {
    closeCallConnection();
    callReceiver
      ? socket.emit("end-video-call", { to: callReceiver._id })
      : socket.emit("end-video-call", { to: caller._id });
  }, [callReceiver, caller, closeCallConnection, socket]);

  const toggleMic = useCallback(() => {
    if (!localVideoStream.current) {
      console.log("No local stream available");
      return;
    }

    const audioTrack = localVideoStream.current.getAudioTracks()[0];
    if (!audioTrack) {
      console.log("No video track found");
      return;
    }

    // Toggle video track
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  }, [localVideoStream]);

  const toggleCamera = useCallback(() => {
    if (!localVideoStream.current) {
      console.log("No local stream available");
      return;
    }
    const videoTrack = localVideoStream.current.getVideoTracks()[0];
    if (!videoTrack) {
      console.log("No video track found");
      return;
    }
    // Toggle video track
    videoTrack.enabled = !videoTrack.enabled;
    setIsVidOn(videoTrack.enabled);
  }, [localVideoStream]);

  return (
    <div>
      {outgoingVideoCall && (
        <OutgoingVideoCall callReceiver={callReceiver} endCall={endCall} />
      )}

      {incomingVideoCall && (
        <IncomingVideoCall
          caller={caller}
          answerCall={answerCall}
          endCall={endCall}
        />
      )}

      {localVideoStream.current && (
        <OngoingVideoCall
          remoteVideoStream={remoteVideoStream.current}
          localVideoStream={localVideoStream.current}
          isMicOn={isMicOn}
          isVidOn={isVidOn}
          toggleCamera={toggleCamera}
          toggleMic={toggleMic}
          endCall={endCall}
          isLocalStreamVideo={isLocalStreamVideo}
          isRemoteStreamVideo={isRemoteStreamVideo}
        />
      )}
    </div>
  );
};

export default VideoCall;
