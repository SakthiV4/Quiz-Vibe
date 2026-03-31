import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
    id: string
    username: string
    email: string
    avatar_url?: string
    total_score: number
    created_at: string
}

export interface Room {
    id: string
    room_code: string
    host_id: string
    mode: 'bookworm' | 'creator'
    question_count: number
    difficulty?: 'easy' | 'medium' | 'hard'
    topic?: string
    status: 'waiting' | 'active' | 'completed'
    created_at: string
    started_at?: string
    ended_at?: string
}

export interface Question {
    id: string
    room_id: string
    question_text: string
    options: string[]
    correct_answer: number
    explanation: string
    hint: string
    difficulty_level: number
    background_image_url?: string
    order_index: number
}

export interface PlayerSession {
    id: string
    room_id: string
    user_id: string
    score: number
    current_question_index: number
    correct_streak: number
    current_difficulty: number
    answers: Array<{
        question_id: string
        selected_answer: number
        is_correct: boolean
        time_taken: number
    }>
    hints_used: string[]
    joined_at: string
    finished_at?: string
}

export interface DifficultyScalingEvent {
    id: string
    user_id: string
    room_id: string
    old_difficulty: number
    new_difficulty: number
    trigger: string
    created_at: string
}
