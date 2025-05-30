import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import OutgoingVoiceCall from "./OutgoingVoiceCall";
import IncomingVoiceCall from "./IncomingVoiceCall";
import OngoingVoiceCall from "./OngoingVoiceCall";
import toast from "react-hot-toast";

const VoiceCall = ({
  peerConnection,
  callReceiver,
  setOnCall,
  setCallReceiver,
  incomingVoiceCall,
  setincomingVoiceCall,
  outgoingVoiceCall,
  setOutgoingVoiceCall,
  getAudioStream,
  localAudioStream,
  remoteAudioStream,
}: any) => {
  const socket = useSocket();
  const [isLocalStreamAudio, setIsLocalStreamAudio] = useState<boolean>(false);
  const [isRemoteStreamAudio, setIsRemoteStreamAudio] =
    useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  const [caller, setCaller] = useState<any>({
    _id: null,
    username: null,
    profilePic: null,
  });

  // ICE servers configuration
  const peerConnectionConfig: RTCConfiguration = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
      },
    ],
  };

  useEffect(() => {
    socket.on("voice-call-offer", async ({ caller, offer }: any) => {
      console.log("voice-call-offer received");
      if (outgoingVoiceCall || incomingVoiceCall) {
        toast.error("line busy");
        return;
      }
      setCaller(caller);
      setOnCall(true);
      setincomingVoiceCall(true);
      try {
        // Get local stream first
        const stream = await getAudioStream();
        if (!stream) {
          throw new Error("Failed to get local stream");
        }
        localAudioStream.current = stream;
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
          console.log(
            "Received remote track in offer handler",
            event.streams[0]
          );
          remoteAudioStream.current = event.streams[0];
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

            socket.emit("voice-call-ice-candidate", {
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

        socket.emit("voice-call-answer", {
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

    socket.on("voice-call-ended", ({ to }: any) => {
      console.log("call ended", to);
      closeCallConnection();
    });

    socket.on("voice-call-answer", async ({ answer }: any) => {
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

    socket.on("voice-call-ice-candidate", async ({ candidate }: any) => {
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

    socket.on("voice-call-completed", async ({ to }: any) => {
      if (!peerConnection.current) {
        console.log("No peer Connection found", to);
        return;
      }
      setOutgoingVoiceCall(false);

      if (!localAudioStream.current) {
        console.log("localAudioStream is null");
        return;
      }
      setIsLocalStreamAudio(true);
      if (!remoteAudioStream.current) {
        console.log("localAudioStream is null");
        return;
      }
      setIsRemoteStreamAudio(true);
    });

    return () => {
      socket.off("voice-call-offer");
      socket.off("voice-call-answer");
      socket.off("voice-call-ice-candidate");
      socket.off("voice-call-completed");
      socket.off("voice-call-ended");
    };
  }, [socket, outgoingVoiceCall, incomingVoiceCall, getAudioStream]);

  const answerCall = async () => {
    try {
      setincomingVoiceCall(false);
      if (!localAudioStream.current) {
        console.log("an error occurred localAudioStream is null (ref)");
        return;
      }

      setIsLocalStreamAudio(true);

      if (!remoteAudioStream.current) {
        console.log("remoteAudioStream is null");
        return;
      }

      setIsRemoteStreamAudio(true);

      socket.emit("voice-call-completed", {
        to: caller._id,
      });
    } catch (error) {
      console.log("an error occurred - ", error);
    }
  };

  const closeCallConnection = () => {
    toast("call ended", { icon: "📞", duration: 2000, position: "top-center" });
    setOutgoingVoiceCall(false);
    setincomingVoiceCall(false);
    setOnCall(false);
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop all tracks in local stream
    if (localAudioStream.current) {
      localAudioStream.current
        .getTracks()
        .forEach((track: any) => track.stop());
      localAudioStream.current = null;
    }

    // Clear audio elements
    if (localAudioRef.current) localAudioRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setCallReceiver(null);
    setCaller({ _id: null, username: null, profilePic: null });
  };

  const endCall = useCallback(() => {
    closeCallConnection();
    callReceiver
      ? socket.emit("end-voice-call", { to: callReceiver._id })
      : socket.emit("end-voice-call", { to: caller._id });
  }, [callReceiver, caller, closeCallConnection, socket]);

  const toggleMic = useCallback(() => {
    if (!localAudioStream.current) {
      console.log("No local stream available");
      return;
    }

    const audioTrack = localAudioStream.current.getAudioTracks()[0];
    if (!audioTrack) {
      console.log("No audio track found");
      return;
    }

    // Toggle audio track
    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  }, [localAudioStream]);

  return (
    <div>
      {outgoingVoiceCall && (
        <OutgoingVoiceCall callReceiver={callReceiver} endCall={endCall} />
      )}

      {incomingVoiceCall && (
        <IncomingVoiceCall
          caller={caller}
          answerCall={answerCall}
          endCall={endCall}
        />
      )}

      {localAudioStream.current && (
        <OngoingVoiceCall
          remoteAudioStream={remoteAudioStream.current}
          localAudioStream={localAudioStream.current}
          profilePic={callReceiver?.profilePic || caller.profilePic}
          isMicOn={isMicOn}
          toggleMic={toggleMic}
          isLocalStreamAudio={isLocalStreamAudio}
          isRemoteStreamAudio={isRemoteStreamAudio}
          endCall={endCall}
        />
      )}
    </div>
  );
};

export default VoiceCall;
