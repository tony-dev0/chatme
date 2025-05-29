import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const ChatInput = ({ user, receiver, setMessages }: any) => {
  const socket = useSocket();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", {
        senderId: user._id,
        receiverId: receiver._id,
      });
    }
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket.emit("stopTyping", {
        senderId: user._id,
        receiverId: receiver._id,
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(handleStopTyping, 1000);
    return () => clearTimeout(timeout);
  }, [newMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver) return;
    if (!newMessage.trim()) return;
    const message = {
      sender: user._id,
      text: newMessage,
      members: [user._id, receiver._id],
    };

    socket.emit("sendMessage", {
      senderId: user._id,
      receiverId: receiver._id,
      members: [user._id, receiver._id],
      text: newMessage,
    });

    try {
      const res = await axios.post("/messages/", message);
      setMessages((prev: any) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container">
      <div className="col-md-12">
        {receiver && (
          <div className="bottom">
            <form className="position-relative w-100" onSubmit={handleSubmit}>
              <textarea
                className="form-control"
                placeholder="Start typing for reply..."
                rows={1}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleTyping}
              ></textarea>
              <button className="btn emoticons">
                <i className="material-icons">insert_emoticon</i>
              </button>
              <button type="submit" className="btn send">
                <i className="material-icons">send</i>
              </button>
            </form>
            <label>
              <input type="file" />
              <span className="btn attach d-sm-block d-none">
                <i className="material-icons">attach_file</i>
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
