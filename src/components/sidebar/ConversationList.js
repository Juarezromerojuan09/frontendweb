import React, { useMemo, useState } from 'react';
import { List, TextField, Box, Typography } from '@mui/material';
import ConversationItem from './ConversationItem';
import { useChat } from '../../context/ChatContext';

const ConversationList = () => {
  const { conversations } = useChat();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(conv =>
      (conv.customerName || '').toLowerCase().includes(term) ||
      (conv.customerNumber || '').includes(term)
    );
  }, [conversations, searchTerm]);

  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      <TextField
        fullWidth
        label="Buscar conversación"
        variant="outlined"
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ p: 2 }}
      />
      <List sx={{ overflow: 'auto', height: 'calc(100% - 120px)' }}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conversation => (
            <ConversationItem 
              key={conversation._id || conversation.id} 
              conversation={conversation} 
            />
          ))
        ) : (
          <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
            No hay conversaciones
          </Typography>
        )}
      </List>
    </Box>
  );
};

export default ConversationList;