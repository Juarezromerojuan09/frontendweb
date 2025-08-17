import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { TextField, Button, Box, Typography, Paper, CircularProgress } from '@mui/material';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({
    username: false,
    password: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación
    const errors = {
      username: !credentials.username.trim(),
      password: !credentials.password.trim()
    };
    
    setFormErrors(errors);
    
    if (Object.values(errors).some(Boolean)) {
      setError('Todos los campos son requeridos');
      return;
    }

    setLoading(true);
    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1976d2 0%, #303f9f 100%)'
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: 400 }}>
        <Typography variant="h4" gutterBottom align="center">
          Iniciar Sesión
        </Typography>
        {error && (
          <Typography color="error" align="center" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Usuario"
            variant="outlined"
            margin="normal"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            error={formErrors.username}
            helperText={formErrors.username ? "Campo requerido" : ""}
            required
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            variant="outlined"
            margin="normal"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            error={formErrors.password}
            helperText={formErrors.password ? "Campo requerido" : ""}
            required
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Ingresar'}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;