// components/RevivedChecklistDetails.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const RevivedChecklistDetails = ({ checklist, onBack, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      revived: 'warning',
      approved: 'success',
      completed: 'info',
      pending: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          variant="outlined"
          size="small"
        >
          Back to List
        </Button>
        <Typography variant="h6" fontWeight="bold">
          Revived Checklist Details
        </Typography>
        <Chip
          label={checklist.status}
          color={getStatusColor(checklist.status)}
          size="medium"
        />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Basic Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Customer Information
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="DCL Number" 
                  secondary={checklist.dclNo || 'N/A'}
                  secondaryTypographyProps={{ fontWeight: 'bold' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Customer Name" 
                  secondary={checklist.customerName || 'N/A'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Customer Number" 
                  secondary={checklist.customerNumber || 'N/A'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Loan Type" 
                  secondary={
                    <Chip 
                      label={checklist.loanType} 
                      size="small" 
                      variant="outlined" 
                    />
                  }
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Right Column - Revival Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <CalendarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Revival Information
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Revived By" 
                  secondary={checklist.revivedBy?.name || 'Unknown'}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Revived At" 
                  secondary={formatDate(checklist.revivedAt)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Original Status" 
                  secondary={
                    <Chip 
                      label={checklist.originalStatus || 'N/A'} 
                      size="small"
                      color="info"
                    />
                  }
                />
              </ListItem>
              
              {checklist.revivedTo && (
                <ListItem>
                  <ListItemIcon>
                    <ArrowBackIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="New Checklist" 
                    secondary={
                      <Chip 
                        label={checklist.revivedTo.dclNo}
                        size="small"
                        color="success"
                        clickable
                        onClick={() => {/* Navigate to new checklist */}}
                      />
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Full Width - Documents */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Documents Summary
            </Typography>
            
            <Grid container spacing={2}>
              {checklist.documents?.map((category, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {category.category}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.docList?.length || 0} documents
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {/* Navigate to new checklist */}}
          disabled={!checklist.revivedTo}
        >
          View New Checklist
        </Button>
      </Box>
    </Box>
  );
};

export default RevivedChecklistDetails;