import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LiveLeaderboard } from '@/components/multiplayer/LiveLeaderboard'

/**
 * Results Page - Final leaderboard and stats
 */
export default function ResultsPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser()
            if (data.user) {
                setCurrentUserId(data.user.id)
            }
        }
        fetchUser()
    }, [])


    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-primary font-display">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-bg-tertiary/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full relative z-10 glass-card p-12 rounded-[3rem] border border-glass-border shadow-2xl"
            >
                {/* Winner Celebration */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', duration: 0.8, bounce: 0.5 }}
                        className="text-9xl mb-6 inline-block drop-shadow-2xl"
                    >
                        🏆
                    </motion.div>
                    <h1 className="text-6xl font-bold mb-4 text-white tracking-tight">
                        Quiz <span className="text-accent-primary">Complete!</span>
                    </h1>
                    <p className="text-xl text-text-secondary max-w-lg mx-auto">
                        Great job! Let's see where you stand on the leaderboard.
                    </p>
                </div>

                {/* Final Leaderboard */}
                <div className="mb-12">
                    {currentUserId && (
                        <LiveLeaderboard
                            roomId={roomId || ''}
                            currentUserId={currentUserId}
                        />
                    )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary py-5 text-lg rounded-2xl border-2 border-glass-border hover:border-white/20"
                    >
                        🏠 Back to Home
                    </button>
                    <button
                        onClick={() => navigate('/create-room')}
                        className="btn-primary py-5 text-lg rounded-2xl shadow-xl shadow-accent-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        🔄 Play Again
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
