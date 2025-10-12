// stompClient.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let client = null;
let isConnecting = false;
let callbacks = [];     // callback đợi connect
let connectListeners = []; // callback mỗi lần connect thành công

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

export function getStompClient(onConnectCallback) {
  // Nếu đã có client đang active thì trả về luôn
  if (client && client.active) {
    onConnectCallback?.(client);
    return client;
  }

  // Nếu client chưa sẵn sàng thì push callback vào hàng đợi
  if (onConnectCallback) callbacks.push(onConnectCallback);

  if (!client && !isConnecting) {
    isConnecting = true;
    let userId = generateID();
    let isSale = JSON.parse(localStorage.getItem("user")).role === "SALER";

    const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws?` + userId);

    client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},

      onConnect: () => {
        console.log("✅ Connected to STOMP");
        isConnecting = false;

        if (isSale) {
          client.publish({ destination: "/app/registerSale", body: "" });
        }

        // Gọi tất cả callback đã đợi
        callbacks.forEach((cb) => cb?.(client));
        callbacks = [];

        // Gọi tất cả listener đã đăng ký
        connectListeners.forEach((listener) => listener(client));
      },

      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame.headers["message"], frame.body);
      },

      onDisconnect: () => {
        console.warn("⚠️ STOMP disconnected");
        client = null;
      },

      onWebSocketClose: () => {
        console.warn("⚠️ WebSocket closed, sẽ tự reconnect sau 5s...");
        isConnecting = false;
        client = null;
      },
    });

    client.activate();
  }

  return client;
}

// Cho phép component đăng ký callback mỗi lần connect/reconnect
export function onStompConnect(listener) {
  connectListeners.push(listener);

  // return cleanup
  return () => {
    connectListeners = connectListeners.filter((l) => l !== listener);
  };
}
