import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { PaperClipIcon, PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { RiSpeakLine } from "react-icons/ri";
import "../CSS/AgentChat.css";

const socket = io("http://localhost:8000");

const Chats = () => {
  const [messages, setMessages] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentType, setAttachmentType] = useState("");
  const [rooms, setRooms] = useState([]);
  const [transcribing, setTranscribing] = useState(false);
  const recognitionRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [recording, setRecording] = useState(false);


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

  useEffect(() => {
    if (attachment) {
      sendMessage(); // Automatically send message when attachment is set
    }
  }, [attachment]);

  const sendMessage = () => {
    if (selectedRoom && (message.trim() || attachment)) {
      const msg = { room: selectedRoom, sender: "Agent", message, attachment, attachmentType };
      console.log("Sending message:", msg);
      socket.emit("message", msg);
      setMessage("");
      setAttachment(null); // Reset attachment after sending
      setAttachmentType(""); // Reset attachment type after sending
    }
  };


  const handleRoomSelection = (room) => {
    console.log("Selecting room:", room);
    setSelectedRoom(room);
  };

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
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
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
      window.open(attachment, '_blank');
    };

    if (attachmentType.includes("image")) {
      return <img src={attachment} alt="attachment" className="w-22 max-w-xs rounded-lg" />;
    } else if (attachmentType.includes("video")) {
      return <video src={attachment} controls className="w-22 max-w-xs rounded-lg" />;
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-300">
        {/* Sidebar Header */}
        <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-indigo-600 text-white">
          <h1 className="text-2xl font-semibold">Chat Web</h1>
        </header>
        {/* Contact List */}
        <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
          {rooms.length > 0 ? (
            rooms.map((room, index) => (
              <div
                key={index}
                className="flex items-center mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                onClick={() => handleRoomSelection(room)}
              >
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-3">
                  <img
                    src={`https://placehold.co/200x/ffa8e4/ffffff.svg?text=Room ${room}&font=Lato`}
                    alt="Room Avatar"
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{room}</h2>
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
        <header className="bg-white p-4 text-gray-700">
          <h1 className="text-2xl font-semibold">
            {selectedRoom ? `ID: ${selectedRoom}` : "Select a Room"}
          </h1>
        </header>

        {/* Chat Messages */}
        <div className="h-screen overflow-y-auto p-4 pb-36">
          {selectedRoom ? (
            messages
              .filter((msg) => msg.room === selectedRoom)
              .map((msg, index) => (
                msg.sender === "Agent" ? (
                <div key={index} className="flex justify-end mb-4 cursor-pointer">
                  {msg.message && 
                  <div className="flex max-w-96 bg-blue-500 text-white rounded-lg p-3 gap-3">
                    <p>{msg.message}</p>
                  </div>
                  }
                  {msg.attachment && 
                    <div className={`flex max-w-96 bg-blue-500 text-white ${msg.attachmentType.includes("audio") ? "rounded-full" : "rounded-lg" } p-1 gap-3`}>
                      {renderAttachment(msg.attachment, msg.attachmentType)}
                  </div>
                  }
                  <div className="w-9 h-9 rounded-full flex items-center justify-center ml-2">
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
                {msg.message && 
                <div className="flex max-w-96 bg-green-500 rounded-lg p-3 gap-3">
                    <p className="text-gray-700">{msg.message}</p>
                </div>
                }
                {msg.attachment && 
                <div className={`flex max-w-96 bg-green-500 ${msg.attachmentType.includes("audio") ? "rounded-full" : "rounded-lg" } p-1 gap-3`}>
                    {renderAttachment(msg.attachment, msg.attachmentType)}
                </div>
                }
                
                </div>
                )
              ))
          ) : (
            <p>Select a room to start chatting</p>
          )}
        </div>

        {/* Chat Input */}
        {selectedRoom && (
          <footer className="bg-white border-t border-gray-300 p-3 absolute bottom-0 w-3/4">
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
                    transcribing ? "hover:text-red-500" : "hover:text-gray-700"
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
                className={`bg-transparent hover:bg-transparent p-2 text-gray-500 ${recording ? "hover:text-green-500" : "hover:text-gray-700"} ml-1 ${recording ? "text-green-500" : ""}`}
                onClick={recording ? stopRecording : startRecording}
              >
                <MicrophoneIcon className={`h-5 w-5 ${recording ? "animate-pulse" : "text-gray-500"}`} />
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
    </div>
  );
};

export default Chats;
