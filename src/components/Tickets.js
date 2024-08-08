import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";

const socket = io("http://localhost:8000");

function Tickets({ setMyConversations, conversations, setConversations, setSortFlag, setUserData, userData }) {
  
  const [conversationFlag, setConversationFlag] = useState(false);

  const handleAssignment = () => {
    if (!conversations || !userData) return;
  
    // Filter out conversations whose userId is equal to userData._id
    const ownConversations = conversations.filter(conversation => conversation.userId === userData._id);
  
    // Update myConversations with unique entries
    setMyConversations((prevConversations) => {
      const newConversations = [...prevConversations, ...ownConversations];
      const uniqueConversations = Array.from(new Set(newConversations.map(conv => conv._id)))
                                       .map(id => newConversations.find(conv => conv._id === id));
      return uniqueConversations;
    });
  
    // Update the conversations state to remove ownConversations
    const remainingConversations = conversations.filter(conversation => conversation?.userId !== userData._id);
    setConversations(remainingConversations);
  
    setConversationFlag(false);
    setSortFlag(true);
  }
  

  useEffect(() => {
    if(conversations && conversationFlag){
        handleAssignment();
    }
  }, [conversationFlag]);

  useEffect(() => {
    // Define an async function inside useEffect
    const fetchConversations = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_CHAT_MICROSERVICE_URL}/conversations/all`
        );
        console.log("response", response.data[200]?.ticketId?.status); // response.data is the array of conversations

        // Filter conversations where ticket status is 'Open'
        const conversations = response.data;

        // Sort conversations by created timestamp in descending order (latest first)
        const sortedConversations = conversations.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Update state with filtered conversations
        setConversations(sortedConversations);
        setConversationFlag(true);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    // Call the async function
    fetchConversations();
  }, []);

  console.log({ conversations });

  const handleTicketAssignment = (conversation) => {
    if (!userData || !userData._id) {
      console.error("User data is not available");
      return;
    }
  
    // Emit an event to the server to assign the ticket
    socket.emit(
      "assignUserToConversation",
      {
        conversationId: conversation._id,
        userId: userData._id, // Assuming userData contains the current user ID
      },
      (response) => {
        if (response.success) {
          console.log("Ticket assigned successfully:", response);
          // Update the state or UI as needed
          // For example, you could refresh the conversation list or show a success message
          setMyConversations((prevConversations) => [
            ...prevConversations,
            conversation
          ]);

          const remainingConversations = conversations.filter(con => con._id !== conversation._id);
          setConversations(remainingConversations);
          setSortFlag(true);
        } else {
          console.error("Error assigning ticket:", response.message);
        }
      }
    );
  };
  

  return (
    <div className="w-1/6 bg-white h-screen border-l border-gray-300 z-0">
      {/* Sidebar Header */}
      <header className="p-4 border-b border-gray-300 flex justify-center items-center bg-indigo-600 text-white">
        <h1 className="text-2xl font-semibold">Tickets</h1>
      </header>
      {/* Contact List */}
      <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
        {conversations.length > 0 ? (
          conversations.map((conversation, index) => (
            <div
              key={index}
              className="flex items-center border mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
              onClick={() => handleTicketAssignment(conversation)}
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full ml-3">
                <img
                  src={`https://placehold.co/200x/ffa8e4/ffffff.svg?text=${conversation.ticketId.status}&font=Lato`}
                  alt="ticket Avatar"
                  className="w-12 h-12 rounded-full"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">
                  {conversation.ticketId.ticketNumber}
                </h2>
              </div>
            </div>
          ))
        ) : (
          <p>No Tickets here</p>
        )}
      </div>
    </div>
  );
}

export default Tickets;
