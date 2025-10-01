// chatReducer.js
export const initialState = {
  chatCards: [], // { id, name, lastMessage, time, avatar }
  messages: {},  // { [conversationId]: [msg, ...] }
};

export function chatReducer(state, action) {
  switch (action.type) {
    case "SET_CHAT_LIST":
      return { ...state, chatCards: action.payload };
    case "SET_MESSAGES":
      return {
        ...state,
        messages: { ...state.messages, [action.payload.id]: action.payload.list },
      };
    case "ADD_MESSAGE": {
      const { conversationId, msg, name } = action.payload;
      const oldMsgs = state.messages[conversationId] || [];
      const messages = {
        ...state.messages,
        [conversationId]: [...oldMsgs, msg],
      };

      const cardIndex = state.chatCards.findIndex((c) => c.id === conversationId);
      let chatCards;
      if (cardIndex >= 0) {
        chatCards = state.chatCards.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: msg.content, time: msg.time }
            : c
        );
      } else {
        chatCards = [
          ...state.chatCards,
          {
            id: conversationId,
            name: name || "Unknown",
            lastMessage: msg.content,
            time: msg.time,
            avatar: msg.avatar || "",
          },
        ];
      }

      return { ...state, messages, chatCards };
    }
    default:
      return state;
  }
}
