import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import { useColorMode } from '../../context/ThemeContext';

export const PoliticsEditorial: React.FC = () => {
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
          background: 'linear-gradient(45deg, #c83a15, #ff7043)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.25rem' }
        }}
      >
        Global Political Systems, Democratic Resilience, and Algorithmic Neutrality
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
            The Historical Trajectory of Governance and Democracy
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            The evolution of global political structures spans thousands of years, tracing back to the early democratic experiments in Athens, Greece, and the representative frameworks of the Roman Republic. Over the centuries, the concept of governance has shifted from absolute monarchies and feudal structures to constitutional frameworks based on citizen participation and the rule of law. The signing of the Magna Carta in 1215 established the fundamental principle that even the sovereign is subject to the law, paving the way for modern constitutional systems. The Peace of Westphalia in 1648 defined the concept of state sovereignty, establishing the nation-state as the primary actor in international relations. Today, democratic governance is the predominant political model, characterized by regular, free, and fair elections, separation of powers, and the protection of fundamental human rights.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            During the 18th and 19th centuries, the Enlightenment fueled the rise of liberal democracy, emphasizing individual freedoms, civil liberties, and popular sovereignty. Philosophers like John Locke, Montesquieu, and Jean-Jacques Rousseau laid the intellectual groundwork for representative systems, which were subsequently codified in the United States Constitution and the French Declaration of the Rights of Man. The 20th century witnessed a dramatic struggle between democracy and authoritarian regimes, culminating in the post-Cold War expansion of democratic governance across Eastern Europe, Latin America, and parts of Asia and Africa. Despite these advances, the current political landscape presents unique challenges, including institutional trust deficits, democratic backsliding, and the polarization of public discourse.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Understanding these historical milestones is essential for contextualizing modern political events. By acknowledging the deep roots of constitutional systems and the struggles that shaped democratic institutions, citizens can better analyze contemporary debates regarding executive power, legislative oversight, and electoral reforms. WorldNewzs aims to provide the historical context necessary for readers to move beyond superficial headlines and grasp the systemic factors driving political discourse.
          </Typography>

          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
            Contemporary Developments: Digital Politics, Cybersecurity, and Electoral Integrity
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            In the 21st century, the intersection of technology and politics has fundamentally transformed how campaigns are waged, how governments interact with citizens, and how public opinion is formed. The rapid adoption of social media platforms has democratized political communication, allowing candidates to bypass traditional media gates and engage directly with voters. This digital shift has also introduced complex challenges, such as the spread of computational propaganda, targeted micro-targeting, and foreign interference in domestic elections. Electoral cybersecurity has emerged as a critical concern, with governments scrambling to protect voting databases, tabulation networks, and information systems from sophisticated cyber threats.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Elections worldwide are increasingly monitored by independent bodies to ensure transparency and prevent systemic fraud. Organizations like the Carter Center and the Organization for Security and Co-operation in Europe (OSCE) deploy observers globally to assess whether electoral processes align with international standards. Additionally, the rise of open-source investigative journalism and public fact-checking organizations has created new layers of accountability, exposing campaign finance violations and deceptive advertising. As digital voting systems gain traction in several countries, the debate between convenience and security continues to shape electoral policy.
          </Typography>

          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, mt: 4 }}>
            Expert Perspectives: Media Curation and Democratic Resilience
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            Political scientists and media theorists argue that a well-informed citizenry is the bedrock of democratic resilience. Dr. Helen Landemore, Professor of Political Science at Yale University, highlights the value of "open democracy," suggesting that institutionalizing citizen deliberation can counter political apathy and restore trust in public bodies. However, this deliberative model requires access to reliable, unmanipulated news sources. In an era dominated by algorithmic filter bubbles, news aggregators have a profound responsibility to present balanced, multi-perspective coverage of political debates, ensuring that readers are exposed to diverse viewpoints.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            For more in-depth coverage of global governance, elections, and public policy, readers can consult authoritative international organizations. The <Link href="https://www.bbc.com/news/world" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>BBC World News Desk</Link> and the <Link href="https://www.reuters.com/world/" target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 700 }}>Reuters World Politics Hub</Link> offer detailed, verified reporting on international diplomatic missions and national electoral processes.
          </Typography>
          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, textAlign: 'justify' }}>
            To explore how emerging technologies are influencing political campaigns and state regulatory policies, check out our dedicated <Link href="/technology" sx={{ fontWeight: 700 }}>Technology News</Link> section. To understand the macroeconomic impacts of executive fiscal policies and trade treaties, visit our <Link href="/business" sx={{ fontWeight: 700 }}>Business News</Link> page.
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Key Statistics & Indicators
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Democracy Index:</strong> According to the EIU Democracy Index 2025, less than 8% of the global population resides in a "full democracy," while over 37% live under authoritarian regimes.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Voter Turnout:</strong> National voter turnout varies significantly, ranging from over 90% in countries with compulsory voting (such as Australia and Belgium) to under 50% in several established western democracies.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              • <strong>Information Integrity:</strong> Over 70% of respondents in global surveys report feeling concerned about the spread of fake news and digital disinformation during electoral cycles.
            </Typography>
          </Box>
          <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Editorial Curation Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our political news desk adheres to a strict neutrality policy. We ingest feeds only from verified publishers with a documented history of factual journalism. Our automated pipelines group duplicate reports and downrank clickbait headlines to present a balanced, noise-free view of national and global politics.
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
            How does WorldNewzs maintain neutrality in its political coverage?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            WorldNewzs employs a multi-faceted approach to maintain neutrality. We do not write original opinion columns or endorse political candidates. Our automated curation system aggregates news from a balanced list of whitelisted sources across the political spectrum. We group similar stories together, allowing readers to view how different reputable outlets cover the same event, thus reducing single-source bias.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            What sources are whitelisted for the politics category?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our whitelisted sources include established international wire agencies (such as Associated Press, Reuters, and AFP), national public broadcasters (like BBC, DW, and NHK), and prominent daily newspapers with transparent editorial structures. We exclude blogs, opinion-only sites, and outlets with a documented history of spreading unverified or sensationalized claims.
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            How often is the political news feed updated?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Our news ingestion system operates continuously, fetching updates every 15 minutes. During major events, such as national elections or international summits, our pipelines prioritize real-time updates and trigger automated deduplication to ensure the homepage shows fresh, distinct perspectives.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
