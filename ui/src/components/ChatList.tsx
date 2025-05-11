import { useEffect, useRef, useState } from "react";
import MALE from "../assets/avatars/male.jpg";
import FEMALE from "../assets/avatars/female.jpg";
import axios from "axios";
import { AddFriendRequestModal } from "./Modals";
import toast from "react-hot-toast";

const ChatList = ({ user, setReceiver, onlineUsers }: any) => {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState("noFilter");
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = usernameRef.current?.value;
    if (username == "") {
      return;
    }
    try {
      const res = await axios.patch(`/users/${user._id}/request`, {
        username: username,
      });
      toast.success(res.data);
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data || "Server error try again later");
      console.log(err);
    }
  };
  useEffect(() => {
    const getContacts = async () => {
      try {
        const res = await axios.get("/users/friends/" + user._id);
        setContacts(res.data);
        setFilteredContacts(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getContacts();
  }, [user.friends]);

  const noFilter = () => {
    if (filter !== "noFilter") {
      setFilteredContacts(contacts);
      setFilter("noFilter");
    }
  };

  const onlineFilter = () => {
    if (filter !== "onlineFilter") {
      setFilteredContacts(
        contacts.filter((c: { _id: string }) => onlineUsers.includes(c._id))
      );
      setFilter("onlineFilter");
    }
  };

  const offlineFilter = () => {
    if (filter !== "offlineFilter") {
      setFilteredContacts(
        contacts.filter((c: { _id: string }) => !onlineUsers.includes(c._id))
      );
      setFilter("offlineFilter");
    }
  };

  return (
    // start of contact
    <div className="tab-pane fade active show" id="members">
      <div className="search">
        <form className="form-inline position-relative">
          <input
            type="search"
            className="form-control"
            id="people"
            placeholder="Search for people..."
          />
          <button type="button" className="btn btn-link loop">
            <i className="material-icons">search</i>
          </button>
        </form>
        <button
          className="btn create"
          data-toggle="modal"
          data-target="#exampleModalCenter"
        >
          <i className="material-icons" onClick={handleShow}>
            person_add
          </i>
        </button>
      </div>
      <div className="list-group sort">
        <button
          className={
            filter == "noFilter"
              ? "btn filterMembersBtn active"
              : "btn filterMembersBtn"
          }
          onClick={noFilter}
        >
          All
        </button>
        <button
          className={
            filter == "onlineFilter"
              ? "btn filterMembersBtn active"
              : "btn filterMembersBtn"
          }
          onClick={onlineFilter}
        >
          Online
        </button>
        <button
          className={
            filter == "offlineFilter"
              ? "btn filterMembersBtn active"
              : "btn filterMembersBtn"
          }
          onClick={offlineFilter}
        >
          Offline
        </button>
      </div>
      <div className="contacts">
        <h1>Contacts</h1>
        <div className="list-group" id="contacts" role="tablist">
          {filteredContacts.map((c: any, i) => {
            return (
              <a
                key={i}
                href="#"
                className="filterMembers all online contact"
                data-toggle="list"
                onClick={() => setReceiver(c)}
              >
                <img
                  className="avatar-md"
                  src={c.gender == "male" ? MALE : FEMALE}
                  data-toggle="tooltip"
                  data-placement="top"
                  title="Janette"
                  alt="avatar"
                />
                <div className="status">
                  {onlineUsers.includes(c._id) ? (
                    <i className="material-icons online">fiber_manual_record</i>
                  ) : (
                    <i className="material-icons offline">
                      fiber_manual_record
                    </i>
                  )}
                </div>
                <div className="data">
                  <h5>{c.username}</h5>
                  <p>{c.email}</p>
                </div>
                <div className="person-add">
                  <i className="material-icons">person</i>
                </div>
              </a>
            );
          })}
        </div>
      </div>
      <AddFriendRequestModal
        user={user}
        usernameRef={usernameRef}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        show={show}
      />
    </div>
    // end of contact
  );
};

export default ChatList;
