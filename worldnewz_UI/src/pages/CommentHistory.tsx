import React, { useState, useMemo } from 'react';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useComments } from '../hooks/useComments';
import { SEOMeta } from '../seo/SEOMeta';

const CommentHistory: React.FC = () => {
  const navigate = useNavigate();
  const { getAllComments, deleteComment } = useComments();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'likes'>('newest');

  const allComments = getAllComments();

  const filteredAndSortedComments = useMemo(() => {
    let filtered = allComments.filter(
      (comment) =>
        comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.articleUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'likes':
          return b.likes - a.likes;
        default:
          return 0;
      }
    });
  }, [allComments, searchTerm, sortBy]);

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'author',
      headerName: 'Author',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'Anonymous' ? 'default' : 'primary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'text',
      headerName: 'Comment',
      flex: 1,
      minWidth: 300,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            py: 1,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'timestamp',
      headerName: 'Date',
      width: 200,
      renderCell: (params: GridRenderCellParams) => formatDate(params.value),
    },
    {
      field: 'likes',
      headerName: 'Likes',
      width: 80,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={<span>👍</span>}
          label={params.value}
          size="small"
          variant="outlined"
          color="success"
        />
      ),
    },
    {
      field: 'dislikes',
      headerName: 'Dislikes',
      width: 100,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={<span>👎</span>}
          label={params.value}
          size="small"
          variant="outlined"
          color="error"
        />
      ),
    },
    {
      field: 'articleUrl',
      headerName: 'Article',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography
          variant="caption"
          sx={{
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            display: 'block',
          }}
          title={params.value}
        >
          {params.value?.substring(0, 40)}...
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => {
            const comment = filteredAndSortedComments.find((c) => c.id === params.row.id);
            if (comment) {
              deleteComment(comment.articleUrl, comment.id);
            }
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  const rows = filteredAndSortedComments.map((comment, index) => ({
    ...comment,
    id: comment.id || index,
  }));

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '70vh' }}>
      <SEOMeta
        title="Comment History"
        description="View, search, and manage your complete comment history across WorldNewzs articles."
        keywords="comment history, user comments, discussion history, article replies"
        canonical="https://worldnewzs.in/comments"
      />
      {/* Back Button */}
      <Button
        id="comments-back-btn"
        startIcon={<ArrowBackIcon />}
        variant="outlined"
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
          Comment History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Comments: {allComments.length}
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search comments, authors, or articles..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1, minWidth: '250px' }}
          />
          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            size="small"
            sx={{ minWidth: '150px' }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="likes">Most Liked</MenuItem>
          </TextField>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Showing {filteredAndSortedComments.length} of {allComments.length} comments
        </Typography>
      </Paper>

      {/* Comments Table */}
      {filteredAndSortedComments.length === 0 ? (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {allComments.length === 0 ? 'No comments yet' : 'No comments match your search'}
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={1} sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
              },
            }}
          />
        </Paper>
      )}
    </Container>
  );
};

export default CommentHistory;
