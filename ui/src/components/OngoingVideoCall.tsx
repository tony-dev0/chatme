import React, { useEffect, useRef } from "react";

const VideoCall = ({
  remoteVideoStream,
  localVideoStream,
  isMicOn,
  isVidOn,
  toggleCamera,
  toggleMic,
  endCall,
  isLocalStreamVideo,
  isRemoteStreamVideo,
}: any) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteVideoStream && isLocalStreamVideo) {
      remoteVideoRef.current!.srcObject = remoteVideoStream;
    }
    if (localVideoStream && isRemoteStreamVideo) {
      localVideoRef.current!.srcObject = localVideoStream;
    }
  }, [isRemoteStreamVideo]);

  return (
    <div className="call d-block bg-dark-light h-100vh" style={{ zIndex: 99 }}>
      <div className="col-md-12">
        <div className="video-stream">
          {" "}
          <video ref={remoteVideoRef} autoPlay className="remote-video" />
          <video ref={localVideoRef} autoPlay className="local-video" />
          <div className="videocall-btn">
            <div>
              {isMicOn ? (
                <button className="btn option bg-secondary" onClick={toggleMic}>
                  <i className="material-icons md-24 text-white">mic</i>
                </button>
              ) : (
                <button className="btn option bg-white" onClick={toggleMic}>
                  <i className="material-icons md-24 text-secondary">mic_off</i>
                </button>
              )}
              {isVidOn ? (
                <button
                  className="btn option bg-secondary"
                  onClick={toggleCamera}
                >
                  <i className="material-icons md-24 text-white">videocam</i>
                </button>
              ) : (
                <button className="btn option bg-white" onClick={toggleCamera}>
                  <i className="material-icons md-24 text-secondary">
                    videocam_off
                  </i>
                </button>
              )}
              <button className="btn option call-end" onClick={endCall}>
                <i className="material-icons md-24 text-white">call_end</i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoCall);
