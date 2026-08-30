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

        private async Task<string?> GenerateImageWithCloudflareAsync(string prompt)
        {
            var accountId = Environment.GetEnvironmentVariable("CLOUDFLARE_ACCOUNT_ID")
                            ?? Environment.GetEnvironmentVariable("ImageGenerator_Account_ID");
            var apiKey = Environment.GetEnvironmentVariable("CLOUDFLARE_API_KEY")
                         ?? Environment.GetEnvironmentVariable("key")
                         ?? Environment.GetEnvironmentVariable("CLOUDFLARE_API_TOKEN");

            if (string.IsNullOrWhiteSpace(accountId) || string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("⚠️ Cloudflare account credentials not found in env vars. Skipping image generation.");
                return null;
            }

            try
            {
                var client = _httpClientFactory.CreateClient();
                var url = $"https://api.cloudflare.com/client/v4/accounts/{accountId}/ai/run/@cf/bytedance/stable-diffusion-xl-lightning";

                var requestBody = new { prompt = prompt };
                var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

                var requestMsg = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = jsonContent
                };
                requestMsg.Headers.Add("Authorization", $"Bearer {apiKey}");

                var response = await client.SendAsync(requestMsg);
                if (response.IsSuccessStatusCode)
                {
                    var imageBytes = await response.Content.ReadAsByteArrayAsync();
                    var base64String = Convert.ToBase64String(imageBytes);
                    return $"data:image/png;base64,{base64String}";
                }
                else
                {
                    var errorDetails = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"❌ Cloudflare Image generation failed with status {response.StatusCode}. Details: {errorDetails}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Exception during Cloudflare Image generation: {ex.Message}");
            }

            return null;
        }

        [HttpGet("models")]
        public IActionResult GetAvailableModels()
        {
            var models = new[]
            {
                new 
                { 
                    id = "auto", 
                    name = "Auto (Smart Free Fallback)", 
                    provider = "Multi-Model", 
                    description = "Automatically routes across top free models with instant fallback", 
                    badge = "Recommended",
                    isFree = true, 
                    isDefault = true 
                },
                new 
                { 
                    id = "google/gemini-2.0-flash-exp:free", 
                    name = "Google Gemini 2.0 Flash", 
                    provider = "Google", 
                    description = "Ultra-fast response with high reasoning capability and latest knowledge", 
                    badge = "Fast & Smart",
                    isFree = true, 
                    isDefault = false 
                },
                new 
                { 
                    id = "meta-llama/llama-3.3-70b-instruct:free", 
                    name = "Meta Llama 3.3 70B", 
                    provider = "Meta", 
                    description = "Flagship open-weights 70B parameter model with nuanced understanding", 
                    badge = "Powerful",
                    isFree = true, 
                    isDefault = false 
                },
                new 
                { 
                    id = "deepseek/deepseek-r1:free", 
                    name = "DeepSeek R1", 
                    provider = "DeepSeek", 
                    description = "Cutting-edge deep reasoning and complex problem-solving model", 
                    badge = "Reasoning",
                    isFree = true, 
                    isDefault = false 
                },
                new 
                { 
                    id = "qwen/qwen-2.5-72b-instruct:free", 
                    name = "Qwen 2.5 72B", 
                    provider = "Alibaba", 
                    description = "High-performing model for coding, synthesis, and deep factual knowledge", 
                    badge = "Accurate",
                    isFree = true, 
                    isDefault = false 
                },
                new 
                { 
                    id = "mistralai/mistral-7b-instruct:free", 
                    name = "Mistral 7B Instruct", 
                    provider = "Mistral AI", 
                    description = "Compact, low-latency, and precise conversational responses", 
                    badge = "Lightweight",
                    isFree = true, 
                    isDefault = false 
                },
                new 
                { 
                    id = "openrouter/free", 
                    name = "OpenRouter Auto Free", 
                    provider = "OpenRouter", 
                    description = "Dynamic community-backed free routing endpoint", 
                    badge = "Fallback",
                    isFree = true, 
                    isDefault = false 
                }
            };

            return Ok(models);
        }

        [HttpPost("ask")]
        public async Task<IActionResult> AskChatbot([FromBody] ChatbotRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest(new { error = "Message query is required." });
            }

            var openRouterKey = Environment.GetEnvironmentVariable("OPENROUTER_API_KEY");

            // Construct context-aware system instruction / persona according to WorldNewz Visual Chatbot Spec
            var contextMode = (request.Context ?? "news").ToLowerInvariant();
            string toneAndFormatInstruction = contextMode switch
            {
                "shopping" => "Tone: persuasive but honest — highlight value, flag real drawbacks. Default format: short verdict + pros/bullets + rating/price tags + a clear CTA. Disclosure rule: sponsored or affiliate items must be labeled inline (e.g. [Sponsored]), never presented as neutral if they are paid placements. Link to https://worldnewzs.in/shopping or https://worldnewzs.in/amazon-products when relevant.",
                "ideas" => "Tone: creative, casual, upbeat — emoji use is appropriate. Default format: short punchy list, each item with a one-line hook. Suggest great lifestyle, food, travel, and weekend ideas. Link to https://worldnewzs.in/lifestyle, https://worldnewzs.in/travel, or https://worldnewzs.in/food.",
                "help" => "Tone: informative, concise, no persuasion. Default format: plain answers, minimal formatting. Scope: answers about site navigation, policies (Privacy Policy, Terms), or account help — not general knowledge.",
                _ => "Tone: informative, neutral, fact-forward. Default format: short bullet summary; comparison tables when article/data has quantifiable stats, timelines, or scores. Direct users to https://worldnewzs.in/technology, https://worldnewzs.in/business, https://worldnewzs.in/sports, https://worldnewzs.in/badge-quiz, or https://worldnewzs.in/jobs."
            };

            var systemInstructionText = 
                "You are WorldNewz Assistant, the intelligent, friendly AI companion of WorldNewzs (worldnewzs.in).\n" +
                $"Current Active Mode: {contextMode.ToUpperInvariant()}\n" +
                $"Specific Mode Guidelines: {toneAndFormatInstruction}\n\n" +
                "Global Rules:\n" +
                "1. Always keep every response actionable — end with a helpful next step (a CTA, relevant link, or follow-up question).\n" +
                "2. Never reproduce full copyrighted text (articles, lyrics, books). Always summarize and link to the source.\n" +
                "3. Use Markdown formatting (headings, bold text, bullet points, tables) cleanly for skimmability.\n" +
                "4. Google AdSense compliance: Ensure family-friendly, high-value output. Never produce hate speech, illegal content, or low-quality clickbait.\n" +
                "5. Image requests: If the user asks you to generate, draw, create, or show an image/photo/illustration of something, " +
                "always write a friendly text response describing what you are illustrating and append the EXACT token tag: [VisualMock: {Descriptive Prompt}] at the end of your response.";

            if (!string.IsNullOrWhiteSpace(openRouterKey))
            {
                // Create messages structure in OpenAI / OpenRouter format
                var messages = new List<object>
                {
                    new { role = "system", content = systemInstructionText }
                };

                if (request.History != null)
                {
                    foreach (var msg in request.History)
                    {
                        messages.Add(new
                        {
                            role = msg.Sender.Equals("user", StringComparison.OrdinalIgnoreCase) ? "user" : "assistant",
                            content = msg.Text
                        });
                    }
                }

                messages.Add(new
                {
                    role = "user",
                    content = request.Query
                });

                // Determine whether to pass 'models' array (for automatic fallback) or single 'model'
                object requestBody;
                if (request.Models != null && request.Models.Count > 0)
                {
                    requestBody = new
                    {
                        models = request.Models,
                        messages = messages
                    };
                }
                else if (!string.IsNullOrWhiteSpace(request.Model) && !request.Model.Equals("auto", StringComparison.OrdinalIgnoreCase))
                {
                    requestBody = new
                    {
                        model = request.Model,
                        messages = messages
                    };
                }
                else
                {
                    // Default fallback array across highest-performing free models
                    var envModels = Environment.GetEnvironmentVariable("OPENROUTER_MODELS");
                    List<string> modelsFallback;
                    if (!string.IsNullOrWhiteSpace(envModels))
                    {
                        modelsFallback = new List<string>(envModels.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
                    }
                    else
                    {
                        var singleModelEnv = Environment.GetEnvironmentVariable("OPENROUTER_MODEL");
                        if (!string.IsNullOrWhiteSpace(singleModelEnv) && singleModelEnv != "openrouter/free" && singleModelEnv != "meta-llama/llama-3-8b-instruct:free")
                        {
                            modelsFallback = new List<string> { singleModelEnv, "google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free", "deepseek/deepseek-r1:free", "openrouter/free" };
                        }
                        else
                        {
                            modelsFallback = new List<string>
                            {
                                "google/gemini-2.0-flash-exp:free",
                                "meta-llama/llama-3.3-70b-instruct:free",
                                "deepseek/deepseek-r1:free",
                                "qwen/qwen-2.5-72b-instruct:free",
                                "mistralai/mistral-7b-instruct:free",
                                "openrouter/free"
                            };
                        }
                    }

                    requestBody = new
                    {
                        models = modelsFallback,
                        messages = messages
                    };
                }

                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var requestMsg = new HttpRequestMessage(HttpMethod.Post, "https://openrouter.ai/api/v1/chat/completions")
                    {
                        Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
                    };

                    requestMsg.Headers.Add("Authorization", $"Bearer {openRouterKey}");
                    requestMsg.Headers.Add("HTTP-Referer", "https://worldnewzs.in");
                    requestMsg.Headers.Add("X-Title", "WorldNewz");

                    var response = await client.SendAsync(requestMsg);
                    var responseBody = await response.Content.ReadAsStringAsync();

                    if (!response.IsSuccessStatusCode)
                    {
                        return StatusCode((int)response.StatusCode, new { error = "OpenRouter API returned an error", details = responseBody });
                    }

                    using var doc = JsonDocument.Parse(responseBody);
                    var root = doc.RootElement;

                    string? modelUsed = null;
                    if (root.TryGetProperty("model", out var modelProp))
                    {
                        modelUsed = modelProp.GetString();
                    }

                    if (root.TryGetProperty("choices", out var choices) && 
                        choices.ValueKind == JsonValueKind.Array && 
                        choices.GetArrayLength() > 0)
                    {
                        var choice = choices[0];
                        if (choice.TryGetProperty("message", out var message) &&
                            message.TryGetProperty("content", out var content))
                        {
                            var text = content.GetString() ?? "";

                            // Parse out VisualMock tag if present
                            string? visualMockPrompt = null;
                            string? generatedImage = null;
                            var match = Regex.Match(text, @"\[VisualMock:\s*(.*?)\]");
                            if (match.Success)
                            {
                                visualMockPrompt = match.Groups[1].Value.Trim();
                                text = Regex.Replace(text, @"\[VisualMock:\s*.*?\]", "").Trim();
                                generatedImage = await GenerateImageWithCloudflareAsync(visualMockPrompt);
                            }

                            return Ok(new
                            {
                                reply = text,
                                modelUsed = modelUsed,
                                visualMockPrompt = visualMockPrompt,
                                generatedImage = generatedImage
                            });
                        }
                    }

                    return BadRequest(new { error = "No response content generated by OpenRouter." });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { error = "Exception during OpenRouter API invocation", details = ex.Message });
                }
            }
            else
            {
                // Fallback to Gemini API if OpenRouter key is not set
                var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");
                if (string.IsNullOrWhiteSpace(apiKey))
                {
                    return StatusCode(500, new { error = "AI API credentials are not configured on the server. Please set OPENROUTER_API_KEY or GEMINI_API_KEY." });
                }

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

                contents.Add(new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text = request.Query }
                    }
                });

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
                            string? generatedImage = null;
                            var match = Regex.Match(text, @"\[VisualMock:\s*(.*?)\]");
                            if (match.Success)
                            {
                                visualMockPrompt = match.Groups[1].Value.Trim();
                                text = Regex.Replace(text, @"\[VisualMock:\s*.*?\]", "").Trim();
                                generatedImage = await GenerateImageWithCloudflareAsync(visualMockPrompt);
                            }

                            return Ok(new
                            {
                                reply = text,
                                modelUsed = "Google Gemini (Direct API)",
                                visualMockPrompt = visualMockPrompt,
                                generatedImage = generatedImage
                            });
                        }
                    }

                    return BadRequest(new { error = "No response content generated by Gemini." });
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { error = "Exception during Gemini API invocation", details = ex.Message });
                }
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
        public string? Context { get; set; }
        public string? Model { get; set; }
        public List<string>? Models { get; set; }
        public List<ChatMessageDto>? History { get; set; }
    }
}
