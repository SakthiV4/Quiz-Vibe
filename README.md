# QuizVibe - AI-Powered Quiz Platform

Transform learning into competition with AI-powered quizzes featuring dynamic difficulty scaling, real-time multiplayer, and Socratic learning.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- API Keys:
  - Google Gemini 1.5 Flash API
  - Pexels API
  - Giphy API (optional)

### Installation

1. **Clone and install dependencies:**
```bash
cd c:\PROJECT\quiz-vibe
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_PEXELS_API_KEY` - Pexels API key
- `VITE_GIPHY_API_KEY` - Giphy API key (optional)

3. **Setup Supabase database:**
- Go to your Supabase project SQL Editor
- Run the migration file: `supabase/migrations/001_initial_schema.sql`

4. **Run development server:**
```bash
npm run dev
```

## 🎯 Features

### Core Modes
- **📖 The Bookworm** - Upload PDFs/images, AI extracts content and generates quizzes
- **✨ The Creator** - Enter any topic, AI generates custom quizzes instantly
- **🏠 Create Room** - Host multiplayer quiz rooms with 4-digit codes
- **🚪 Join Room** - Join competitions with room codes

### AI-Powered Features
- **🔥 Dynamic Difficulty Scaling** - Automatically increases difficulty after 3 consecutive correct answers
- **💡 Socratic Hints** - AI-generated hints that guide without revealing answers
- **🤖 AI Explanations** - One-sentence explanations for every answer
- **⚡ Real-time Leaderboard** - Live rankings powered by Supabase Realtime

### Design
- **Midnight Aurora** design system with glass morphism
- Fluid animations with Framer Motion
- Mobile-first responsive design
- PWA support for offline functionality

## 📁 Project Structure

```
quiz-vibe/
├── src/
│   ├── components/
│   │   ├── quiz/
│   │   │   ├── QuizInterface.tsx      # Main quiz component
│   │   │   ├── HintButton.tsx         # Socratic hints
│   │   │   └── ExplanationPanel.tsx   # AI explanations
│   │   └── multiplayer/
│   │       └── LiveLeaderboard.tsx    # Real-time rankings
│   ├── pages/
│   │   ├── HomePage.tsx               # Mode selection
│   │   ├── BookwormMode.tsx           # PDF/image upload
│   │   ├── CreatorMode.tsx            # Topic-based generation
│   │   ├── CreateRoom.tsx             # Host multiplayer
│   │   ├── JoinRoom.tsx               # Join with code
│   │   ├── WaitingRoom.tsx            # Pre-quiz lobby
│   │   ├── QuizPage.tsx               # Quiz interface
│   │   └── ResultsPage.tsx            # Final leaderboard
│   ├── services/
│   │   └── difficultyScaler.ts        # Dynamic difficulty logic
│   ├── utils/
│   │   └── roomCode.ts                # Room management
│   ├── lib/
│   │   └── supabase.ts                # Supabase client
│   ├── App.tsx                        # Main app with routing
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Database schema
├── public/                            # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Custom Design System
- **Animations:** Framer Motion
- **Backend:** Supabase (PostgreSQL + Realtime + Edge Functions)
- **AI:** Google Gemini 1.5 Flash
- **State:** React Query + Zustand
- **APIs:** Pexels (backgrounds), Giphy (rewards)

## 🔧 Next Steps

### Required Setup
1. **Install Node.js** - Download from nodejs.org
2. **Create Supabase Project** - Visit supabase.com
3. **Get API Keys:**
   - Gemini: https://makersuite.google.com/app/apikey
   - Pexels: https://www.pexels.com/api/
   - Giphy: https://developers.giphy.com/

### Supabase Edge Functions (TODO)
Create these Edge Functions in your Supabase project:
- `process-bookworm` - PDF/image OCR and quiz generation
- `generate-creator-quiz` - Topic-based quiz generation
- `get-next-question` - Dynamic difficulty scaling

### Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod
```

## 📝 License

MIT License - Feel free to use this project for learning and development!

---

Built with ❤️ using Google Gemini 1.5 Flash
