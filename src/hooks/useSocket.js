import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useSocket = (url, events) => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(url, {
      auth: {
        token: localStorage.getItem('token')
      }
    });
    
    Object.entries(events).forEach(([event, handler]) => {
      socketRef.current.on(event, handler);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [url, events]);

  const sendMessage = (message) => {
    socketRef.current.emit('new_message', message);
  };

  const joinConversation = (conversationId) => {
    socketRef.current.emit('join_conversation', conversationId);
  };

  return { sendMessage, joinConversation };
};

export default useSocket;