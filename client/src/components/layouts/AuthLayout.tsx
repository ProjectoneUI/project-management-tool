import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';

const AuthLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuth();
  
  // Wenn der Benutzer bereits authentifiziert ist, zur Startseite weiterleiten
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Linke Seite - Nur auf Desktop sichtbar */}
      {!isMobile && (
        <Box
          sx={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            p: 4,
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom>
            Projektmanagement-Tool
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Organisieren Sie Ihre Projekte effizient mit KI-Unterstützung
          </Typography>
          <Box
            component="img"
            src="/assets/auth-illustration.svg"
            alt="Projektmanagement Illustration"
            sx={{
              maxWidth: '80%',
              mt: 4,
            }}
          />
        </Box>
      )}
      
      {/* Rechte Seite - Authentifizierungsformulare */}
      <Box
        sx={{
          flex: isMobile ? '1 1 100%' : '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
            }}
          >
            <Outlet />
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout; 