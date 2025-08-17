import React, { useContext } from 'react';
import { ToggleButton, ToggleButtonGroup, Box } from '@mui/material';
import { SmartToy, Person } from '@mui/icons-material';
import { ChatContext } from '../../context/ChatContext';

const ModeToggle = () => {
  const { activeMode, setActiveMode } = useContext(ChatContext);
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <ToggleButtonGroup
        value={activeMode}
        exclusive
        onChange={(_, newMode) => setActiveMode(newMode)}
        aria-label="Modo de respuesta"
      >
        <ToggleButton value="bot" aria-label="Modo bot">
          <SmartToy sx={{ mr: 1 }} /> Bot
        </ToggleButton>
        <ToggleButton value="human" aria-label="Modo humano">
          <Person sx={{ mr: 1 }} /> Humano
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ModeToggle;