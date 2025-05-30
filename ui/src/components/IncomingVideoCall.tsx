import React from "react";

const IncomingVideoCall = ({ caller, answerCall, endCall }: any) => {
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
                    src={caller?.profilePic}
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
                  <button className="btn option call-end" onClick={endCall}>
                    <i className="material-icons md-30">call_end</i>
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

export default React.memo(IncomingVideoCall);
