# pomodoro web

A beautiful pomodoro timer built for focused study sessions.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase

Edit `.env` with your Supabase project credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Supabase tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- User stats table
CREATE TABLE user_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  display_name TEXT DEFAULT 'love',
  total_sessions INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  sessions_today INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_study_date TEXT,
  daily_goal INTEGER DEFAULT 8,
  weekly_data JSONB DEFAULT '[0,0,0,0,0,0,0]'
);

-- Insert initial row
INSERT INTO user_stats (id) VALUES (1);

-- Todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  subject TEXT DEFAULT 'General',
  priority TEXT DEFAULT 'normal',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (public access for personal use)
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON user_stats FOR ALL USING (true);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON todos FOR ALL USING (true);
```

### 4. Add bell sound (optional)

Place a `bell.mp3` file in the `/public` folder for the timer completion sound.  
Free option: https://freesound.org/people/Bertrof/sounds/131660/

If no bell.mp3 is present, the app falls back to a Web Audio sine wave beep.

### 5. Run locally
```bash
npm run dev
```

## Deploy to Vercel

1. Push to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Import** your repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy → get your live URL
5. In Supabase: **Settings → API → Allowed Origins** → add your Vercel domain

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause timer |
| `R` | Reset timer |
| `S` | Skip to next session |

## Tech Stack

- React + Vite
- Supabase (database)
- Framer Motion (animations)
- Canvas Confetti (celebrations)
- Lucide React (icons)
