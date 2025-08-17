import React, { useState, useContext } from 'react';
import { ChatContext } from '../../context/ChatContext';
import { TextField, IconButton, InputAdornment, Box } from '@mui/material';
import { AttachFile, Send } from '@mui/icons-material';

const MessageInput = ({ conversationId }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const { activeMode, sendMessage } = useContext(ChatContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() || file) {
      sendMessage({
        conversationId,
        text: message,
        file,
        mode: activeMode
      });
      setMessage('');
      setFile(null);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              {activeMode === 'human' && (
                <IconButton component="label">
                  <AttachFile />
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </IconButton>
              )}
              <IconButton type="submit">
                <Send />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
};

export default MessageInput;