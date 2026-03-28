import { Box, Paper, Typography, Grid, useTheme } from '@mui/material';
import {
    PeopleAlt as PeopleIcon,
    Restaurant as MealIcon,
    GroupAdd as SuplenteIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon, color }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }
            }}
        >
            <Box
                sx={{
                    p: 1.5,
                    borderRadius: 3,
                    bgcolor: `${color}.50`,
                    color: `${color}.main`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Icon />
            </Box>
            <Box>
                <Typography variant="caption" color="textSecondary" fontWeight="medium" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ lineHeight: 1 }}>
                    {value}
                </Typography>
            </Box>
        </Paper>
    );
};

const ScannerStats = ({ studentsCount = 0, suplentesCount = 0 }) => {
    return (
        <Box sx={{ mb: 4 }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Total Platos"
                        value={studentsCount + suplentesCount}
                        icon={MealIcon}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Estudiantes"
                        value={studentsCount}
                        icon={PeopleIcon}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Suplentes"
                        value={suplentesCount}
                        icon={SuplenteIcon}
                        color="warning"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ScannerStats;
