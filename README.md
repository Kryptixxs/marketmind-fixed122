<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MarketMind Terminal

AI-powered economics calendar and financial intelligence dashboard.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set in `.env.local`:
   - `GEMINI_API_KEY` — your Gemini API key (Server-side only)
3. Run the app:
   `npm run dev`

## Security Note
This application uses server actions to interact with AI models. Never expose your `GEMINI_API_KEY` in client-side code or environment variables prefixed with `NEXT_PUBLIC_`.