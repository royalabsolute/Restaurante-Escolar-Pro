import { Box, Typography } from '@mui/material';

/**
 * PageHeader - Componente unificado para encabezados de página institucionales.
 * 
 * @param {string} title - Título principal (H2).
 * @param {string} subtitle - Descripción técnica o informativa.
 * @param {React.ReactNode} actions - Botones o controles de acción (Derecha).
 */
const PageHeader = ({ title, subtitle, actions }) => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 5
        }}>
            <Box>
                <Typography
                    variant="h2"
                    sx={{
                        fontWeight: 800,
                        color: '#1e293b',
                        letterSpacing: -1,
                        mb: 0.5,
                        textTransform: 'uppercase'
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    variant="body1"
                    color="textSecondary"
                    fontWeight="500"
                >
                    {subtitle}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {actions}
            </Box>
        </Box>
    );
};

export default PageHeader;
