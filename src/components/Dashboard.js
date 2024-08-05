import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "../CSS/AgentChat.css";

const socket = io("http://localhost:8000");

const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [message, setMessage] = useState("");
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    console.log("Connecting to socket...");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("joinAgent");
    });

    socket.on("newRoom", (room) => {
      console.log("New room available:", room);
      setRooms((prevRooms) => [...new Set([...prevRooms, room])]);
    });

    socket.on("message", (message) => {
      console.log("Received new message:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("roomRemoved", (room) => {
      console.log("Room removed:", room);
      setRooms((prevRooms) => prevRooms.filter((r) => r !== room));
    });

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off("newRoom");
      socket.off("message");
      socket.off("roomRemoved");
    };
  }, []);

  const sendMessage = () => {
    if (selectedRoom && message.trim()) {
      const msg = { room: selectedRoom, sender: "Agent", message };
      console.log("Sending message:", msg);
      socket.emit("message", msg);
      setMessage("");
    }
  };

  const handleRoomSelection = (room) => {
    console.log("Selecting room:", room);
    setSelectedRoom(room);
  };

  return (
    <div className="agent-chat-container">
      <div className="sidebar">
        <h2>Customers</h2>
        {rooms.length > 0 ? (
          rooms.map((room, index) => (
            <div
              key={index}
              className="room"
              onClick={() => handleRoomSelection(room)}
            >
             {room}
            </div>
          ))
        ) : (
          <p>No customer chats</p>
        )}
      </div>
      <div className="chat-area">
        {selectedRoom ? (
          messages
            .filter((msg) => msg.room === selectedRoom)
            .map((msg, index) => (
              <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
                <div className="message-content">
                  <strong>{msg.sender}: </strong>
                  {msg.message}
                </div>
              </div>
            ))
        ) : (
          <p>Select a customer to start chatting</p>
        )}
        {selectedRoom && (
          <div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
