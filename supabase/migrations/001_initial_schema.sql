-- QuizVibe Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code VARCHAR(4) UNIQUE NOT NULL,
  host_id UUID REFERENCES users(id),
  mode VARCHAR(20) NOT NULL, -- 'bookworm' or 'creator'
  question_count INTEGER NOT NULL,
  difficulty VARCHAR(10), -- 'easy', 'medium', 'hard'
  topic TEXT,
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'completed'
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 options
  correct_answer INTEGER NOT NULL, -- Index 0-3
  explanation TEXT NOT NULL, -- ONE sentence AI-generated explanation
  hint TEXT NOT NULL, -- Socratic hint from Gemini
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale for dynamic difficulty
  background_image_url TEXT, -- Pexels image URL
  order_index INTEGER NOT NULL
);

-- Player Sessions table
CREATE TABLE player_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  score INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,
  correct_streak INTEGER DEFAULT 0, -- For dynamic difficulty
  current_difficulty INTEGER DEFAULT 1, -- Current difficulty level (1-5)
  answers JSONB DEFAULT '[]', -- Array of answer objects
  hints_used JSONB DEFAULT '[]', -- Track which questions used hints
  joined_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);

-- Difficulty Scaling Events (for analytics)
CREATE TABLE difficulty_scaling_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  room_id UUID REFERENCES rooms(id),
  old_difficulty INTEGER,
  new_difficulty INTEGER,
  trigger VARCHAR(50), -- 'consecutive_correct_3', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_questions_room ON questions(room_id, order_index);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_player_sessions_room ON player_sessions(room_id);
CREATE INDEX idx_player_sessions_user ON player_sessions(user_id);

-- Enable Realtime on player_sessions for live leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE player_sessions;

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Anyone authenticated can view rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (true);

-- Only host can update room
CREATE POLICY "Only host can update room"
  ON rooms FOR UPDATE
  USING (auth.uid() = host_id);

-- Anyone in a room can view its questions
CREATE POLICY "Room members can view questions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM player_sessions
      WHERE player_sessions.room_id = questions.room_id
      AND player_sessions.user_id = auth.uid()
    )
  );

-- Players can only update their own session
CREATE POLICY "Players update own session"
  ON player_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can insert player sessions (for joining rooms)
CREATE POLICY "Anyone can join rooms"
  ON player_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can view player sessions in their room
CREATE POLICY "Room members can view sessions"
  ON player_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM player_sessions ps
      WHERE ps.room_id = player_sessions.room_id
      AND ps.user_id = auth.uid()
    )
  );
