using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using WorldNewzWebAPI.Data;
using WorldNewzWebAPI.Models;
using Microsoft.Extensions.Configuration;

namespace WorldNewzWebAPI.Services
{
    public interface ITextRefinementService
    {
        Task<EnrichedArticle> RefineAndEnrichNewsAsync(string title, string? description, string? category, string url);
        Task<List<string>?> GenerateArticleWithGeminiAsync(string title, string? description, string? category, List<string> scrapedParagraphs);
    }

    public class TextRefinementService : ITextRefinementService
    {
        private readonly HttpClient _httpClient;
        private readonly string? _geminiApiKey;

        public TextRefinementService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _geminiApiKey = config["GEMINI_API_KEY"] ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");
        }

        public async Task<EnrichedArticle> RefineAndEnrichNewsAsync(string title, string? description, string? category, string url)
        {
            // 1. Scrape paragraphs
            var scrapedParagraphs = await ScrapeParagraphsAsync(url);

            // 2. Generate detailed opinion piece content
            var generatedParagraphs = await GenerateArticleWithGeminiAsync(title, description, category, scrapedParagraphs);
            var fullContent = generatedParagraphs != null && generatedParagraphs.Count > 0 
                ? string.Join("\n\n", generatedParagraphs)
                : string.Empty;

            // 3. Generate metadata
            var enrichment = await GenerateMetadataAsync(title, description, category);

            return new EnrichedArticle
            {
                Url = url,
                Headline = enrichment.Headline ?? title,
                Summary = enrichment.Summary ?? description ?? string.Empty,
                Context = enrichment.Context ?? string.Empty,
                SocialMediaHook = enrichment.SocialMediaHook ?? string.Empty,
                Verified = true,
                EnrichedAt = DateTime.UtcNow,
                FullContent = fullContent
            };
        }

        private async Task<EnrichmentResult> GenerateMetadataAsync(string title, string? description, string? category)
        {
            if (!string.IsNullOrWhiteSpace(_geminiApiKey))
            {
                try
                {
                    var enrichmentTask = CallGeminiApiAsync(title, description, category);
                    if (await Task.WhenAny(enrichmentTask, Task.Delay(2500)) == enrichmentTask)
                    {
                        var result = await enrichmentTask;
                        if (result != null) return result;
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[TextRefinement] Gemini API metadata call failed: {ex.Message}. Falling back to heuristics.");
                }
            }

            return GenerateLocalHeuristics(title, description, category);
        }

        private async Task<EnrichmentResult?> CallGeminiApiAsync(string title, string? description, string? category)
        {
            string endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_geminiApiKey}";

            var prompt = $@"
You are an expert editorial editor and columnist. Analyze this news article:
Title: {title}
Description: {description ?? ""}
Category: {category ?? "General"}

Return a JSON object with the following schema (DO NOT include any markdown block ticks, just raw JSON text):
{{
  ""headline"": ""A punchy, analytical headline suitable for an opinion piece"",
  ""summary"": ""A high-quality 2-3 sentence summary providing an editorial/analytical perspective on the core issues."",
  ""context"": ""A short 'Why it matters' note (1-2 sentences) explaining the deeper social, market, or political implications of this event."",
  ""socialMediaHook"": ""A social media shareable hook with 2-3 relevant hashtags""
}}
";

            var payload = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(endpoint, requestContent);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            if (root.TryGetProperty("candidates", out var candidates) && 
                candidates.ValueKind == JsonValueKind.Array && 
                candidates.GetArrayLength() > 0)
            {
                var content = candidates[0].GetProperty("content");
                var parts = content.GetProperty("parts");
                if (parts.ValueKind == JsonValueKind.Array && parts.GetArrayLength() > 0)
                {
                    var textStr = parts[0].GetProperty("text").GetString();
                    if (!string.IsNullOrWhiteSpace(textStr))
                    {
                        var enrichmentNode = JsonSerializer.Deserialize<EnrichmentResult>(textStr, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });
                        return enrichmentNode;
                    }
                }
            }

            return null;
        }

        private EnrichmentResult GenerateLocalHeuristics(string title, string? description, string? category)
        {
            string cleanCategory = (category ?? "news").ToLowerInvariant();
            
            string headline = title;
            int separatorIndex = title.LastIndexOfAny(new[] { '-', '|' });
            if (separatorIndex > 10)
            {
                headline = title.Substring(0, separatorIndex).Trim();
            }

            string summary;
            string cleanDesc = (description ?? string.Empty).Trim();

            if (!string.IsNullOrEmpty(cleanDesc) && cleanDesc.Length > 40)
            {
                var sentences = Regex.Split(cleanDesc, @"(?<=[.!?])\s+");
                if (sentences.Length >= 2)
                {
                    summary = string.Join(" ", sentences.Take(3));
                }
                else
                {
                    summary = cleanDesc + " Key developments are expected to follow as officials monitor the situation.";
                }
            }
            else
            {
                summary = $"This report highlights crucial updates regarding \"{headline}\". " +
                          "Analysts and industry observers are closely following the unfolding details surrounding these events.";
            }

            string context = cleanCategory switch
            {
                "science" => "This breakthrough could open new pathways in research and drive future technological or biological developments.",
                "technology" or "tech" => "This development represents a key step in digital infrastructure, potentially reshaping industry standards.",
                "business" or "money" => "This shift highlights dynamics in global markets and could influence consumer behavior and investment trends.",
                "sports" => "This event marks an important achievement in the sports calendar, highlighting competitive performance.",
                "entertainment" => "This announcement shapes current pop culture trends and reflects ongoing shifts in media distribution.",
                "food" => "This trend highlights changing consumer culinary preferences and has direct impacts on the food and hospitality industry.",
                "travel" => "This update details changing patterns in tourism and global mobility, introducing new dynamics for travelers.",
                "shopping" => "This retail development highlights shifts in consumer purchasing habits and digital retail expansion.",
                _ => "This news details a significant development in global affairs, carrying important implications for public awareness."
            };

            string hashCategory = cleanCategory switch
            {
                "science" => "Science",
                "technology" or "tech" => "Tech",
                "business" or "money" => "Business",
                "sports" => "Sports",
                "entertainment" => "Entertainment",
                "food" => "Food",
                "travel" => "Travel",
                "shopping" => "Retail",
                _ => "BreakingNews"
            };

            string socialMediaHook = $"Check out the latest update on \"{headline}\". #{hashCategory} #WorldNewz";

            return new EnrichmentResult
            {
                Headline = headline,
                Summary = summary,
                Context = context,
                SocialMediaHook = socialMediaHook
            };
        }

        public async Task<List<string>?> GenerateArticleWithGeminiAsync(
            string title, 
            string? description, 
            string? category, 
            List<string> scrapedParagraphs)
        {
            if (string.IsNullOrWhiteSpace(_geminiApiKey))
            {
                return BuildFallbackArticle(title, description, category, scrapedParagraphs);
            }

            try
            {
                string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_geminiApiKey}";

                var scrapedText = scrapedParagraphs != null && scrapedParagraphs.Count > 0
                    ? string.Join(" ", scrapedParagraphs.Take(8))
                    : "";

                bool isPillar = string.Equals(category, "technology", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "tech", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "business", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "politics", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "science-health", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "science & health", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "science", StringComparison.OrdinalIgnoreCase) ||
                                string.Equals(category, "health", StringComparison.OrdinalIgnoreCase);

                int targetMinWords = isPillar ? 1500 : 600;
                int targetMaxWords = isPillar ? 2000 : 1000;

                var prompt = $@"
You are a senior editorial columnist and political/industry analyst writing for WorldNewzs (https://worldnewzs.in). 
Analyze this news and write a detailed, comprehensive, high-quality, and completely unique opinion piece / editorial analysis based on the following information:

Title: {title}
Summary/Key point: {description ?? "News update details"}
Category: {category ?? "General"}
Contextual Snippet (from wire service): {scrapedText}

Requirements:
- The article MUST be {targetMinWords} to {targetMaxWords} words long.
- Write in an analytical, engaging, and authoritative editorial tone (opinion/column style) that analyzes the news and presents a clear perspective.
- Organize the opinion piece logically using markdown headings. You MUST use sub-headings (e.g. ## Overview & News Analysis, ## Core Issues & Context, ## Critical Perspectives, ## Future Outlook & Implications) to divide sections.
- Structure for SEO by using short paragraphs (2-3 sentences each) for readability.
- Include 1-2 internal links to other related categories on WorldNewzs where relevant. Use EXACTLY these markdown link targets:
  * Technology: [Technology News](https://worldnewzs.in/technology)
  * Business: [Business News](https://worldnewzs.in/business)
  * Sports: [Sports News](https://worldnewzs.in/sports)
  * Politics: [Politics News](https://worldnewzs.in/politics)
  * Science/Health: [Science & Health News](https://worldnewzs.in/science-health)
  * Money/Finance: [Money & Finance](https://worldnewzs.in/money)
  * General: [WorldNewzs Curation](https://worldnewzs.in)
- Include 1-2 external links to credible, authoritative news or organization sources (e.g. [BBC News](https://www.bbc.com), [Reuters](https://www.reuters.com), [Associated Press](https://apnews.com), [WHO](https://www.who.int)) formatted in markdown.
- At the end of the article, add a '## Frequently Asked Questions (FAQs)' section containing at least 3 relevant questions and answers about the topic to boost word count naturally and aid search intent.
- Output the article as plain text paragraphs separated by double newlines.
";

                var payload = new
                {
                    contents = new[]
                    {
                        new { parts = new[] { new { text = prompt } } }
                    }
                };

                var requestContent = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(20));
                var response = await _httpClient.PostAsync(url, requestContent, cts.Token);

                if (!response.IsSuccessStatusCode)
                {
                    return BuildFallbackArticle(title, description, category, scrapedParagraphs);
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;

                if (root.TryGetProperty("candidates", out var candidates) &&
                    candidates.ValueKind == JsonValueKind.Array &&
                    candidates.GetArrayLength() > 0)
                {
                    var content = candidates[0].GetProperty("content");
                    var parts = content.GetProperty("parts");
                    if (parts.ValueKind == JsonValueKind.Array && parts.GetArrayLength() > 0)
                    {
                        var textStr = parts[0].GetProperty("text").GetString();
                        if (!string.IsNullOrWhiteSpace(textStr))
                        {
                            var paragraphs = SplitAndNormalizeParagraphs(textStr);
                            if (paragraphs.Count >= 3)
                            {
                                return paragraphs;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[TextRefinement] Exception during Gemini article generation: {ex.Message}");
            }

            return BuildFallbackArticle(title, description, category, scrapedParagraphs);
        }

        private List<string> BuildFallbackArticle(string title, string? description, string? category, List<string>? scrapedParagraphs)
        {
            var fallbackParagraphs = new List<string>();
            var cleanTitle = Regex.Replace(title, @"[|:-].*$", "").Trim();
            var cat = string.IsNullOrWhiteSpace(category) ? "General" : category.Trim();

            fallbackParagraphs.Add($"## Overview & Analysis");
            fallbackParagraphs.Add($"The latest developments surrounding \"{cleanTitle}\" point to an important shift in the {cat} landscape. WorldNewzs presents this update with editorial context so readers can understand not just what happened, but why it matters now.");
            fallbackParagraphs.Add($"The story is especially relevant because it intersects public interest, market behavior, policy decisions, and broader audience expectations. By placing the update in context, our coverage helps readers evaluate the issue with greater clarity.");

            if (scrapedParagraphs != null && scrapedParagraphs.Count > 0)
            {
                var cleaned = scrapedParagraphs
                    .Select(CleanParagraph)
                    .Where(p => !string.IsNullOrWhiteSpace(p) && p.Length > 80)
                    .Take(3)
                    .ToList();

                if (cleaned.Count > 0)
                {
                    fallbackParagraphs.Add("## Key Context");
                    fallbackParagraphs.AddRange(cleaned);
                }
            }

            fallbackParagraphs.Add("## Why It Matters");
            fallbackParagraphs.Add($"For readers following the {cat} space, this update is a strong signal of broader change. The best way to stay informed is to follow reliable reporting, compare sources, and monitor how the story evolves over time.");
            fallbackParagraphs.Add("## Frequently Asked Questions (FAQs)");
            fallbackParagraphs.Add($"**Q1: Why is \"{cleanTitle}\" important?**\n\n**A1:** It reflects a meaningful shift in the {cat} environment and is likely to influence how stakeholders respond next.");
            fallbackParagraphs.Add($"**Q2: Where can I follow more updates?**\n\n**A2:** You can track the latest reporting and related context directly on [WorldNewzs](https://worldnewzs.in).");
            return fallbackParagraphs;
        }

        private string CleanParagraph(string? paragraph)
        {
            if (string.IsNullOrWhiteSpace(paragraph)) return string.Empty;
            var cleaned = Regex.Replace(paragraph, @"<[^>]+>", " ");
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
            return cleaned;
        }

        private List<string> SplitAndNormalizeParagraphs(string text)
        {
            return text
                .Split(new[] { "\n\n", "\r\n\r\n" }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => p.Length > 20)
                .Select(p => Regex.Replace(p, @"\s+", " "))
                .ToList();
        }

        private List<string> GenerateLocalArticleHeuristics(string title, string? description, string? category)
        {
            var paragraphs = new List<string>();
            string cleanTitle = Regex.Replace(title, @"[|:-].*$", "").Trim();
            string cat = (category ?? "General").Trim();

            bool isKeyCategory = string.Equals(cat, "technology", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "tech", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "business", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "politics", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "science-health", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "science", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "money", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(cat, "finance", StringComparison.OrdinalIgnoreCase);

            Func<string, string, string> expand = (para, extra) => isKeyCategory ? para + " " + extra : para;

            // 1. Introduction / Executive Summary
            paragraphs.Add(expand(
                $"The recent announcement concerning **\"{cleanTitle}\"** serves as a focal point for deeper critical analysis of the **{cat}** sector. Industry observers and columnists suggest that these unfolding events carry broader structural implications than standard press releases suggest. In our view, this latest step could define the long-term strategic directions of primary organizations and significantly alter consumer dynamics across global jurisdictions.",
                "This transition is expected to trigger a cascade of structural adjustments, challenging legacy frameworks and forcing competitors to re-evaluate their mid-term capital allocations. We argue that the initial market shock will settle into a highly consolidated race for industry dominance."
            ));
            paragraphs.Add(expand(
                $"As debate over **\"{cleanTitle}\"** intensifies, the true significance lies in its timing and structural alignment. We analyze this trend as reflecting a deeper convergence of technological capacity, economic incentives, and institutional policy. Rather than a routine update, this development represents a cornerstone shift in how **{cat}** issues are resolved.",
                "Moreover, this transition highlights a growing consensus among analytical networks who view the event as a watershed moment. Strategic alliances now forming will likely redefine the parameters of future competitiveness."
            ));

            // 2. Historical Background & Foundation
            paragraphs.Add("## Historical Context & Background");
            paragraphs.Add(expand(
                $"Historically, developments like **\"{cleanTitle}\"** have been shaped by regulatory shifts and technological advancements over the past decade. Previously, organizations faced significant hurdles in infrastructure development, data integration, and compliance, which slowed down the pace of adoption. These persistent challenges meant that early pioneers had to commit significant upfront capital with high operational risks.",
                "In the early phases, a lack of unified APIs and standard operating protocols created fragmented ecosystems, leaving many enterprises locked into incompatible proprietary vendor cycles. This historical fragmentation highlights why the current convergence is so historically significant."
            ));
            
            paragraphs.Add("### Key Historical Hurdles:");
            paragraphs.Add("- **High Infrastructure Cost**: Early organizations faced massive barriers to entry due to high capital requirements.");
            paragraphs.Add("- **Compliance Overhead**: Managing regulatory differences across regions slowed adoption rates.");
            paragraphs.Add("- **Vendor Lock-in**: Proprietary closed loops limited cross-departmental coordination and updates.");

            paragraphs.Add(expand(
                $"By analyzing previous benchmarks, we see a pattern of incremental progress leading to this moment. Industry analysts point out that while early iterations faced skepticism, the underlying framework has proved resilient, paving the way for current breakthroughs. Over time, collaborative ecosystems and standardized practices emerged, reducing entry barriers and allowing smaller players to participate in the value chain.",
                "These cumulative historical lessons have taught modern planners to prioritize modular architecture and open standards. As a result, today's implementation is built on a foundation of interoperability that was entirely absent in previous cycles."
            ));

            // 3. Core Announcement & Immediate Impacts
            paragraphs.Add("## Core Announcement & Immediate Impacts");
            paragraphs.Add(expand(
                $"At present, the situation surrounding **\"{cleanTitle}\"** is characterized by intense collaboration and strategic updates. Major organizations are adjusting their plans to align with these new findings, focusing on efficiency, customer satisfaction, and long-term sustainability. Initial field reports indicate that these measures are already yielding positive outcomes in productivity and resource allocation.",
                "Operational directors report that the integration of these protocols has facilitated real-time telemetry sharing and cross-departmental coordination. This level of transparency is proving instrumental in optimizing legacy resource pipelines."
            ));

            paragraphs.Add("### Primary Impacts Identified:");
            paragraphs.Add("- **Improved Resource Allocation**: Optimized telemetry sharing yields up to a 40% reduction in downtime.");
            paragraphs.Add("- **Enhanced Transparency**: Real-time cross-departmental data flows help streamline scheduling.");
            paragraphs.Add("- **Collaborative Synergies**: Standardized platforms allow partnerships across local and international divisions.");

            paragraphs.Add(expand(
                $"Furthermore, recent data indicates a growing adoption rate of these standards across multiple regions. This trend is accompanied by increased funding, strategic mergers, and public interest, making it one of the most talked-about subjects this quarter. As deployment speeds up, organizations that fail to integrate these models risk falling behind their peers in operational efficiency.",
                "In addition, regulatory committees are fast-tracking approvals to support national competitiveness in these emerging digital domains. This regulatory tailwind is creating a highly favorable environment for early-stage commercial proof-of-concepts."
            ));

            // 4. Regional and Global Reach
            paragraphs.Add("## Regional & Global Reach");
            paragraphs.Add(expand(
                $"The global implications of **\"{cleanTitle}\"** extend far beyond localized markets, affecting supply chains and consumer behaviors in North America, Europe, and Asia-Pacific. Regional regulators are responding with updated compliance frameworks to ensure safety and standardization across borders. This international coordination is crucial to avoiding fragmentation and promoting seamless integrations.",
                "Trade representatives are calling for bilateral agreements that standardize data privacy and cloud sovereignty laws across borders. Without such frameworks, international trade could face compliance bottlenecks that hinder global distribution networks."
            ));
            paragraphs.Add(expand(
                $"In developing economies, this development offers a leapfrog opportunity, enabling organizations to bypass legacy systems in favor of modern, efficient architectures. Financial institutions and local governments are forming public-private partnerships to build the necessary infrastructure, thereby driving inclusive growth and job creation in these emerging sectors.",
                "These local efforts are being supported by multilateral development banks offering low-interest green bonds specifically structured for digital modernization projects. This financial backing accelerates the displacement of carbon-intensive legacy frameworks."
            ));

            // 5. Technological / Operational Advancements
            paragraphs.Add("## Technological & Operational Advancements");
            paragraphs.Add(expand(
                $"From a technological perspective, **\"{cleanTitle}\"** leverages modern capabilities in cloud computing, data analytics, and decentralized systems. Engineers point out that the integration of automated workflows and real-time monitoring tools has minimized human error and increased reliability. These software innovations enable teams to respond to dynamic conditions with unprecedented agility.",
                "Specifically, modern machine learning models are being deployed at the edge to predict hardware failures before they occur, reducing unplanned downtime by up to forty percent. This predictive capability marks a massive leap forward in operational resilience."
            ));
            paragraphs.Add(expand(
                $"Moreover, the hardware requirements have become more accessible, allowing standard facilities to implement these systems without costly retrofits. This democratization of technology ensures that both large enterprises and mid-market firms can optimize their core processes, leading to industry-wide efficiency gains and reduced carbon footprints.",
                "This hardware-software convergence reduces overall power consumption, aligning corporate operations with carbon neutrality goals. Consequently, sustainability officers are becoming major advocates for the adoption of these platforms."
            ));

            // 6. Key Challenges, Risks & Mitigation Strategies
            paragraphs.Add("## Key Challenges & Risk Mitigation");
            paragraphs.Add(expand(
                $"Despite the optimistic outlook, the implementation of **\"{cleanTitle}\"** is not without significant hurdles and operational risks. Cybersecurity remains a top concern, as decentralized nodes and increased data exchange create new vectors for malicious attacks. Stakeholders must invest heavily in end-to-end encryption, multi-factor authentication, and regular security audits to protect sensitive information.",
                "Furthermore, supply chain vulnerabilities for critical hardware components pose a risk to rollout schedules, with lead times for advanced processors remaining high. Organizations must cultivate diversified sourcing networks to mitigate these delays."
            ));
            
            paragraphs.Add("### Critical Mitigation Areas:");
            paragraphs.Add("1. **Data Security**: Implement zero-trust network access and robust end-to-end data encryption.");
            paragraphs.Add("2. **Workforce Training**: Run up-skilling bootcamps to bridge the digital skills gap for operational staff.");
            paragraphs.Add("3. **Supply Diversification**: Partner with multiple components suppliers to avoid critical processor delays.");

            paragraphs.Add(expand(
                $"Additionally, talent shortages and resistance to change within traditional organizations present cultural barriers to deployment. To mitigate these risks, industry leaders are establishing comprehensive training programs and change management initiatives. Up-skilling the workforce ensures a simpler transition and fosters a culture of continuous innovation and adaptability.",
                "To bridge the skills gap, academic institutions are collaborating with industry consortia to launch specialized certifications and hands-on bootcamps. This educational alignment is expected to supply a steady pipeline of qualified professionals over the coming years."
            ));

            // 7. Expert Insights & Industry Commentaries
            paragraphs.Add("## Expert Insights & Industry Commentaries");
            paragraphs.Add(expand(
                $"According to **Dr. Aris Thorne**, a senior research fellow in global trends: \"The announcement of {cleanTitle} is not just an isolated event; it represents a fundamental shift in how we approach {cat} challenges today.\" This sentiment is echoed by corporate leaders who emphasize the competitive advantages of early adoption.",
                "He also points out that the long-term winners will be those who view this as a holistic business transformation rather than a simple IT upgrade. This systemic view requires breaking down traditional functional silos."
            ));
            paragraphs.Add(expand(
                $"Sarah Jenkins, a leading policy consultant, remarks: \"Regulators must act swiftly to establish clear guidelines, or they risk stifling the potential of these innovations.\" Balancing consumer protection with industry growth remains a delicate but necessary task for modern policymakers.",
                "She emphasizes that proactive engagement with regulators can help define rules that protect consumer privacy while allowing enough flexibility for product iteration. This collaborative approach benefits the entire ecosystem."
            ));

            if (isKeyCategory)
            {
                // 8. Market Reaction & Financial Forecasts
                paragraphs.Add("## Market Reaction & Financial Forecasts");
                paragraphs.Add(expand(
                    $"Following the news of **\"{cleanTitle}\"**, financial markets experienced immediate activity, with shares of leading companies in the **{cat}** sector showing steady upward movement. Investment banks are revising their growth forecasts, predicting a significant influx of venture capital and institutional funding over the next fiscal year. This financial backing is expected to accelerate research and development.",
                    "Leading brokerage firms are advising clients to focus on companies with robust balance sheets and clear IP portfolios, as they are best positioned to capture market share. This selective investing approach will likely characterize the coming quarters."
                ));
                paragraphs.Add(expand(
                    $"Analysts also highlight that long-term returns will be driven by cost efficiencies and new revenue streams created by this transformation. However, investors are advised to exercise caution and diversify their portfolios to guard against early-stage volatility.",
                    "Furthermore, transaction volume on major derivative exchanges indicates that traders are pricing in sustained upside volatility for structural infrastructure providers."
                ));

                // 9. Environmental and Social Governance (ESG)
                paragraphs.Add("## Environmental & Social Governance (ESG)");
                paragraphs.Add(expand(
                    $"An overlooked dimension of **\"{cleanTitle}\"** is its alignment with environmental and governance benchmarks. By replacing carbon-heavy processes with optimized digital workflows, the framework supports ongoing corporate decarbonization targets. This shift is crucial as regulatory pressure on environmental transparency intensifies globally.",
                    "In addition, standardizing fair-wage policies for remote tech workers sets a new social governance benchmark, ensuring that digital growth does not exploit developing markets."
                ));
            }

            // 10. Summary & Outlook
            paragraphs.Add("## Conclusion & Strategic Outlook");
            paragraphs.Add(expand(
                $"In conclusion, **\"{cleanTitle}\"** marks a pivotal milestone for the **{cat}** sector, setting a new benchmark for operational excellence. While challenges in security and workforce training persist, the potential benefits far outweigh these transitional hurdles. Organizations that proactively adopt these models will likely lead their respective fields in the coming decade.",
                "As the ecosystem matures, we expect a second wave of micro-innovations that will further refine these workflows. The strategic window for early adoption is closing, and the time for implementation is now."
            ));

            // 11. FAQs
            paragraphs.Add("## Frequently Asked Questions (FAQs)");
            paragraphs.Add($"**Q1: What is the main significance of \"{cleanTitle}\"?**\n\n**A1:** It introduces key updates to the {cat} landscape, addressing previous challenges and opening new pathways for collaboration, growth, and efficiency.");
            paragraphs.Add($"**Q2: Who is most affected by this development?**\n\n**A2:** Industry professionals, corporate decision-makers, and active consumers in the {cat} sector will need to adapt their strategies to these new standards.");
            paragraphs.Add($"**Q3: Where can I track subsequent updates on this story?**\n\n**A3:** You can follow real-time coverage and expert analyses on [WorldNewzs](https://worldnewzs.in) and other credible international wire services.");
            paragraphs.Add($"**Q4: What are the primary risks associated with this announcement?**\n\n**A4:** The main risks include cybersecurity vulnerabilities, initial compliance costs, and the operational hurdles of upgrading legacy systems to modern standards.");

            return paragraphs;
        }

        private async Task<List<string>> ScrapeParagraphsAsync(string? url)
        {
            var paragraphs = new List<string>();
            if (string.IsNullOrWhiteSpace(url)) return paragraphs;

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                
                using var cts = new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(4));
                var response = await _httpClient.SendAsync(request, cts.Token);
                if (response.IsSuccessStatusCode)
                {
                    string html = await response.Content.ReadAsStringAsync();
                    
                    html = Regex.Replace(html, @"<!--.*?-->", "", RegexOptions.Singleline);
                    html = Regex.Replace(html, @"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    html = Regex.Replace(html, @"<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    html = Regex.Replace(html, @"<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    html = Regex.Replace(html, @"<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    html = Regex.Replace(html, @"<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);

                    var matches = Regex.Matches(html, @"<p\b[^>]*>(.*?)</p>", RegexOptions.IgnoreCase | RegexOptions.Singleline);
                    foreach (Match match in matches)
                    {
                        var pText = match.Groups[1].Value;
                        pText = Regex.Replace(pText, @"<[^>]*>", "").Trim();
                        pText = System.Web.HttpUtility.HtmlDecode(pText);

                        if (pText.Length > 50 && 
                            !pText.Contains("javascript:", StringComparison.OrdinalIgnoreCase) && 
                            !pText.Contains("cookies", StringComparison.OrdinalIgnoreCase) &&
                            !pText.Contains("terms of use", StringComparison.OrdinalIgnoreCase) &&
                            !pText.Contains("privacy policy", StringComparison.OrdinalIgnoreCase) &&
                            !pText.Contains("subscribe", StringComparison.OrdinalIgnoreCase) &&
                            !pText.Contains("advertisement", StringComparison.OrdinalIgnoreCase))
                        {
                            paragraphs.Add(pText);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ScrapeParagraphs] Scraping failed for {url}: {ex.Message}");
            }

            return paragraphs;
        }

        private class EnrichmentResult
        {
            public string? Headline { get; set; }
            public string? Summary { get; set; }
            public string? Context { get; set; }
            public string? SocialMediaHook { get; set; }
        }
    }
}
