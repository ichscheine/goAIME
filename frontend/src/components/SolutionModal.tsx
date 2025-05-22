import React from 'react';
import { Modal, Box, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SolutionModalProps {
  open: boolean;
  onClose: () => void;
  solution: React.ReactNode | string;
  problemNumber: number;
}

const SolutionModal: React.FC<SolutionModalProps> = ({ 
  open, 
  onClose, 
  solution,
  problemNumber
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={{ 
          position: 'absolute' as 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 400, 
          bgcolor: 'background.paper', 
          borderRadius: 2,
          boxShadow: 24,
          p: 4 
        }}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>
          Solution for Problem {problemNumber}
        </Typography>
        <Typography id="modal-modal-description" sx={{ mb: 2 }}>
          {solution}
        </Typography>
        <Button variant="contained" onClick={onClose} fullWidth>
          Close
        </Button>
      </Box>
    </Modal>
  );
}

export default SolutionModal;