<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/df16a4c3-39f8-4f4c-823a-cad5b857b034

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set in [.env.local](.env.local):
   - `GEMINI_API_KEY` — your Gemini API key (for AI features)
   - `FMP_API_KEY` — (optional) for **accurate economic calendar**; get a free key at [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs). Without it, the calendar uses a fallback source that may have incorrect dates.
3. Run the app:
   `npm run dev`
