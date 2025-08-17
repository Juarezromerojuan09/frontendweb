import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io as socketIO } from 'socket.io-client';
import {
  listConversations as listConversationsApi,
  getMessages as getMessagesApi,
  sendMessageApi,
  updateConversationMode
} from '../services/chat';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversationState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeMode, setActiveModeState] = useState('bot');
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const socketUrl = useMemo(() => {
    return process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
  }, []);

  // Conectar Socket.IO
  useEffect(() => {
    const s = socketIO(socketUrl, { withCredentials: true });
    socketRef.current = s;

    s.on('connect', () => {
      // console.log('Socket conectado', s.id);
      if (activeConversation?._id) {
        s.emit('join_conversation', String(activeConversation._id));
      }
    });

    s.on('new_message', (msg) => {
      const convId = String(msg.conversationId);
      const activeId = String(activeConversation?._id || '');
      if (convId && activeId && convId === activeId) {
        setMessages(prev => [...prev, msg]);
      }
      // Actualizar metadatos de conversación
      setConversations(prev => prev.map(c =>
        String(c._id) === convId
          ? { ...c, lastMessageAt: msg.timestamp || new Date().toISOString(), lastMessage: { text: msg.text } }
          : c
      ));
    });

    s.on('conversation_updated', (conv) => {
      setConversations(prev => prev.map(c => String(c._id) === String(conv._id) ? { ...c, ...conv } : c));
      if (activeConversation && String(activeConversation._id) === String(conv._id)) {
        setActiveConversationState(prev => ({ ...prev, ...conv }));
        setActiveModeState(conv.mode);
      }
    });

    s.on('conversation_upserted', (conv) => {
      setConversations(prev => {
        const exists = prev.some(c => String(c._id) === String(conv._id));
        const mapped = { ...conv, id: conv._id, updatedAt: conv.lastMessageAt || conv.updatedAt, unread: true };
        return exists ? prev.map(c => String(c._id) === String(conv._id) ? { ...c, ...mapped } : c) : [mapped, ...prev];
      });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl, activeConversation?._id]);

  // Cargar conversaciones al iniciar
  const loadConversations = async () => {
    const res = await listConversationsApi({});
    const mapped = (res?.data || []).map(c => ({
      ...c,
      id: c._id, // compat con componentes existentes
      updatedAt: c.lastMessageAt || c.updatedAt,
      lastMessage: c.lastMessage || null,
      unread: false
    }));
    setConversations(mapped);
  };

  useEffect(() => {
    loadConversations().catch(() => {});
  }, []);

  // Seleccionar conversación: une a la sala y carga mensajes
  const selectConversation = async (conversation) => {
    if (!conversation?._id && !conversation?.id) return;
    const convId = String(conversation._id || conversation.id);
    setActiveConversationState(conversation);
    setActiveModeState(conversation.mode || 'bot');
    try {
      // Unirse a la sala
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', convId);
      }
      // Cargar mensajes
      const msgs = await getMessagesApi(convId);
      setMessages(msgs || []);
    } catch (e) {
      setMessages([]);
    }
  };

  // Enviar mensaje humano
  const sendMessage = async ({ conversationId, text }) => {
    if (!conversationId || !text?.trim()) return;
    try {
      const created = await sendMessageApi({ conversationId, text });
      // Optimista: agregar mientras llega evento real-time
      setMessages(prev => [...prev, created]);
      // Actualizar lista
      setConversations(prev => prev.map(c =>
        String(c._id) === String(conversationId)
          ? { ...c, lastMessageAt: created.timestamp || new Date().toISOString(), lastMessage: { text: created.text } }
          : c
      ));
    } catch (_) {}
  };

  // Cambiar modo y sincronizar backend
  const setActiveMode = async (mode) => {
    if (!activeConversation?._id || !['bot','human'].includes(mode)) return;
    try {
      const convId = String(activeConversation._id);
      const updated = await updateConversationMode(convId, mode);
      setActiveModeState(updated.mode);
      setActiveConversationState(prev => ({ ...prev, mode: updated.mode }));
      // Notificar lista
      setConversations(prev => prev.map(c => String(c._id) === convId ? { ...c, mode: updated.mode } : c));
    } catch (_) {}
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      messages,
      activeMode,
      unreadCount,
      setActiveConversation: selectConversation,
      updateConversation: () => {}, // compat; no-op
      sendMessage,
      setActiveMode
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
