import { useContext, useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    Alert
} from '@mui/material';
import {
    AccessTime as AccessTimeIcon,
    Dashboard as DashboardIcon,
    ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from 'contexts/AuthContext';
import useMenuByRole from '../../hooks/useMenuByRole';

const GuestDashboard = () => {
    const { user } = useContext(AuthContext);
    const { menuItems } = useMenuByRole();
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState('');

    // Calculate time left
    useEffect(() => {
        if (user?.expires_at) {
            const interval = setInterval(() => {
                const now = new Date();
                const expiration = new Date(user.expires_at);
                const diff = expiration - now;

                if (diff <= 0) {
                    setTimeLeft('Expirado');
                    clearInterval(interval);
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeLeft(`${hours}h ${minutes}m`);
                }
            }, 60000); // Update every minute

            // Initial set
            const now = new Date();
            const expiration = new Date(user.expires_at);
            const diff = expiration - now;
            if (diff <= 0) {
                setTimeLeft('Expirado');
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${minutes}m`);
            }

            return () => clearInterval(interval);
        }
    }, [user]);

    // Extract quick links from menu
    const quickLinks = menuItems.items?.map(item => {
        if (item.type === 'group') {
            return item.children || [];
        }
        return [item];
    }).flat().filter(item => item.url && item.url !== '/app/dashboard/guest');

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
                    Bienvenido, {user?.email}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Panel de Acceso Temporal
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Status Card */}
                <Grid item xs={12} md={12}>
                    <Card elevation={2} sx={{ bgcolor: '#e3f2fd' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <AccessTimeIcon sx={{ fontSize: 40, color: '#1565c0' }} />
                                <Box>
                                    <Typography variant="h6" color="#1565c0" fontWeight="bold">
                                        Tiempo Restante de Sesión
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Su acceso expirará automáticamente
                                    </Typography>
                                </Box>
                            </Box>
                            <Chip
                                label={timeLeft || 'Calculando...'}
                                color={timeLeft === 'Expirado' ? 'error' : 'primary'}
                                sx={{ fontSize: '1.2rem', py: 2.5, px: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick Access */}
                <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Módulos Disponibles
                    </Typography>
                    <Grid container spacing={2}>
                        {quickLinks && quickLinks.length > 0 ? (
                            quickLinks.map((link, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card
                                        sx={{
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                                        }}
                                        onClick={() => navigate(link.url)}
                                    >
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                                <ArrowForwardIcon color="primary" />
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {link.title}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        ) : (
                            <Grid item xs={12}>
                                <Alert severity="info">
                                    No tienes módulos adicionales asignados. Contacta al administrador si crees que esto es un error.
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default GuestDashboard;
