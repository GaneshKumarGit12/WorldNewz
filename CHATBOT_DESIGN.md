# WorldNewz AI NewsBot Design Specification

This document details the system design, conversation flow, and prompt patterns for the **AI NewsBot (Chatbot)** page in WorldNewz.

---

## 1. System Overview

The AI NewsBot is a conversational interface integrated into WorldNewz. It helps users discover news briefings, search specific topics, understand local/global trends, and answer questions. The chatbot leverages the Google Gemini API (`gemini-1.5-flash` with a fallback to `gemini-pro`) using the server-side API key.

```
[Chatbot UI Page] <=== JSON Request/Response ===> [ChatbotController]
                                                          │
                                                    (API Request)
                                                          ▼
                                                   [Gemini API]
```

---

## 2. Conversation Flow & State Management

- **Client Session**: The frontend maintains an active chat history state array:
  ```typescript
  interface ChatMessage {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp: Date;
    visualMock?: string; // Optional indicator to render visual mock panel
  }
  ```
- **Context Injection**: Each query sent to `/api/chatbot/ask` carries the conversation history as context. The server prefixes the call with a system prompt setting the bot's persona.
- **Safety & Editorial Controls**: Responses must satisfy Google AdSense and WorldNewz policies:
  - No hate speech, adult content, or dangerous topics.
  - Neutral and informative journalistic tone.
  - Active redirection to WorldNewz categories (e.g. Technology, Sports, Travel) with markdown links.

---

## 3. System Prompt Engineering

To enforce the friendly persona, the controller binds a system prompt to the generative request:

```text
You are NewsBot, the friendly, helpful AI assistant of WorldNewzs (worldnewzs.in). 
WorldNewzs is a premier news site covering technology, politics, business, science-health, sports, money, weather, and free games.
Your guidelines:
1. Provide accurate, helpful, and neutral journalistic answers.
2. Format your text nicely using Markdown (bullet points, bold headers, code snippets).
3. Recommend relevant WorldNewzs categories using links:
   - Technology: https://worldnewzs.in/technology
   - Business: https://worldnewzs.in/business
   - Sports: https://worldnewzs.in/sports
   - Polls: https://worldnewzs.in/polls
   - Jobs: https://worldnewzs.in/jobs
4. AdSense: Never output inappropriate content, pornography, hate speech, or low-quality clickbait.
5. If the user asks you to generate or draw an image, reply with a description of the image they requested and end your text message exactly with the tag: [VisualMock: {Descriptive Prompt}]. 
   Example: If they ask for "a red electric sports car", write "Here is a visualization of the red electric sports car..." and append [VisualMock: red electric sports car].
```

---

## 4. Visual Mock Presentation

Per current requirements, live dynamic AI image generation is set aside. Instead:
1. When the user requests an image, the backend Gemini API is trained to output the special tag `[VisualMock: {Prompt}]`.
2. The server response payload highlights if a visual mock was requested:
   ```json
   {
     "reply": "Here is the layout visualization...",
     "visualMockPrompt": "red electric sports car"
   }
   ```
3. The React UI parses this response. If `visualMockPrompt` is present, it renders a visual placeholder card in the chat log:
   - Contains a dark, high-tech card with a camera/photo icon.
   - Shows the prompt text: *"Visualization requested for: 'red electric sports car'"*.
   - Informs the user: *"Custom image generation service integration pending configuration."*
   - Renders a clean structural wireframe placeholder to demonstrate how the final image layout will appear.
