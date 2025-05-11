import MALE from "../assets/avatars/male.jpg";
import FEMALE from "../assets/avatars/female.jpg";
import { useState } from "react";
import { DeleteConfirmationModal } from "./Modals";
import axios from "axios";
import toast from "react-hot-toast";
import Dropdown from "react-bootstrap/Dropdown";
import "bootstrap/dist/css/bootstrap.min.css";

const ChatTop = ({ user, receiver, onlineUsers, startVideoCall }: any) => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => {
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.patch(`/users/deleteFriend/${receiver._id}`, {
        userId: user._id,
      });
      handleClose();
      toast.success(res.data);
    } catch (err) {
      toast.error("failed to delete contact");
      console.log(err);
    }
  };

  return (
    <div className="top">
      <div className="container">
        <div className="col-md-12" style={{ position: "relative" }}>
          {receiver && (
            <div className="inside">
              <a href="#">
                <img
                  className="avatar-md"
                  src={receiver?.gender == "male" ? MALE : FEMALE}
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Keith"
                  alt="avatar"
                />
              </a>
              <div className="status">
                {onlineUsers.includes(receiver._id) ? (
                  <i className="material-icons online">fiber_manual_record</i>
                ) : (
                  <i className="material-icons offline">fiber_manual_record</i>
                )}
              </div>
              <div className="data">
                <h5>
                  <a href="#">{receiver?.username}</a>
                </h5>
                {onlineUsers.includes(receiver._id) ? (
                  <span>Active now</span>
                ) : (
                  <span>Offline</span>
                )}
              </div>
              <button className="btn connect d-md-block d-none">
                <i className="material-icons md-30">phone_in_talk</i>
              </button>
              <button
                className="btn connect d-md-block d-none"
                onClick={startVideoCall}
              >
                <i className="material-icons md-36">videocam</i>
              </button>
              <button className="btn d-md-block d-none">
                <i className="material-icons md-30">info</i>
              </button>

              <Dropdown>
                <Dropdown.Toggle
                  className="p-0 bg-transparent border-0"
                  id="dropdown-basic"
                  aria-haspopup="true"
                >
                  <i className="material-icons md-30">more_vert</i>
                </Dropdown.Toggle>

                <Dropdown.Menu className="dropdown-menu-right">
                  <Dropdown.Item className="connect hover-blue">
                    <i className="material-icons">phone_in_talk</i>Voice Call
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="connect hover-blue"
                    onClick={startVideoCall}
                  >
                    <i className="material-icons">videocam</i>Video Call
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item className="hover-red">
                    <i className="material-icons">clear</i>Clear History
                  </Dropdown.Item>
                  <Dropdown.Item className="hover-red">
                    <i className="material-icons">block</i>Block Contact
                  </Dropdown.Item>
                  <Dropdown.Item className="hover-red" onClick={handleOpen}>
                    <i className="material-icons">delete</i>Delete Contact
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </div>
      </div>
      <DeleteConfirmationModal
        open={open}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
      />
    </div>
  );
};

export default ChatTop;
