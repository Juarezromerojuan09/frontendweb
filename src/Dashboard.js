import React from 'react';
import { Box, Grid } from '@mui/material';
import ConversationList from './components/sidebar/ConversationList';
import MessageList from './components/chat/MessageList';
import Header from './components/common/Header';
import ChatHeader from './components/common/ChatHeader';
import MessageInput from './components/chat/MessageInput';
import { useChat } from './context/ChatContext';

const Dashboard = () => {
  const { activeConversation } = useChat();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header />
      <Grid container sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Grid item xs={4} sx={{ borderRight: '1px solid #e0e0e0', height: '100%' }}>
          <ConversationList />
        </Grid>
        <Grid item xs={8} sx={{ display: 'flex', flexDirection: 'column' }}>
          <ChatHeader title={activeConversation?.customerName || activeConversation?.customerNumber || 'Conversación'} />
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <MessageList />
          </Box>
          {activeConversation && (
            <MessageInput conversationId={activeConversation._id || activeConversation.id} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;