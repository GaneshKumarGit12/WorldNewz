import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { useColorMode } from '../../context/ThemeContext';

export const ScienceHealthEditorial: React.FC = () => {
  const { mode } = useColorMode();
  const isDark = mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 4,
        mb: 6,
        p: { xs: 3, sm: 4, md: 5 },
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.03)',
      }}
    >
      <Typography
        variant="h4"
        component="h2"
        gutterBottom
        sx={{
          fontWeight: 800,
          background: 'linear-gradient(45deg, #00c6ff, #0072ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }
        }}
      >
        The Scientific and Health Frontiers: Discoveries, Public Health, and Information Curation
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            The Historical Evolution of Scientific Inquiry and Medicine
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            The trajectory of human progress is deeply intertwined with the development of the scientific method and the evolution of medical science. The Scientific Revolution of the 16th and 17th centuries, led by figures like Copernicus, Galileo, and Newton, challenged traditional dogma by establishing empirical observation and mathematical verification as the foundations of knowledge. In medicine, the shift from ancient theories to empirical pathology accelerated in the 19th century with Louis Pasteur and Robert Koch’s development of the germ theory of disease. This breakthrough led to antiseptic techniques, clean water systems, and the development of vaccines, dramatically reducing child mortality and expanding the human lifespan. The discovery of penicillin by Alexander Fleming in 1928 marked the beginning of the antibiotic era, transforming previously fatal infections into treatable conditions.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            The mid-20th century witnessed the molecular biology revolution, sparked by James Watson, Francis Crick, and Rosalind Franklin's discovery of the DNA double helix structure in 1953. This milestone laid the groundwork for the Human Genome Project, completed in 2003, which mapped the chemical base pairs making up human DNA. Simultaneously, the Space Age expanded scientific inquiry beyond Earth, starting with the launch of Sputnik in 1957 and leading to the Apollo moon landings, robotic Mars explorers, and deep-space telescopes. Today, science and health are defined by computational biology, gene editing, and planetary environmental monitoring, requiring interdisciplinary collaboration to solve complex global challenges.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Understanding these milestones helps us evaluate modern scientific breakthroughs. Contemporary innovations, such as mRNA therapeutics and genome editing, are built on decades of empirical research and theoretical models. By examining these historical foundations, readers can better appreciate the rigorous processes of validation and consensus building that define scientific progress.
          </Typography>

          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
            Contemporary Frontiers: mRNA Vaccines, CRISPR, and Climate Science
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            The current scientific landscape is experiencing rapid progress in genetic engineering, public health, and environmental monitoring. The development and deployment of mRNA vaccine technology demonstrated how synthetic biology can address global health emergencies, and researchers are now applying this platform to target malaria, influenza, and various cancers. Additionally, CRISPR-Cas9 gene editing technology is transitioning from laboratory research to clinical applications, offering potential treatments for inherited genetic disorders such as sickle cell anemia.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Simultaneously, environmental and climate science has become a critical focus. Climate researchers use satellite telemetry and oceanic sensor networks to monitor global temperature anomalies, carbon dioxide concentrations, and ice sheet dynamics. This empirical data is essential for developing climate adaptation strategies and transition pathways, helping governments and industries manage risks and build environmental resilience.
          </Typography>

          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
            Expert Insights: Public Health and Research Integrity
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Leading healthcare authorities emphasize that scientific communication must prioritize empirical accuracy and transparent data reporting. The World Health Organization (WHO) highlights that addressing health misinformation is critical to building trust in public healthcare systems. Our science and health vertical tracks peer-reviewed publications and clinical trials to ensure our coverage aligns with established scientific consensus.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            To read detailed health guidelines and international epidemiological reports, consult the official <Link href="https://www.who.int" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>World Health Organization Portal</Link> and the <Link href="https://www.bbc.com/news/science_and_environment" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC Science & Environment Hub</Link>.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            To explore how new software technologies and AI models are being used to predict protein folding and accelerate drug discovery, visit our <Link href="/technology" sx={{ fontWeight: 700 }}>Technology News</Link> section. To understand the wellness policies and dietary guidelines recommended by nutritionists, check out our <Link href="/lifestyle" sx={{ fontWeight: 700 }}>Lifestyle News</Link> vertical.
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Key Metrics & Discoveries
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Clinical Trials:</strong> The number of active global clinical trials has grown, with oncology and immunology representing the largest shares of clinical research.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Space Observation:</strong> Deep-space telescopes have cataloged thousands of exoplanets, providing new data for atmospheric analysis and planetary research.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Global Temperature:</strong> Environmental datasets indicate a steady increase in global average temperatures, highlighting the need for carbon mitigation strategies.
            </Typography>
          </Box>
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Scientific Integrity Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our science and health news desk prioritizes articles from peer-reviewed journals, certified research universities, and global public health agencies. We exclude unverified medical claims, pseudo-scientific theories, and speculative health blogs to ensure our content is accurate and educational.
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Frequently Asked Questions (FAQs)
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            How do you verify health and medical news before indexing?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We require that all medical updates refer to peer-reviewed studies published in reputable scientific journals (such as Nature, The Lancet, and JAMA) or official advisories from national public health agencies. Our curation system downranks sensationalized health claims and focuses on established clinical consensus.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            What is the difference between a pre-print and a peer-reviewed study?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A pre-print is a preliminary scientific report that has not undergone peer review by independent experts. While we cover pre-prints of significant interest, we explicitly label them as "unreviewed pre-prints" to distinguish them from peer-reviewed studies that have completed academic validation.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            How do you filter out pseudo-scientific claims and health scams?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            WorldNewzs maintains a strict scientific integrity filter. We exclude sources promoting alternative medicine, unverified dietary supplements, and health guides that contradict the consensus of major scientific societies (such as the WHO, NIH, and CDC).
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
