import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import {
  PaperClipIcon,
  PaperAirplaneIcon,
  MicrophoneIcon,
} from "@heroicons/react/24/outline";
import { RiSpeakLine } from "react-icons/ri";
import "../CSS/AgentChat.css";
import Tickets from "./Tickets";

const socket = io("http://localhost:8000");

const Chats = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [myConversations, setMyConversations] = useState([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  const [sortFlag, setSortFlag] = useState(false);
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    setUserData(JSON.parse(localStorage.getItem("dexkorUserData")));
  }, []);

  console.log({ myConversations });

  useEffect(() => {
    if (!sortFlag) return;
    // Sorting myConversations whenever it changes
    let sortedConversations = [...myConversations].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setMyConversations(sortedConversations);
    sortedConversations = conversations.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    setConversations(sortedConversations);
    setSortFlag(false);
  }, [sortFlag]);

  useEffect(() => {
    // Listen for the 'message' event
    socket.on("message", (message) => {
      console.log("Received new message:", message);

      setMyConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          if (conversation.roomId === message.room) {
            // Update the messages in the selected conversation
            return {
              ...conversation,
              messages: [...conversation.messages, message],
            };
          }
          return conversation;
        });
      });

      if (
        selectedConversation &&
        message.room === selectedConversation.roomId
      ) {
        setSelectedConversation((prevSelectedConversation) => ({
          ...prevSelectedConversation,
          messages: [...prevSelectedConversation.messages, message],
        }));
      }
    });

    socket.on("ticketStatusUpdated", (response) => {
      console.log("Ticket status changed to: ", response.status);

      setMyConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          if (conversation.roomId === response.roomId) {
            // Update the status of the ticketId in the selected conversation
            return {
              ...conversation,
              ticketId: {
                ...conversation.ticketId,
                status: response.status,
              },
            };
          }
          return conversation;
        });
      });

      if (
        selectedConversation &&
        response.roomId === selectedConversation.roomId
      ) {
        setSelectedConversation((prevSelectedConversation) => ({
          ...prevSelectedConversation,
          ticketId: {
            ...prevSelectedConversation.ticketId,
            status: response.status,
          },
        }));
      }
    });

    socket.on("ticketClosed", (response) => {
      console.log("Ticket status changed to: ", response.status);

      setMyConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          if (conversation.roomId === response.roomId) {
            // Update the status of the ticketId in the selected conversation
            return {
              ...conversation,
              ticketId: {
                ...conversation.ticketId,
                status: response.status,
              },
            };
          }
          return conversation;
        });
      });

      if (
        selectedConversation &&
        response.roomId === selectedConversation.roomId
      ) {
        setSelectedConversation((prevSelectedConversation) => ({
          ...prevSelectedConversation,
          ticketId: {
            ...prevSelectedConversation.ticketId,
            status: response.status,
          },
        }));
      }
    });

    // Clean up the socket listener on unmount
    return () => {
      socket.off("message");
      socket.off("ticketClosed");
    };
  }, [selectedConversation]);

  useEffect(() => {
    console.log("Connecting to socket...");

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("joinAgent");
    });

    // Emit all roomIds to join
    const roomIds = myConversations.map((conversation) => conversation.roomId);
    socket.emit("join", roomIds);

    socket.on("newConversation", (newConversation) => {
      console.log("New room available:", newConversation);
      setConversations((prevConversations) => [
        ...new Set([...prevConversations, newConversation]),
      ]);
      setSortFlag(true);
    });

    // socket.on("roomRemoved", (room) => {
    //   console.log("Room removed:", room);
    //   setRooms((prevRooms) => prevRooms.filter((r) => r !== room));
    // });

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off("newRoom");
      // socket.off("roomRemoved");
    };
  }, [selectedConversation]);

  useEffect(() => {
    if (attachment) {
      sendMessage(); // Automatically send message when attachment is set
    }
  }, [attachment]);

  const sendMessage = () => {
    if (selectedConversation && (message.trim() || attachment)) {
      const msg = {
        room: selectedConversation.roomId,
        sender: "Agent",
        message,
        attachment,
        attachmentType,
      };
      console.log("Sending message:", msg);
      socket.emit("message", msg);
      setMessage("");
      setAttachment(null); // Reset attachment after sending
      setAttachmentType(""); // Reset attachment type after sending
    }
  };

  const handleRoomSelection = (room, myConversation) => {
    console.log("Selecting room:", room);
    setSelectedConversation(myConversation);
  };

  console.log({ selectedConversation });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result);
        setAttachmentType(file.type); // Set attachment type based on the file type
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachment(reader.result);
          setAttachmentType("audio/webm");
        };
        reader.readAsDataURL(blob);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting audio recording:", error);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const startTranscription = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    let finalTranscript = "";

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setMessage(finalTranscript + interimTranscript);
    };

    recognitionRef.current.start();
    setTranscribing(true);
  };

  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setTranscribing(false);
    }
  };

  const renderAttachment = (attachment, attachmentType) => {
    const handlePreview = () => {
      window.open(attachment, "_blank");
    };

    if (attachmentType.includes("image")) {
      return (
        <img
          src={attachment}
          alt="attachment"
          className="w-22 max-w-xs rounded-lg"
        />
      );
    } else if (attachmentType.includes("video")) {
      return (
        <video src={attachment} controls className="w-22 max-w-xs rounded-lg" />
      );
    } else if (attachmentType.includes("audio")) {
      return <audio src={attachment} controls />;
    } else {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreview}
            className="bg-transparent hover:bg-transparent hover:text-black px-3 py-1 rounded"
          >
            Attachment preview
          </button>
        </div>
      );
    }
  };

  const handleStatusChange = (event) => {
    if (selectedConversation === null) return;

    const newStatus = event.target.value;
    const ticketId = selectedConversation.ticketId._id;
    const roomId = selectedConversation.roomId;

    socket.emit(
      "updateTicketStatus",
      {
        ticketId,
        status: newStatus,
        roomId: selectedConversation.roomId,
      },
      (response) => {
        if (response.success) {
          console.log("Ticket status updated successfully.", response);
        } else {
          console.error("Error updating ticket status:", response.message);
        }
      }
    );
  };

  const handleUnassignment = () => {
    const userId = userData._id;
    const conversationId = selectedConversation._id;
    socket.emit(
      "unassignUserFromConversation",
      {
        userId,
        conversationId,
      },
      (response) => {
        if (response.success) {
          console.log("Ticket unassigned successfully.", response);
          console.log({ response });
          // Filter out conversations whose userId is equal to userData._id
          const updatedConversations = myConversations.filter(
            (conversation) => conversation._id !== response.conversation._id
          );
          setMyConversations(updatedConversations);
          setConversations((prevConversations) => [
            ...prevConversations,
            response.conversation,
          ]);
          setSelectedConversation(null);
          setSortFlag(true);
        } else {
          console.error(
            "Error occured while unassigning ticket:",
            response.message
          );
        }
      }
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long", // e.g., Monday
      year: "numeric", // e.g., 2024
      month: "long", // e.g., August
      day: "numeric", // e.g., 8
      hour: "2-digit", // e.g., 09
      minute: "2-digit", // e.g., 02
      hour12: true, // e.g., PM/AM
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/6 bg-white border-r border-gray-300">
        {/* Sidebar Header */}
        <header className="p-4 border-b border-gray-300 flex justify-center items-center bg-indigo-600 text-white">
          <h1 className="text-2xl font-semibold">My tickets</h1>
        </header>
        {/* Contact List */}
        <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
          {myConversations.length > 0 ? (
            myConversations.map((myConversation, index) => (
              <div
                key={index}
                className={`flex items-center border mb-4 ${
                  selectedConversation &&
                  selectedConversation.roomId === myConversation.roomId &&
                  "bg-blue-300"
                } cursor-pointer hover:bg-gray-100 p-2 rounded-md`}
                onClick={() =>
                  handleRoomSelection(myConversation.roomId, myConversation)
                }
              >
                <div className={`w-14 h-14 ${myConversation.ticketId.status === 'closed' && "bg-red-500"} ${myConversation.ticketId.status === 'open' && "bg-green-500"} ${myConversation.ticketId.status === 'resolved' && "bg-yellow-500"} rounded-full mr-3`}>
                  <p
                    className={`w-14 h-14 rounded-full text-xs ${myConversation.ticketId.status === 'closed' && "text-white"} ${myConversation.ticketId.status === 'open' && "text-black-500"} ${myConversation.ticketId.status === 'resolved' && "text-black"} items-center justify-center mt-5`}
                  >{myConversation.ticketId.status}</p>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {myConversation.ticketId.ticketNumber}
                  </h2>
                </div>
              </div>
            ))
          ) : (
            <p>No customer chats</p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        {/* Chat Header */}
        <header className="bg-white p-4 border-b text-gray-700">
          <h1 className="text-2xl font-semibold">
            {selectedConversation
              ? `Ticket_ID: ${selectedConversation?.ticketId?.ticketNumber}`
              : "Pick a ticket"}
          </h1>
          {selectedConversation && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex ml-auto mr-auto items-center">
                  <p className="flex-1 text-2xl">
                    Status:
                    {selectedConversation.ticketId.status === "closed" && (
                      <span className="text-2xl text-red-500">Closed</span>
                    )}
                  </p>
                  {selectedConversation.ticketId.status !== "closed" && (
                    <select
                      id="status-select"
                      value={selectedConversation.ticketId.status}
                      onChange={handleStatusChange}
                      className={`ml-2 mt-2 ${
                        selectedConversation.ticketId.status === "open"
                          ? "border-green-500"
                          : "border-yellow-500"
                      } border-2 cursor-pointer rounded-md shadow-lg`}
                    >
                      <option value="open">Open</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  )}
                </div>
                {selectedConversation.ticketId.status === "open" && (
                  <button
                    onClick={() => handleUnassignment()}
                    className="mt-2 mr-auto text-sm bg-red-400 hover:bg-red-500"
                  >
                    Unassign ticket
                  </button>
                )}
              </div>
              <p className="mt-4 text-gray-500">Created at: {formatDate(selectedConversation.createdAt)}</p>
            </>
          )}
        </header>

        {/* Chat Messages */}
        <div className="h-screen overflow-y-auto z-0 p-4 pb-56">
          {selectedConversation ? (
            selectedConversation?.messages.length > 0 &&
            selectedConversation?.messages.map((msg, index) =>
              msg.sender === "Agent" ? (
                <div
                  key={index}
                  className="flex justify-end mb-4 cursor-pointer"
                >
                  {msg.message && (
                    <div className="block max-w-96 bg-blue-500 text-white rounded-lg p-3 gap-3">
                      <p className="flex">{msg.message}</p>
                      <p className="text-gray-300 text-xs pl-5 pb-0 pt-1 mr-0 right-0">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  )}
                  {msg.attachment && (
                    <div
                      className={`flex max-w-96 bg-blue-500 text-white ${
                        msg.attachmentType.includes("audio")
                          ? "rounded-full"
                          : "rounded-lg"
                      } p-1 gap-3`}
                    >
                      {renderAttachment(msg.attachment, msg.attachmentType)}
                    </div>
                  )}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center ml-2 mr-2">
                    <img
                      src="https://i.pinimg.com/474x/5c/90/91/5c90918460c19210ac39858555a46af6.jpg"
                      alt="My Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                </div>
              ) : (
                <div key={index} className="flex mb-4 cursor-pointer">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mr-2">
                    <img
                      src="https://pbs.twimg.com/profile_images/1707101905111990272/Z66vixO-_normal.jpg"
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  {msg.message && (
                    <div className="block max-w-96 bg-green-500 rounded-lg p-3 gap-3">
                      <p className="text-gray-900">{msg.message}</p>
                      <p className="text-gray-600 text-xs pl-5 mr-0 right-0 ml-auto">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                  )}
                  {msg.attachment && (
                    <div
                      className={`flex max-w-96 bg-green-500 ${
                        msg.attachmentType.includes("audio")
                          ? "rounded-full"
                          : "rounded-lg"
                      } p-1 gap-3`}
                    >
                      {renderAttachment(msg.attachment, msg.attachmentType)}
                    </div>
                  )}
                </div>
              )
            )
          ) : (
            <p>Pick a ticket to start chatting</p>
          )}
        </div>

        {/* Chat Input */}
        {selectedConversation &&
          selectedConversation.ticketId.status === "open" && (
            <footer className="bg-white border-t border-gray-300 p-2 absolute bottom-0 w-2/3 z-0">
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full p-2 rounded-md border border-gray-400 focus:outline-none focus:border-blue-500"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <div className="absolute right-32 top-1/2 transform -translate-y-1/2 flex items-center">
                  <button
                    className={`bg-white pl-2 hover:bg-white text-gray-500 ${
                      transcribing
                        ? "hover:text-red-500"
                        : "hover:text-gray-700"
                    } ${transcribing ? "text-red-500" : ""}`}
                    onMouseDown={startTranscription}
                    onMouseUp={stopTranscription}
                  >
                    <RiSpeakLine className="h-6 w-6" />
                  </button>
                </div>
                <label className="ml-3 cursor-pointer">
                  <PaperClipIcon className="h-5 w-5 text-gray-500" />
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  className={`bg-transparent hover:bg-transparent p-2 text-gray-500 ${
                    recording ? "hover:text-green-500" : "hover:text-gray-700"
                  } ml-1 ${recording ? "text-green-500" : ""}`}
                  onClick={recording ? stopRecording : startRecording}
                >
                  <MicrophoneIcon
                    className={`h-5 w-5 ${
                      recording ? "animate-pulse" : "text-gray-500"
                    }`}
                  />
                </button>
                <button
                  className="bg-indigo-500 text-white p-2 rounded-md ml-1 flex items-center justify-center"
                  onClick={sendMessage}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </footer>
          )}
      </div>

      <Tickets
        setMyConversations={setMyConversations}
        conversations={conversations}
        setConversations={setConversations}
        setSortFlag={setSortFlag}
        userData={userData}
        setUserData={setUserData}
      />
    </div>
  );
};

export default Chats;
