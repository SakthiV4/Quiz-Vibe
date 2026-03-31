import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { joinRoom } from '@/utils/roomCode'
import { supabase } from '@/lib/supabase'

/**
 * Join Room Page - Enter room code to join multiplayer quiz
 */
export default function JoinRoom() {
    const navigate = useNavigate()
    const [roomCode, setRoomCode] = useState('')
    const [isJoining, setIsJoining] = useState(false)
    const [error, setError] = useState('')

    const handleJoin = async () => {
        if (roomCode.length !== 4) {
            setError('Room code must be 4 characters')
            return
        }

        setIsJoining(true)
        setError('')

        try {
            // 0. Authenticate
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                // Determine if we should allow guests? For now, enforcing login for consistency
                setError('Please log in to join a room')
                setIsJoining(false)
                return
            }

            console.log(`🚪 Joining room ${roomCode} as user ${user.id}...`)

            // 1. Join Room
            const roomId = await joinRoom(roomCode, user.id)

            console.log('✅ Successfully joined room:', roomId)
            navigate(`/waiting/${roomId}`)

        } catch (err: any) {
            console.error('Join Room Error:', err)
            // Extract meaningful message
            const msg = err.message || 'Failed to join room'

            if (msg.includes('Room not found')) {
                setError('Room not found! Check the code.')
            } else if (msg.includes('already started')) {
                setError('This game has already started!')
            } else {
                setError(`Error: ${msg}`)
            }

            setIsJoining(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-2xl max-w-md w-full"
            >
                <h1 className="text-4xl font-display font-bold mb-2 text-gradient">
                    🚪 Join Room
                </h1>
                <p className="text-text-secondary mb-8">
                    Enter the 4-digit room code to join the quiz
                </p>

                {/* Room Code Input */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-text-primary">
                        Room Code
                    </label>
                    <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                        placeholder="ABCD"
                        maxLength={4}
                        className="w-full px-4 py-4 rounded-xl bg-bg-secondary border border-glass-border text-text-primary text-center text-3xl font-mono font-bold tracking-widest placeholder-text-tertiary focus:border-accent-primary focus:outline-none transition-all uppercase"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl bg-error/10 border border-error text-error text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Join Button */}
                <button
                    onClick={handleJoin}
                    disabled={roomCode.length !== 4 || isJoining}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isJoining ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⚙️</span>
                            Joining...
                        </span>
                    ) : (
                        'Join Room'
                    )}
                </button>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="btn-secondary w-full mt-4"
                >
                    ← Back to Home
                </button>
            </motion.div>
        </div>
    )
}
