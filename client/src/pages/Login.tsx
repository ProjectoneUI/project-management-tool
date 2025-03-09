import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Link, 
  InputAdornment, 
  IconButton, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Ungültige E-Mail-Adresse')
    .required('E-Mail ist erforderlich'),
  password: Yup.string()
    .required('Passwort ist erforderlich')
});

const Login: React.FC = () => {
  const { login, error, loading, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      await login(values.email, values.password);
    }
  });
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Anmelden
      </Typography>
      
      <Typography variant="body1" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
        Melden Sie sich an, um auf Ihr Konto zuzugreifen
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="email"
          name="email"
          label="E-Mail"
          variant="outlined"
          margin="normal"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          disabled={loading}
        />
        
        <TextField
          fullWidth
          id="password"
          name="password"
          label="Passwort"
          type={showPassword ? 'text' : 'password'}
          variant="outlined"
          margin="normal"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Passwort-Sichtbarkeit umschalten"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, mb: 3 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Passwort vergessen?
          </Link>
        </Box>
        
        <Button
          fullWidth
          variant="contained"
          color="primary"
          type="submit"
          size="large"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Anmelden'}
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Noch kein Konto?{' '}
            <Link component={RouterLink} to="/register" variant="body2">
              Registrieren
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Login; 