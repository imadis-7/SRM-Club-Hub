# SRM Club Hub | Security & Architecture

This is a dynamic community hub built with Next.js, Firebase, and Genkit AI.

## Live Application
- **Main Hub:** [https://srm-club-hub.web.app](https://srm-club-hub.web.app)
- **Backup Domain:** [https://srm-club-hub.firebaseapp.com](https://srm-club-hub.firebaseapp.com)

## Security Model

### 1. Firebase Client Configuration
The configuration in `src/firebase/config.ts` is public. In Firebase, the `apiKey` is an identifier, not a secret. Security is enforced via **Firestore Security Rules**, which ensure:
- Only authenticated users can access the hub.
- Only the **Master Admin** can modify core organizational records.
- Users can only see messages and meetings within their assigned Hub.

### 2. Private API Keys
Sensitive keys (like the `GEMINI_API_KEY` for AI features) are stored in the `.env` file. These keys are used exclusively in **Server-Side** flows (Genkit) and are never exposed to the client's browser.

### 3. Dynamic Functionality
The app uses **Next.js Server Actions** and **Firebase Real-time SDKs** to ensure a dynamic, non-static experience without the need for a separate server infrastructure.

## Key Features
- **AI Concierge**: Context-aware Gemini-powered assistant.
- **Auto-Recaps**: Intelligent meeting summarization.
- **Hub Chat**: Real-time team coordination with media support.
- **Project Hub**: Team task tracking with progress monitoring.
- **Identity Management**: Verified student records controlled by administration.
