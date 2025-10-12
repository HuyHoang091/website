import { useCallback } from "react";
import axios from "axios";

export default function useFileUpload(createMessage, addMessage, sendMessage) {
  // Upload và gửi file
  const uploadAndSendFile = useCallback(async (file) => {
    if (!file) return;
    
    const fd = new FormData();
    fd.append("file", file);
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/upload/chat`, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + localStorage.getItem("tokenJWT"),
        },
      });
      
      const msg = createMessage(res.data.url, "image");
      addMessage(msg, sendMessage);
    } catch (e) {
      console.error("upload failed", e);
    }
  }, [createMessage, addMessage, sendMessage]);

  // Xử lý sự kiện paste
  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type?.includes("image")) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          uploadAndSendFile(file);
        }
      }
    }
  }, [uploadAndSendFile]);

  // Xử lý sự kiện upload file
  const handleFileChange = useCallback((e) => {
    uploadAndSendFile(e.target.files?.[0]);
  }, [uploadAndSendFile]);

  return { handlePaste, handleFileChange };
}