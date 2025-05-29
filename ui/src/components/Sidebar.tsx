import { AuthContext } from "../context/AuthContext";
import ChatList from "../components/ChatList";
import Notification from "../components/Notification";
import logo from "../assets/logo128.png";
import { useContext } from "react";

const Sidebar = ({ setReceiver, onlineUsers }: any) => {
  const { user, dispatch } = useContext(AuthContext);
  return (
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
  );
};

export default Sidebar;
