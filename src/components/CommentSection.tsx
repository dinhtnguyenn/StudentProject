import Giscus from '@giscus/react';
import { Box, Typography } from '@mui/material';
import { useAppTheme } from '../ThemeContext';

interface CommentSectionProps {
  projectId: string;
}

export default function CommentSection({ projectId }: CommentSectionProps) {
  const { mode } = useAppTheme();

  return (
    <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: 'text.primary' }}>
        Bình luận & Thảo luận
      </Typography>
      <Giscus
        id="comments"
        repo="dinhtnguyenn/StudentProject"
        repoId="R_kgDOS-Z9Dw"
        category="General"
        categoryId="DIC_kwDOS-Z9D84C_a3a"
        mapping="specific"
        term={`Project: ${projectId}`}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={mode === 'dark' ? 'dark_dimmed' : 'light'}
        lang="vi"
        loading="lazy"
      />
    </Box>
  );
}
