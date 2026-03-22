import { useParams } from 'react-router-dom'
import { QuizInterface } from '@/components/quiz/QuizInterface'
import { useNavigate } from 'react-router-dom'
import { LeaderboardSidebar } from '@/components/quiz/LeaderboardSidebar'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Quiz Page - Main quiz interface
 */
export default function QuizPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()
    const [questions, setQuestions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string | null>(null)

    useEffect(() => {
        const initializeQuiz = async () => {
            if (!roomId) return

            try {
                // 1. Get Current User
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    navigate('/login')
                    return
                }
                setUserId(user.id)

                // 2. Get Player Session
                const { data: session, error: sessionError } = await supabase
                    .from('player_sessions')
                    .select('id')
                    .eq('room_id', roomId)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (sessionError || !session) {
                    console.error('Session not found:', sessionError)
                    // If no session exists, we could create one or error out. 
                    // Ideally, one should exist from the Waiting Room.
                    // For robustness, let's create one if missing (e.g. direct access dev mode)
                    const { data: newSession, error: createError } = await supabase
                        .from('player_sessions')
                        .insert({
                            room_id: roomId,
                            user_id: user.id,
                            score: 0
                        })
                        .select('id')
                        .single()

                    if (createError) throw createError
                    setSessionId(newSession.id)
                } else {
                    setSessionId(session.id)
                }

                // 3. Fetch Questions
                const { data: questionsData, error: questionsError } = await supabase
                    .from('questions')
                    .select('*')
                    .eq('room_id', roomId)
                    .order('order_index', { ascending: true })

                if (questionsError) throw questionsError

                if (questionsData && questionsData.length > 0) {
                    setQuestions(questionsData)
                } else {
                    console.warn(`No questions found for room ${roomId}`)
                }
            } catch (error) {
                console.error('Error initializing quiz:', error)
            } finally {
                setLoading(false)
            }
        }

        initializeQuiz()
    }, [roomId, navigate])

    const handleQuizComplete = () => {
        navigate(`/results/${roomId}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
                    <p>Loading Quiz...</p>
                </div>
            </div>
        )
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-white p-6 text-center">
                <h2 className="text-2xl font-bold mb-4">No Questions Found</h2>
                <p className="mb-6 text-text-secondary">We couldn't find any questions for this quiz.</p>
                <button
                    onClick={() => navigate('/')}
                    className="btn-secondary"
                >
                    Go Home
                </button>
            </div>
        )
    }

    if (!userId || !sessionId) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center text-white">
                <p>Initializing Session...</p>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-bg-primary">
            {/* Left Sidebar: Leaderboard (Hidden on mobile) */}
            <div className="hidden lg:block h-full shadow-xl z-20">
                <LeaderboardSidebar roomId={roomId || ''} currentUserId={userId} />
            </div>

            {/* Main Content: Quiz */}
            <main className="flex-1 h-full overflow-y-auto w-full relative">
                <QuizInterface
                    roomId={roomId || ''}
                    userId={userId}
                    playerSessionId={sessionId}
                    questions={questions}
                    onQuizComplete={handleQuizComplete}
                />
            </main>
        </div>
    )
}
