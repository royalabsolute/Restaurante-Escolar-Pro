import { Dialog, DialogContent, DialogActions, Button, Box, Typography, IconButton } from '@mui/material';
import { Close as CloseIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import StudentScanCard from './StudentScanCard';

const ValidationDialog = ({ open, onClose, student, status, onConfirm, processing }) => {
    if (!student) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 5,
                    overflow: 'visible',
                    position: 'relative'
                }
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: -15,
                    top: -15,
                    bgcolor: 'white',
                    boxShadow: 3,
                    '&:hover': { bgcolor: 'grey.100' },
                    zIndex: 10
                }}
            >
                <CloseIcon />
            </IconButton>

            <DialogContent sx={{ p: 0 }}>
                <StudentScanCard student={student} status={status} />
            </DialogContent>

            <DialogActions sx={{ p: 3, gap: 2 }}>
                <Button
                    variant="outlined"
                    fullWidth
                    onClick={onClose}
                    sx={{ borderRadius: 3, py: 1.5, fontWeight: 'bold' }}
                >
                    CANCELAR
                </Button>
                <Button
                    variant="contained"
                    fullWidth
                    color="primary"
                    startIcon={<CheckIcon />}
                    onClick={onConfirm}
                    disabled={status === 'already_registered' || processing}
                    sx={{
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                    }}
                >
                    {status === 'already_registered' ? 'YA REGISTRADO' : 'CONFIRMAR ASISTENCIA'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ValidationDialog;
