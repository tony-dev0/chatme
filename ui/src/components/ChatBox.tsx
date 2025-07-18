import { useState, useEffect, useRef } from "react";
import { format } from "timeago.js";
import { useSocket } from "../context/SocketContext";
import "../assets/css/chatme.css";

const ChatBox = ({
  user,
  messages,
  receiver,
  currentChat,
  setCurrentChat,
}: any) => {
  const socket = useSocket();
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (receiver) {
      const filteredMessages = messages.filter(
        (message: { members: string | any[] }) => {
          return message.members.includes(receiver._id);
        }
      );
      setCurrentChat(filteredMessages);
    }
  }, [receiver, messages]);

  useEffect(() => {
    scrollRef.current?.lastElementChild?.scrollIntoView({
      behavior: "smooth",
    });
  }, [currentChat, isTyping]);

  useEffect(() => {
    if (!socket) return;

    socket.on("typing", ({ senderId }: any) => {
      if (senderId === receiver._id) {
        setIsTyping(true);
      }
    });

    socket.on("stopTyping", ({ senderId }: any) => {
      if (senderId === receiver._id) {
        setIsTyping(false);
      }
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [receiver, socket]);

  return receiver ? (
    <div className="content" id="content">
      <div className="container">
        <div className="col-md-12" ref={scrollRef}>
          {currentChat?.length > 0 ? (
            currentChat.map((msg: any, i: number) => {
              return msg.sender === user._id ? (
                <div className="message me" key={i}>
                  <div className="text-main">
                    <div className="text-group me">
                      <div className="text me">
                        <p>{msg.text}</p>
                      </div>
                    </div>
                    <span>{format(msg.createdAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="message" key={i}>
                  <img
                    className="avatar-md"
                    src={receiver.profilePic}
                    data-toggle="tooltip"
                    data-placement="top"
                    title="Keith"
                    alt="avatar"
                  />
                  <div className="text-main">
                    <div className="text-group">
                      <div className="text">
                        <p>{msg.text}</p>
                      </div>
                    </div>
                    <span>{format(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="content empty">
              <div className="container">
                <div className="col-md-12">
                  <div className="no-messages">
                    <i className="material-icons md-48">forum</i>
                    <p>
                      Seems people are shy to start the chat. Break the ice send
                      the first message.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isTyping && (
            <div className="message">
              <img className="avatar-md" src={receiver.profilePic} />
              <div className="text-main">
                <div className="text-group">
                  <div className="text typing">
                    <div className="wave">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="content empty">
      <div className="container">
        <div className="col-md-12">
          <div className="no-messages">
            <h4>Select a chat to start messaging.</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
