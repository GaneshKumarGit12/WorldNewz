using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace WorldNewzWebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatbotController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public ChatbotController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskChatbot([FromBody] ChatbotRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest(new { error = "Message query is required." });
            }

            var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return StatusCode(500, new { error = "Gemini API key is not configured on the server." });
            }

            // Create contents list from history + new query
            var contents = new List<object>();

            if (request.History != null)
            {
                foreach (var msg in request.History)
                {
                    contents.Add(new
                    {
                        role = msg.Sender.Equals("user", StringComparison.OrdinalIgnoreCase) ? "user" : "model",
                        parts = new[]
                        {
                            new { text = msg.Text }
                        }
                    });
                }
            }

            // Append the new message
            contents.Add(new
            {
                role = "user",
                parts = new[]
                {
                    new { text = request.Query }
                }
            });

            // Construct the system instruction
            var systemInstructionText = 
                "You are NewsBot, the friendly, helpful AI assistant of WorldNewzs (worldnewzs.in). " +
                "WorldNewzs is a premium news platform covering technology, politics, business, science-health, sports, money, weather, jobs, and entertainment.\n\n" +
                "Guidelines:\n" +
                "1. Provide engaging, friendly, and accurate answers. Keep responses concise and use Markdown headers, bullets, or code snippets for readability.\n" +
                "2. When users ask about categories, direct them using these links:\n" +
                "   - Technology: https://worldnewzs.in/technology\n" +
                "   - Business: https://worldnewzs.in/business\n" +
                "   - Sports: https://worldnewzs.in/sports\n" +
                "   - GK Quiz: https://worldnewzs.in/badge-quiz\n" +
                "   - Job Board: https://worldnewzs.in/jobs\n" +
                "3. Google AdSense: Never promote illegal content, hate speech, malware, or low-quality clickbait. Keep output family-friendly.\n" +
                "4. Image requests: If the user asks you to generate, draw, create, or show an image/photo/illustration of something, " +
                "always write a friendly text response describing what you are illustrating and append the EXACT token tag: [VisualMock: {Descriptive Prompt}] at the end of your response. " +
                "Example: If they ask for 'a futuristic city', respond with 'Here is an illustration of a futuristic city filled with neon lights...' and end with [VisualMock: futuristic neon city].";

            var requestBody = new
            {
                contents = contents,
                systemInstruction = new
                {
                    parts = new[]
                    {
                        new { text = systemInstructionText }
                    }
                }
            };

            try
            {
                var client = _httpClientFactory.CreateClient();
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";
                
                var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                var response = await client.PostAsync(url, jsonContent);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    // Fallback to gemini-pro if flash fails
                    Console.WriteLine($"⚠️ gemini-1.5-flash failed with {response.StatusCode}. Retrying with gemini-pro...");
                    url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={apiKey}";
                    response = await client.PostAsync(url, jsonContent);
                    responseBody = await response.Content.ReadAsStringAsync();
                }

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new { error = "Gemini API returned an error", details = responseBody });
                }

                using var doc = JsonDocument.Parse(responseBody);
                var root = doc.RootElement;
                
                if (root.TryGetProperty("candidates", out var candidates) && 
                    candidates.ValueKind == JsonValueKind.Array && 
                    candidates.GetArrayLength() > 0)
                {
                    var candidate = candidates[0];
                    if (candidate.TryGetProperty("content", out var content) &&
                        content.TryGetProperty("parts", out var parts) &&
                        parts.ValueKind == JsonValueKind.Array &&
                        parts.GetArrayLength() > 0)
                    {
                        var text = parts[0].GetProperty("text").GetString() ?? "";

                        // Parse out VisualMock tag if present
                        string? visualMockPrompt = null;
                        var match = Regex.Match(text, @"\[VisualMock:\s*(.*?)\]");
                        if (match.Success)
                        {
                            visualMockPrompt = match.Groups[1].Value.Trim();
                            // Clean the tag out of the text response to keep it clean
                            text = Regex.Replace(text, @"\[VisualMock:\s*.*?\]", "").Trim();
                        }

                        return Ok(new
                        {
                            reply = text,
                            visualMockPrompt = visualMockPrompt
                        });
                    }
                }

                return BadRequest(new { error = "No response content generated by Gemini." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Exception during Chatbot API invocation", details = ex.Message });
            }
        }
    }

    public class ChatMessageDto
    {
        public string Sender { get; set; } = string.Empty; // "user" or "bot"
        public string Text { get; set; } = string.Empty;
    }

    public class ChatbotRequest
    {
        public string Query { get; set; } = string.Empty;
        public List<ChatMessageDto>? History { get; set; }
    }
}
