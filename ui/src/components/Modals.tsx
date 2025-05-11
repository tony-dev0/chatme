import axios from "axios";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import toast from "react-hot-toast";
import MALE from "../assets/avatars/male.jpg";
import FEMALE from "../assets/avatars/female.jpg";
// import { AuthContext } from "../context/AuthContext";

export const AddFriendRequestModal = ({
  handleSubmit,
  usernameRef,
  show,
  handleClose,
}: any) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Friend</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="ControlInput1">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter valid username"
              ref={usernameRef}
              autoFocus
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="ControlTextarea1">
            <Form.Label>Example textarea</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Hi, I'd like to add you as a contact"
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Send Friend Request
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export const ViewFriendRequestModal = ({
  user,
  dispatch,
  requestedFriends,
  show,
  onHide,
}: any) => {
  // Track action state for each friend request using their _id as key
  const [actions, setActions] = useState<
    Record<string, { state: boolean; text: string }>
  >({});

  const AcceptRequest = async (frn: any) => {
    try {
      await axios.patch(`/users/acceptRequest/${frn._id}`, { id: user._id });
      toast.success(`You are now friends with ${frn.username}`);
      dispatch({ type: "ACCEPT_REQUEST", payload: frn._id });
      // Update only this specific friend's action state
      setActions((prev) => ({
        ...prev,
        [frn._id]: { state: false, text: "ACCEPTED!" },
      }));
      console.log("accept request completed");
    } catch (err) {
      toast.error("failed to accept request");
      console.log(err);
    }
  };

  const DeclineRequest = async (frn: any) => {
    try {
      await axios.patch(`/users/declineRequest/${frn._id}`, { id: user._id });
      toast("user declined");
      dispatch({ type: "DECLINE_REQUEST", payload: frn._id });
      // Update only this specific friend's action state
      setActions((prev) => ({
        ...prev,
        [frn._id]: { state: false, text: "DECLINED!" },
      }));
      console.log("decline request completed");
    } catch (err) {
      toast.error("failed to decline request");
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title className="h5">
          Friend Requests ({requestedFriends?.length || 0})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          className="list-group"
          id="contacts"
          style={{
            maxHeight: "350px",
            minHeight: "80px",
            overflowY: "auto",
          }}
        >
          {requestedFriends?.map((friend: any, i: number) => (
            <div
              key={i}
              className="contact d-flex gap-3 mb-3 align-items-center"
            >
              <img
                className="avatar-md"
                src={friend.gender === "male" ? MALE : FEMALE}
                data-toggle="tooltip"
                data-placement="top"
                title={friend.name}
                alt="avatar"
              />
              <div className="data w-200">
                <h6>{friend.username}</h6>
                <span className="text-faded">{friend.email}</span>
              </div>
              <div className="aod">
                {!actions[friend._id] || actions[friend._id].state ? (
                  <>
                    <button
                      className="btn btn-button"
                      onClick={() => AcceptRequest(friend)}
                    >
                      <i className="material-icons">check</i>
                    </button>
                    <button
                      className="btn btn-button"
                      onClick={() => DeclineRequest(friend)}
                    >
                      <i className="material-icons">close</i>
                    </button>
                  </>
                ) : (
                  actions[friend._id]?.text
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};

// EmptyNotificationModal component
export const EmptyNotificationModal = ({ show, onHide }: any) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Notifications</Modal.Title>
      </Modal.Header>
      <Modal.Body>No Notifications to Show</Modal.Body>
    </Modal>
  );
};

// Confirmation modal
export const DeleteConfirmationModal = ({
  open,
  handleClose,
  handleSubmit,
}: any) => {
  return (
    <Modal show={open} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Confirm Action</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this contact</Modal.Body>
      <div className="align-btn">
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};
