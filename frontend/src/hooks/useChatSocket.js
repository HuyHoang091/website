import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

function generateID() {
  let id = "";
  let guest = localStorage.getItem("guest");

  if (guest === "true") {
    id = "guest=" + localStorage.getItem("guestToken");
  } else {
    id = "userId=" + JSON.parse(localStorage.getItem("user")).id;
  }
  return id;
}
function isSaleUser() {
  let sale = localStorage.getItem("user").role;
  if (sale === "SALER") {
    return true;
  }
  return false;
}

export default function useChat() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("Offline");
  const stompClient = useRef(null);
  const [userId] = useState(generateID());
  const [isSale] = useState(isSaleUser());

  useEffect(() => {
    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws?` + userId);

    const client = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      reconnectDelay: 5000,
      onConnect: () => {
        setStatus("Online");

        // Subscribe các queue
        if (isSale) {
          client.send("/app/registerSale", {}, {});
        }
        if (!isSale) {
          client.subscribe("/user/queue/user", (message) => {
            const body = JSON.parse(message.body);
            setMessages((prev) => [...prev, body]);
          });
        } else {
          client.subscribe("/user/queue/sale", (message) => {
            const body = JSON.parse(message.body);
            setMessages((prev) => [...prev, body]);
          });
        }
      },
      onDisconnect: () => setStatus("Offline"),
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    };
  }, [userId]);

  const sendMessage = (json) => {
    if (stompClient.current && stompClient.current.connected) {
      const payload = {
          from: "saler",
          fromName: "",
          to: json.to,
          toName: json.toName,
          type: json.type,
          content: json.content,
          clientId: json.clientId
      };

      stompClient.current.send('/app/saleMessage', {}, JSON.stringify(payload));
    } else {
      console.log("Socket chưa kết nối");
    }
  };

  return { messages, status, sendMessage };
}
