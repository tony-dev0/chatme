import { useEffect, useState } from "react";
import { EmptyNotificationModal, ViewFriendRequestModal } from "./Modals";
import axios from "axios";
import toast from "react-hot-toast";

const Notification = ({ user, dispatch }: any) => {
  const [readMsg, setReadMsg] = useState(false);
  const [requestedFriends, setRequestedFriends] = useState([]);
  const [showFriendRequestsModal, setShowFriendRequestsModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);

  useEffect(() => {
    const getRequestedFriends = async () => {
      try {
        const res = await axios.get(`/users/${user._id}/requests`);
        setRequestedFriends(res.data);
      } catch (err) {
        console.log("get users by friends request failed ", err);
        toast.error("an internal error occurred");
      }
    };
    getRequestedFriends();
  }, []);

  const handleNotificationClick = () => {
    if (user.friendRequests.length > 0) {
      setShowFriendRequestsModal(true);
      setReadMsg(true);
    } else {
      setShowEmptyModal(true);
    }
  };

  return (
    <div>
      <div
        className="notification-wrapper position-relative me-3 cursor-pointer"
        onClick={handleNotificationClick}
      >
        {user.friendRequests.length > 0 ? (
          <>
            {!readMsg ? (
              <>
                <div className="bell" id="bell-1">
                  <div className="anchor material-icons layer-1">
                    notifications_active
                  </div>
                  <div className="anchor material-icons layer-2">
                    notifications
                  </div>
                  <div className="anchor material-icons layer-3">
                    notifications
                  </div>
                </div>
                <span className="position-absolute top-0 start-86 translate-middle badge rounded-pill bg-danger">
                  {requestedFriends.length || user.friendRequests.length}
                  <span className="visually-hidden">unread messages</span>
                </span>
              </>
            ) : (
              <i className="material-icons">notifications</i>
            )}
          </>
        ) : (
          <i className="material-icons">notifications</i>
        )}
      </div>

      <ViewFriendRequestModal
        user={user}
        dispatch={dispatch}
        requestedFriends={requestedFriends}
        show={showFriendRequestsModal}
        onHide={() => setShowFriendRequestsModal(false)}
      />

      <EmptyNotificationModal
        show={showEmptyModal}
        onHide={() => setShowEmptyModal(false)}
      />
    </div>
  );
};

export default Notification;
