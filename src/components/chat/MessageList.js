import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useChat } from '../../context/ChatContext';
import MessageItem from './MessageItem';

const MessageList = () => {
  const { messages, activeConversation } = useChat();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

  if (!activeConversation) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Selecciona una conversación para ver los mensajes aquí.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {messages.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No hay mensajes</Typography>
      ) : (
        messages.map((m) => (
          <MessageItem key={m._id || m.id} message={m} />
        ))
      )}
      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
