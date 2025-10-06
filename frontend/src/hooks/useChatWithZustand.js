// src/store/chatStore.js
import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  chats: [], // danh sách chat (CardChat)
  messages: {}, // { chatId: [messages] }

  // Thêm hoặc cập nhật 1 Chat (CardChat)
  upsertChat: (chat) => {
    set((state) => {
      const exists = state.chats.find((c) => c.id === chat.id);
      if (exists) {
        // cập nhật lastMessage và time
        return {
          chats: state.chats.map((c) =>
            c.id === chat.id
              ? { ...c, lastMessage: chat.lastMessage, time: chat.time }
              : c
          ),
        };
      } else {
        return { chats: [chat, ...state.chats] }; // thêm mới đầu danh sách
      }
    });
  },

  // Thêm tin nhắn vào message list
  addMessage: (chatId, message) => {
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: [...chatMessages, message],
        },
      };
    });
  },

  // Cập nhật tin nhắn theo id (clientId -> id thật)
  updateMessageStatus: (chatId, clientId, updateData) => {
    set((state) => {
      const chatMessages = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: chatMessages.map((msg) =>
            msg.id === clientId ? { ...msg, ...updateData } : msg
          ),
        },
      };
    });
  },

  // Lấy messages của 1 chat
  getMessages: (chatId) => {
    return get().messages[chatId] || [];
  },
}));
