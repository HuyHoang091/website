import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default function useChatMessages(chatId, chatName) {
  // ===== STATE MANAGEMENT =====
  // Message states
  const [messages, setMessages] = useState([]);
  const [displayMessages, setDisplayMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  // Loading states
  const [loadingMore, setLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Refs
  const messagesRef = useRef(null);
  const STREAM_ID = useRef(null);
  const preventScrollRef = useRef(false);
  const scrollIntervalRef = useRef(null);
  const initialDataLoadedRef = useRef(false);
  const currentPageRef = useRef(0);
  const latestChatIdRef = useRef(chatId);
  const currentChatRef = useRef(chatId); // Track current chat for async operations
  const chatSessionIdRef = useRef(uuidv4()); // Unique session ID for this chat instance
  
  // Constants
  const MESSAGES_PER_PAGE = 10;
  const LOADING_DELAY = 1200;

  // ===== UTILITY FUNCTIONS =====
  // Scroll to bottom handler
  const scrollToBottom = useCallback((smooth = false) => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Setup scroll interval during loading
  const setupScrollInterval = useCallback(() => {
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    
    scrollIntervalRef.current = setInterval(() => {
      if (messagesRef.current) scrollToBottom();
    }, 200);
    
    return scrollIntervalRef.current;
  }, [scrollToBottom]);
  
  // Mark messages as read
  const markMessagesAsSeen = useCallback(() => {
    if (!chatId) return;
    
    // Store current session ID
    const currentSessionId = chatSessionIdRef.current;
    
    axios.post(
      `${process.env.REACT_APP_API_URL}/api/chat/markAsRead`,
      { userId: chatId },
      { headers: { Authorization: `Bearer ${localStorage.getItem("tokenJWT")}` } }
    ).catch(err => {
      // Only log error if we're still in the same session
      if (currentSessionId === chatSessionIdRef.current) {
        console.error("Không thể đánh dấu tin nhắn là SEEN:", err);
      }
    });
  }, [chatId]);

  // Reset all chat state
  const resetChatState = useCallback(() => {
    // Generate a new session ID
    chatSessionIdRef.current = uuidv4();
    
    // Reset all state values
    setMessages([]);
    setDisplayMessages([]);
    setHasMore(true);
    setLoadingMore(false);
    setIsInitialLoading(true);
    
    // Reset all refs
    currentPageRef.current = 0;
    preventScrollRef.current = true;
    STREAM_ID.current = null;
    initialDataLoadedRef.current = false;
    
    // Clear any intervals
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  // ===== DATA LOADING =====
  // Load initial messages from server
  const loadInitialMessages = useCallback(() => {
    if (!chatId) return;

    // Store the current session ID and chat ID for this specific load operation
    const loadingSessionId = chatSessionIdRef.current;
    const loadingForChatId = chatId;
    
    // Update current chat reference
    currentChatRef.current = chatId;
    
    setIsInitialLoading(true);
    initialDataLoadedRef.current = false;
    preventScrollRef.current = true;
    
    const scrollInterval = setupScrollInterval();

    axios.get(
      `${process.env.REACT_APP_API_URL}/api/chat/saler/${chatId}`, 
      { headers: { Authorization: `Bearer ${localStorage.getItem("tokenJWT")}` } }
    ).then(res => {
      // Check if the chat/session has changed since we started loading
      if (currentChatRef.current !== loadingForChatId || 
          chatSessionIdRef.current !== loadingSessionId) {
        clearInterval(scrollInterval);
        return;
      }
    
      const data = res.data || [];
      const total = data.length;
      const initial = data.slice(Math.max(total - MESSAGES_PER_PAGE, 0));
      
      // Set all messages immediately
      setMessages(data);
      initialDataLoadedRef.current = true;
      
      // Controlled rendering sequence with strategic scroll calls
      setTimeout(() => {
        // Check again if chat/session has changed
        if (currentChatRef.current !== loadingForChatId || 
            chatSessionIdRef.current !== loadingSessionId) {
          clearInterval(scrollInterval);
          return;
        }
        
        setDisplayMessages(initial);
        currentPageRef.current = 1;
        setHasMore(total > MESSAGES_PER_PAGE);
        markMessagesAsSeen();
        scrollToBottom();
        
        setTimeout(() => {
          // Check again if chat/session has changed
          if (currentChatRef.current !== loadingForChatId || 
              chatSessionIdRef.current !== loadingSessionId) {
            clearInterval(scrollInterval);
            return;
          }
          
          clearInterval(scrollInterval);
          scrollToBottom();
          
          setTimeout(() => {
            if (currentChatRef.current !== loadingForChatId || 
                chatSessionIdRef.current !== loadingSessionId) return;
            
            setIsInitialLoading(false);
            requestAnimationFrame(() => {
              if (currentChatRef.current !== loadingForChatId || 
                  chatSessionIdRef.current !== loadingSessionId) return;
              
              scrollToBottom();
              setTimeout(() => {
                if (currentChatRef.current === loadingForChatId && 
                    chatSessionIdRef.current === loadingSessionId) {
                  scrollToBottom();
                }
              }, 50);
            });
            
            setTimeout(() => {
              if (currentChatRef.current === loadingForChatId && 
                  chatSessionIdRef.current === loadingSessionId) {
                preventScrollRef.current = false;
              }
            }, 300);
          }, 100);
        }, LOADING_DELAY);
      }, 100);
    }).catch(e => {
      console.error(e);
      clearInterval(scrollInterval);
      
      // Only update states if we're still in the same chat/session
      if (currentChatRef.current === loadingForChatId && 
          chatSessionIdRef.current === loadingSessionId) {
        setIsInitialLoading(false);
        preventScrollRef.current = false;
        initialDataLoadedRef.current = false;
      }
    });
  }, [chatId, scrollToBottom, setupScrollInterval, markMessagesAsSeen]);

  // Load more (older) messages
  const loadMoreMessages = useCallback(() => {
    if (loadingMore || !hasMore || preventScrollRef.current) return;
    
    // Save the current chatId and sessionId for this specific load operation
    const loadingForChatId = chatId;
    const loadingSessionId = chatSessionIdRef.current;

    setLoadingMore(true);
    preventScrollRef.current = true;
    
    const total = messages.length;
    const currentCount = currentPageRef.current * MESSAGES_PER_PAGE;
    const nextPage = currentPageRef.current + 1;
    const nextCount = nextPage * MESSAGES_PER_PAGE;
    
    const start = Math.max(total - nextCount, 0);
    const end = total - currentCount;
    const moreMessages = messages.slice(start, end);
    
    if (moreMessages.length === 0) {
      setHasMore(false);
      setLoadingMore(false);
      preventScrollRef.current = false;
      return;
    }

    // Preserve scroll position when loading more
    const container = messagesRef.current;
    const firstChild = container && container.firstChild;
    const oldHeight = container ? container.scrollHeight : 0;
    const oldScrollTop = container ? container.scrollTop : 0;

    setTimeout(() => {
      // Check if chat/session has changed before updating
      if (currentChatRef.current !== loadingForChatId || 
          chatSessionIdRef.current !== loadingSessionId) {
        setLoadingMore(false);
        preventScrollRef.current = false;
        return;
      }
      
      setDisplayMessages(prev => [...moreMessages, ...prev]);
      currentPageRef.current = nextPage;
      
      requestAnimationFrame(() => {
        // Check again if chat/session has changed
        if (currentChatRef.current !== loadingForChatId || 
            chatSessionIdRef.current !== loadingSessionId) {
          setLoadingMore(false);
          preventScrollRef.current = false;
          return;
        }
        
        if (container && firstChild) {
          // Better scroll position restoration
          const newHeight = container.scrollHeight;
          const heightDiff = newHeight - oldHeight;
          container.scrollTop = oldScrollTop + heightDiff;
        }
        
        setLoadingMore(false);
        setTimeout(() => {
          if (currentChatRef.current === loadingForChatId && 
              chatSessionIdRef.current === loadingSessionId) {
            preventScrollRef.current = false;
          }
        }, 300);
      });
    }, LOADING_DELAY / 2);
  }, [messages, hasMore, loadingMore, chatId]);

  // ===== MESSAGE HANDLING =====
  // Add new message
  const addMessage = useCallback((msg, sendCallback) => {
    const currentSessionId = chatSessionIdRef.current;
    
    if (currentChatRef.current !== chatId || 
        chatSessionIdRef.current !== currentSessionId) return;

    setMessages(prev => [...prev, msg]);
    setDisplayMessages(prev => [...prev, msg]);
    requestAnimationFrame(() => scrollToBottom(true));
    return sendCallback(msg);
  }, [scrollToBottom, chatId]);

  // Create new message object
  const createMessage = useCallback((content, type = "message") => {
    return {
      clientId: uuidv4(),
      to: chatId,
      toName: chatName,
      type,
      content,
      status: "SENDING",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSender: true,
    };
  }, [chatId, chatName]);

  // Handle incoming messages (WebSocket)
  const handleNewMessage = useCallback((body) => {
    const currentSessionId = chatSessionIdRef.current;
    
    // AI streaming token
    if (body.partial && body.aiResponse && String(body.from) === String(chatId)) {
      if (currentChatRef.current !== chatId || 
          chatSessionIdRef.current !== currentSessionId) return;
      
      const id = STREAM_ID.current || (STREAM_ID.current = `ai-stream-${chatId}-${Date.now()}`);
      
      setDisplayMessages(prev => {
        const idx = prev.findIndex(x => x.id === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { 
            ...copy[idx], 
            content: (copy[idx].content || "") + (body.content || "") 
          };
          return copy;
        }
        
        return [
          ...prev,
          {
            id,
            content: body.content || "",
            type: "message",
            time: new Date().toLocaleTimeString(),
            isSender: true,
            fromName: "AI Assistant",
            aiResponse: true,
            streaming: true,
          },
        ];
      });
      
      requestAnimationFrame(scrollToBottom);
      return;
    }

    // AI final message
    if (body.aiResponse && !body.partial && String(body.from) === String(chatId)) {
      if (currentChatRef.current !== chatId || 
          chatSessionIdRef.current !== currentSessionId) return;
      
      const streamId = STREAM_ID.current;
      STREAM_ID.current = null;
      
      setDisplayMessages(prev => {
        const filtered = prev.filter(x => x.id !== streamId);
        return [
          ...filtered,
          {
            id: body.id || `ai-${Date.now()}`,
            content: body.content || "",
            type: "message",
            time: body.createdAt || new Date().toLocaleTimeString(),
            isSender: true,
            fromName: "AI Assistant",
            aiResponse: true,
          },
        ];
      });
      
      requestAnimationFrame(scrollToBottom);
      return;
    }

    // Status update
    if (body.clientId) {
      if (currentChatRef.current !== chatId || 
          chatSessionIdRef.current !== currentSessionId) return;
      
      setDisplayMessages(prev => {
        const i = prev.findIndex(p => p.clientId === body.clientId);
        if (i >= 0) {
            const copy = [...prev];
            const updatedMsg = { ...copy[i], ...body };
            if (body.id) {
                delete updatedMsg.clientId; // Loại bỏ clientId khi đã có id chính thức
            }
            copy[i] = updatedMsg;
            return copy;
        }
        return prev;
      });
      return;
    }

    // Regular message from other user
    if (body.from && !body.aiResponse && String(body.from) === String(chatId)) {
      if (currentChatRef.current !== chatId || 
          chatSessionIdRef.current !== currentSessionId) return;
      
      const newMessage = {
        id: body.id,
        content: body.content,
        type: body.type || "message",
        time: body.createdAt,
        isSender: false,
        status: body.status,
      };
      
      setMessages(prev => [...prev, newMessage]);
      setDisplayMessages(prev => [...prev, newMessage]);
      markMessagesAsSeen();
      requestAnimationFrame(scrollToBottom);
    }
  }, [chatId, markMessagesAsSeen, scrollToBottom]);

  // ===== EFFECTS & LIFECYCLE =====
  // Scroll event listener
  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    
    const currentSessionId = chatSessionIdRef.current;

    const handleScroll = () => {
      // Don't process scroll events from a different chat session
      if (chatSessionIdRef.current !== currentSessionId) return;
      
      if (preventScrollRef.current || isInitialLoading) return;
      
      if (container.scrollTop < 100 && hasMore && !loadingMore) {
        loadMoreMessages();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore, loadMoreMessages, isInitialLoading]);

  // Ensure scroll to bottom when loading finishes
  useEffect(() => {
    const currentSessionId = chatSessionIdRef.current;
    
    if (!isInitialLoading && initialDataLoadedRef.current && 
        chatSessionIdRef.current === currentSessionId) {
      if (currentPageRef.current === 1) {
        requestAnimationFrame(() => {
          if (chatSessionIdRef.current === currentSessionId) {
            scrollToBottom();
            setTimeout(() => {
              if (chatSessionIdRef.current === currentSessionId) {
                scrollToBottom();
              }
            }, 100);
          }
        });
      }
    }
  }, [isInitialLoading, displayMessages.length, scrollToBottom]);

  // Load messages when chatId changes
  useEffect(() => {
    if (chatId) {
      // Reset all state and generate a new chat session ID
      resetChatState();
      
      // Update current chat reference
      currentChatRef.current = chatId;
      latestChatIdRef.current = chatId;
      
      // Load new chat data
      loadInitialMessages();
    }
    
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [chatId, loadInitialMessages, resetChatState]);

  // Scroll during loading
  useEffect(() => {
    const currentSessionId = chatSessionIdRef.current;
    
    if (isInitialLoading && messagesRef.current && 
        chatSessionIdRef.current === currentSessionId) {
      scrollToBottom();
    }
  }, [isInitialLoading, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Update references when chatId changes
  useEffect(() => {
    latestChatIdRef.current = chatId;
    currentChatRef.current = chatId;
  }, [chatId]);

  return {
    messages,
    displayMessages,
    hasMore,
    loadingMore,
    isInitialLoading,
    messagesRef,
    createMessage,
    addMessage,
    markMessagesAsSeen,
    handleNewMessage,
    scrollToBottom
  };
}