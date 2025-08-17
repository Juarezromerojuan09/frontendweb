import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import ModeToggle from '../chat/ModeToggle';

const ChatHeader = ({ title }) => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">{title || 'Conversación'}</Typography>
        <Box>
          <ModeToggle />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ChatHeader;
