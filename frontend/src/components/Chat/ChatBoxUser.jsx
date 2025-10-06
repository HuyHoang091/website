// import React, { useState } from "react";
// import useChat from "../../hooks/useChatSocket";
// import { v4 as uuidv4 } from "uuid";

// export default function ChatBoxUser() {
//   const { messages, status, sendMessage } = useChat();
//   const [input, setInput] = useState("");

//   const handleSend = () => {
//     if (!input.trim()) return;

//     const msg = {
//       clientId: uuidv4(),
//       from: JSON.parse(localStorage.getItem("user"))?.id || localStorage.getItem("guestToken"),
//       to: "saler",
//       type: "TEXT",
//       content: input,
//     };

//     sendMessage(msg);
//     setInput("");
//   };

//   return (
//     <div>
//       <h3>Chat ({status})</h3>
//       <div style={{ height: 200, overflowY: "auto", border: "1px solid #ccc" }}>
//         {messages.map((m) => (
//           <div key={m.clientId || m.id}>
//             <b>{m.from}</b>: {m.content} ({m.status})
//           </div>
//         ))}
//       </div>
//       <input
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && handleSend()}
//       />
//       <button onClick={handleSend}>Send</button>
//     </div>
//   );
// }
