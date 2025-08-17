import React from 'react';
import { ListItem, ListItemAvatar, Avatar, ListItemText, Typography, Badge } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useChat } from '../../context/ChatContext';

const ConversationItem = ({ conversation }) => {
  const { setActiveConversation } = useChat();

  return (
    <ListItem
      button
      onClick={() => setActiveConversation(conversation)}
      sx={{
        borderBottom: '1px solid #eee',
        '&:hover': { backgroundColor: '#f5f5f5' }
      }}
    >
      <ListItemAvatar>
        <Badge
          color="primary"
          variant="dot"
          invisible={!conversation.unread}
        >
          <Avatar>
            <AccountCircle />
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={conversation.customerName || conversation.customerNumber}
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              color="text.primary"
              sx={{ display: 'block' }}
            >
              {conversation.lastMessage?.text || 'Nuevo chat'}
            </Typography>
            {format(new Date(conversation.updatedAt), 'PP', { locale: es })}
          </>
        }
      />
    </ListItem>
  );
};

export default ConversationItem;