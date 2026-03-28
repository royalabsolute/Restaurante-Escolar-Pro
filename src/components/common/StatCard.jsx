import React from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';

/**
 * StatCard - Componente compartido para tarjetas de estadísticas institucionales.
 * 
 * @param {string} title - Título de la estadística.
 * @param {string|number} value - Valor principal.
 * @param {React.ElementType|React.ReactElement} icon - Icono de Material-UI.
 * @param {string} color - Color del tema (primary, success, etc.) o HEX.
 * @param {boolean} loading - Estado de carga.
 */
const StatCard = ({ title, value, icon: Icon, color = 'primary', bgColor: customBgColor, loading = false, description, subtitle, onClick }) => {
    // Manejo robusto de colores (MUI vs HEX)
    const isThemeColor = ['primary', 'secondary', 'error', 'info', 'success', 'warning'].includes(color);
    const mainColor = isThemeColor ? `${color}.main` : color;
    const bgColor = customBgColor || (isThemeColor ? `${color}.50` : `${color}15`);
    const descText = subtitle || description;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'grey.100',
                display: 'flex',
                flexDirection: 'column', // Cambiado a column para soportar descripción abajo
                gap: 1.5,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(30, 41, 59, 0.08)',
                    borderColor: isThemeColor ? 'primary.light' : color
                }
            }}
            onClick={onClick}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: bgColor,
                        color: mainColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {Icon ? (
                        React.isValidElement(Icon) ? Icon : <Icon fontSize="medium" />
                    ) : (
                        <BarChartIcon fontSize="medium" />
                    )}
                </Box>
                <Box flex={1}>
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        fontWeight="700"
                        sx={{
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            opacity: 0.8
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="h4"
                        fontWeight="800"
                        sx={{
                            lineHeight: 1,
                            mt: 0.5,
                            color: '#1e293b'
                        }}
                    >
                        {loading ? <CircularProgress size={24} thickness={5} /> : value}
                    </Typography>
                </Box>
            </Box>
            {descText && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, opacity: 0.7 }}>
                    {descText}
                </Typography>
            )}
        </Paper>
    );
};

export default StatCard;
