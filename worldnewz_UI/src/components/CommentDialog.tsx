import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Comment } from '../types';

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  onAddComment: (text: string, author: string) => void;
  comments: Comment[];
  onDeleteComment: (commentId: string) => void;
  onLikeComment: (commentId: string) => void;
  onDislikeComment: (commentId: string) => void;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onClose,
  onAddComment,
  comments,
  onDeleteComment,
  onLikeComment,
  onDislikeComment,
}) => {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');

  const handleAddComment = () => {
    if (text.trim()) {
      onAddComment(text, author || 'Anonymous');
      setText('');
      setAuthor('');
    }
  };

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Comments ({comments.length})</DialogTitle>
      <DialogContent dividers>
        {/* Add Comment Section */}
        <Box sx={{ mb: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            label="Your Name"
            size="small"
            fullWidth
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Anonymous"
            sx={{ mb: 1 }}
          />
          <TextField
            label="Add a comment..."
            multiline
            rows={3}
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts about this news..."
            variant="outlined"
            sx={{ mb: 1 }}
          />
        </Box>

        {/* Comments List */}
        <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
          {comments.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            comments.map((comment) => (
              <Paper
                key={comment.id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  backgroundColor: '#f5f5f5',
                  borderLeft: '3px solid #1976d2',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {comment.author}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.timestamp)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon fontSize="small" />}
                    onClick={() => onDeleteComment(comment.id)}
                  >
                    Delete
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ my: 1, wordBreak: 'break-word' }}>
                  {comment.text}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<ThumbUpIcon fontSize="small" />}
                    onClick={() => onLikeComment(comment.id)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {comment.likes}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ThumbDownIcon fontSize="small" />}
                    onClick={() => onDislikeComment(comment.id)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {comment.dislikes}
                  </Button>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleAddComment} variant="contained" disabled={!text.trim()}>
          Post Comment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;
