import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";

const SERVER_URL = "http://localhost:8080/ws";

export default function ChatDemo() {
  const [stompUser, setStompUser] = useState(null);
  const [stompSale, setStompSale] = useState(null);
  const [token, setToken] = useState(null);
  const [userMsg, setUserMsg] = useState("");
  const [saleMsg, setSaleMsg] = useState("");
  const [userMessages, setUserMessages] = useState([]);
  const [saleMessages, setSaleMessages] = useState([]);

  useEffect(() => {
    // === User socket ===
    const uuid = uuidv4();
    const socketUser = new SockJS(`${SERVER_URL}?usedId=1`);
    const clientUser = Stomp.over(socketUser);
    clientUser.connect({}, () => {
      clientUser.send("/app/registerSaler", {}, uuid);

      clientUser.subscribe("/user/queue/token", (msg) => {
        setToken(msg.body);
        console.log("Received token:", msg.body);
      });

      clientUser.subscribe("/user/queue/user", (msg) => {
        setUserMessages((prev) => [...prev, msg.body]);
      });

      setStompUser(clientUser);
    });

    // === Sale socket ===
    const uuidSale = uuidv4();
    const socketSale = new SockJS(`${SERVER_URL}?uuid="sale1"`);
    const clientSale = Stomp.over(socketSale);
    clientSale.connect({}, () => {
      clientSale.send("/app/registerSale", {}, {});

      clientSale.subscribe("/user/queue/sale", (msg) => {
        setSaleMessages((prev) => [...prev, msg.body]);
      });

      setStompSale(clientSale);
    });

    return () => {
      clientUser.disconnect();
      clientSale.disconnect();
    };
  }, []);

  const sendUserMessage = () => {
    if (stompUser && userMsg) {
      stompUser.send("/app/userMessage", {}, JSON.stringify({ from: localStorage.getItem('user').id, fromName: localStorage.getItem('user').name, type: "message", content: userMsg, clientId: uuidv4() }));
      setUserMsg("");
    }
  };

  const sendSaleMessage = () => {
    if (stompSale && saleMsg && token) {
      stompSale.send(
        "/app/saleMessage",
        {},
        JSON.stringify({ to: token, text: saleMsg })
      );
      setSaleMsg("");
    }
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "1rem" }}>
      {/* User Chat */}
      <div style={{ border: "1px solid black", padding: "1rem", width: "45%" }}>
        <h2>User Chat</h2>
        <div style={{ minHeight: "200px", border: "1px solid #ccc", marginBottom: "1rem", padding: "0.5rem" }}>
          {userMessages.map((m, i) => <div key={i}>{m}</div>)}
        </div>
        <input
          value={userMsg}
          onChange={(e) => setUserMsg(e.target.value)}
          placeholder="User message"
        />
        <button onClick={sendUserMessage}>Send</button>
      </div>

      {/* Sale Chat */}
      <div style={{ border: "1px solid black", padding: "1rem", width: "45%" }}>
        <h2>Sale Chat</h2>
        <div style={{ minHeight: "200px", border: "1px solid #ccc", marginBottom: "1rem", padding: "0.5rem" }}>
          {saleMessages.map((m, i) => <div key={i}>{m}</div>)}
        </div>
        <input
          value={saleMsg}
          onChange={(e) => setSaleMsg(e.target.value)}
          placeholder="Sale message"
        />
        <button onClick={sendSaleMessage}>Send</button>
      </div>
    </div>
  );
}
