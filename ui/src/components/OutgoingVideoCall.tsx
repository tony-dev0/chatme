import React from "react";

const OutgoingVideoCall = ({ callReceiver, endCall }: any) => {
  return (
    <div className="call d-block" style={{ zIndex: 9999 }}>
      <div className="content">
        <div className="container">
          <div className="col-md-12">
            <div className="inside">
              <div className="panel">
                <div className="participant">
                  <img
                    className="avatar-xxl"
                    src={callReceiver?.profilePic}
                    alt="avatar"
                  />
                  <span>Calling {callReceiver?.username}</span>
                  <span>Connecting...</span>
                </div>
                <div className="options">
                  <button className="btn option">
                    <i className="material-icons md-30">mic</i>
                  </button>
                  <button className="btn option call-end" onClick={endCall}>
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
  );
};

export default React.memo(OutgoingVideoCall);
