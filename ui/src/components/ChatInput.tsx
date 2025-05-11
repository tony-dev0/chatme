import { useState, useEffect } from "react";
import axios from "axios";

const ChatInput = ({ user, receiver, setMessages, socket }: any) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.current.emit("typing", {
        senderId: user._id,
        receiverId: receiver._id,
      });
    }
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket.current.emit("stopTyping", {
        senderId: user._id,
        receiverId: receiver._id,
      });
    }
  };

  useEffect(() => {
    const timeout = setTimeout(handleStopTyping, 2000);
    return () => clearTimeout(timeout);
  }, [newMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiver) return;
    const message = {
      sender: user._id,
      text: newMessage,
      members: [user._id, receiver._id],
    };

    socket.current.emit("sendMessage", {
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
