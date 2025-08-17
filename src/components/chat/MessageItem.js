import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { SmartToy, Person, AccountCircle } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const MessageItem = ({ message }) => {
  const isBot = message.sender === 'bot';
  const isHuman = message.sender === 'human';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isBot || isHuman ? 'flex-end' : 'flex-start',
        mb: 2
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: isBot || isHuman ? 'row-reverse' : 'row',
          alignItems: 'flex-end',
          maxWidth: '80%'
        }}
      >
        <Avatar sx={{ ml: 1, mr: 1 }}>
          {isBot ? <SmartToy /> : isHuman ? <Person /> : <AccountCircle />}
        </Avatar>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 4,
            bgcolor: isBot ? 'primary.light' : isHuman ? 'secondary.light' : 'grey.200',
            color: isBot || isHuman ? 'common.white' : 'text.primary'
          }}
        >
          <Typography variant="body1">{message.text}</Typography>
          <Typography
            variant="caption"
            display="block"
            sx={{
              textAlign: 'right',
              color: isBot || isHuman ? 'common.white' : 'text.secondary'
            }}
          >
            {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageItem;