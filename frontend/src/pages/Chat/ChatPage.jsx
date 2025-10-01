import React from "react";
import ChatWindow from "../../components/Chat/ChatWindow";
import ListChat from "../../components/Chat/ListChat";
import Menu from "../../components/Menu/Menu";
// function generateID() {
//   let id = "";
//   let guest = localStorage.getItem("guest");

//   if (guest === "true") {
//     id = "guest=" + localStorage.getItem("guestToken");
//   } else {
//     id = "userId=" + JSON.parse(localStorage.getItem("user")).id;
//   }
//   return id;
// }

// export default function useChat() {
//   const [messages, setMessages] = useState([]);
//   const [status, setStatus] = useState("offline");
  

  

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = React.useState(null);
  const [selectedName, setSelectedName] = React.useState(null);
  // const stompClient = useRef(null);
  // const [userId] = useState(generateID());

  // useEffect(() => {
  //   const socket = new SockJS("http://localhost:8080/ws?" + userId);

  //   const client = new Client({
  //     webSocketFactory: () => socket,
  //     debug: () => {},
  //     reconnectDelay: 5000,
  //     onConnect: () => {
  //       setStatus("online");

  const handleSelectChat = (id, name) => { 
      setSelectedName(name);
      setSelectedChatId(id);
      console.log("Selected chat ID:", id);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
        <Menu />
        <div style={{ borderRight: "1px solid #ccc" }}>
            <ListChat onSelectChat={handleSelectChat} selectedChatId={selectedChatId} />
        </div>
        <div style={{ width: "100%", background: "aliceblue", alignContent: "center", justifyItems: "center" }}>
            <ChatWindow chatId={selectedChatId} chatName={selectedName} />
        </div>
    </div>
  );
}