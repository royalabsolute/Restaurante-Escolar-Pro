import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Divider
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  AdminPanelSettings as AdminIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

const QuickActionsWidget = ({ title, actions = [] }) => {
  const getActionIcon = (type) => {
    switch (type) {
      case 'student':
        return <SchoolIcon sx={{ color: 'primary.main' }} />;
      case 'teacher':
        return <WorkIcon sx={{ color: 'secondary.main' }} />;
      case 'admin':
        return <AdminIcon sx={{ color: 'error.main' }} />;
      case 'assignment':
        return <AssignmentIcon sx={{ color: 'warning.main' }} />;
      default:
        return <PersonIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case 'student': return 'primary';
      case 'teacher': return 'secondary';
      case 'admin': return 'error';
      case 'assignment': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        action={
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        {actions.length === 0 ? (
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
          >
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" color="textSecondary">
              No hay acciones pendientes
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                      {getActionIcon(action.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {action.title}
                        </Typography>
                        {action.urgent && (
                          <Chip
                            label="Urgente"
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                          {action.description}
                        </Typography>
                        <Chip
                          label={action.category}
                          size="small"
                          color={getActionColor(action.type)}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Typography variant="caption" color="textSecondary">
                        {action.count || 1}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {action.count > 1 ? 'elementos' : 'elemento'}
                      </Typography>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < actions.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;
