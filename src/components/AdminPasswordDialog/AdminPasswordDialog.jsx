import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Warning as WarningIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    background: '#ffffff',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    minWidth: '480px',
    overflow: 'visible',
  },
}));

const AlertBox = styled(Box)({
  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
  borderRadius: '16px 16px 0 0',
  padding: '32px 32px 24px',
  textAlign: 'center',
  color: '#ffffff',
});

const ContentBox = styled(Box)({
  padding: '32px',
  background: '#ffffff',
});


const AdminPasswordDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Autorización Requerida",
  message = "Esta operación requiere la contraseña maestra del administrador.",
  warningText = "Esta acción es IRREVERSIBLE e invalidará todos los códigos existentes."
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Por favor, ingresa la contraseña');
      return;
    }

    setLoading(true);
    setError('');

    const result = await onConfirm(password);
    
    if (result.success) {
      setPassword('');
      setError('');
      onClose();
    } else {
      setError(result.message || 'Contraseña incorrecta');
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      {/* Header Alert Style */}
      <AlertBox>
        <Box sx={{ 
          width: 72, 
          height: 72, 
          margin: '0 auto 16px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}>
          <WarningIcon sx={{ fontSize: 40, color: '#ffffff' }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95, fontSize: '14px' }}>
          {warningText}
        </Typography>
      </AlertBox>

      {/* Content */}
      <ContentBox>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ padding: 0, mb: 3 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 3, 
                color: '#64748B',
                textAlign: 'center',
                fontSize: '15px'
              }}
            >
              {message}
            </Typography>

            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="Ingrese la contraseña maestra"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              error={!!error}
              helperText={error}
              disabled={loading}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={loading}
                      size="small"
                    >
                      {showPassword ? 
                        <VisibilityOff sx={{ fontSize: 20, color: '#94A3B8' }} /> : 
                        <Visibility sx={{ fontSize: 20, color: '#94A3B8' }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: '#F8FAFC',
                  fontSize: '15px',
                  '& fieldset': {
                    borderColor: '#E2E8F0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#CBD5E1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B6B',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputBase-input': {
                  padding: '14px 12px',
                },
              }}
            />

            <Box sx={{ 
              mt: 2.5, 
              p: 2, 
              background: '#F1F5F9',
              borderRadius: '10px',
              borderLeft: '3px solid #3B82F6'
            }}>
              <Typography variant="body2" sx={{ color: '#475569', fontSize: '13px' }}>
                💡 <strong>Importante:</strong> La contraseña maestra es única e inmutable. Solo el administrador principal debe conocerla.
              </Typography>
            </Box>
          </DialogContent>

          <DialogActions sx={{ padding: 0, gap: 1.5 }}>
            <Button
              onClick={handleClose}
              disabled={loading}
              fullWidth
              sx={{
                borderRadius: '10px',
                padding: '12px',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 600,
                color: '#64748B',
                border: '2px solid #E2E8F0',
                background: '#ffffff',
                '&:hover': {
                  background: '#F8FAFC',
                  borderColor: '#CBD5E1',
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !password}
              fullWidth
              variant="contained"
              sx={{
                borderRadius: '10px',
                padding: '12px',
                textTransform: 'none',
                fontSize: '15px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FF5252 0%, #FF7043 100%)',
                  boxShadow: '0 6px 16px rgba(255, 107, 107, 0.4)',
                },
                '&:disabled': {
                  background: '#E2E8F0',
                  color: '#94A3B8',
                },
              }}
            >
              {loading ? 'Verificando...' : 'Confirmar'}
            </Button>
          </DialogActions>
        </form>
      </ContentBox>
    </StyledDialog>
  );
};

export default AdminPasswordDialog;
