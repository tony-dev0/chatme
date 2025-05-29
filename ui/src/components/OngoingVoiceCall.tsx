import React, { useEffect, useRef, useState } from "react";

const OngoingVoiceCall = ({
  remoteAudioStream,
  localAudioStream,
  profilePic,
  isMicOn,
  toggleMic,
  endCall,
  isLocalStreamAudio,
  isRemoteStreamAudio,
}: any) => {
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState<number>(0);
  const [timer, setTimer] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (timer) {
      interval = setInterval(() => {
        setTime((prevTime: number) => prevTime + 10);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (remoteAudioStream && isLocalStreamAudio) {
      remoteAudioRef.current!.srcObject = remoteAudioStream;
    }
    if (localAudioStream && isRemoteStreamAudio) {
      localAudioRef.current!.srcObject = localAudioStream;
      setTimer(true);
    }
  }, [isRemoteStreamAudio]);

  const terminateSession = () => {
    setTimer(false);
    endCall();
  };

  return (
    <div className="call d-block bg-dark-light h-100vh" style={{ zIndex: 99 }}>
      <div className="col-md-12">
        <div className="audio-stream">
          <div className="content-wrap">
            <div className="call-info mt-5">
              <img
                className={isMicOn ? "avatar-xxl animate" : "avatar-xxl"}
                src={new URL(profilePic, import.meta.url).href}
                alt="avatar"
              />
              <div className="timer text-center">
                {(time / 60000) % 60 > 1 && (
                  <span>
                    {("0" + Math.floor((time / 60000) % 60)).slice(-2)}:
                  </span>
                )}
                <span>{("0" + Math.floor((time / 1000) % 60)).slice(-2)}:</span>
                <span>{("0" + Math.floor((time / 10) % 60)).slice(-2)}</span>
              </div>
            </div>
          </div>
          <audio ref={remoteAudioRef} autoPlay className="remote-audio" />
          <audio ref={localAudioRef} autoPlay className="local-audio" />
          <div className="audiocall-btn">
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
              <button
                className="btn option call-end"
                onClick={terminateSession}
              >
                <i className="material-icons md-24 text-white">call_end</i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OngoingVoiceCall);
