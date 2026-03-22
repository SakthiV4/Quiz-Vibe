import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { startRoom } from '@/utils/roomCode'

interface Player {
    id: string
    username: string
    avatar_url: string
}

/**
 * Waiting Room - Players wait for host to start the quiz
 */
export default function WaitingRoom() {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()
    const [roomCode, setRoomCode] = useState('')
    const [players, setPlayers] = useState<Player[]>([])
    const [isHost, setIsHost] = useState(false)
    const [isStarting, setIsStarting] = useState(false)

    useEffect(() => {
        if (!roomId) return

        fetchRoomData()
        fetchPlayers()

        // POLLING FALLBACK: Fetch every 3 seconds
        // This helps if Realtime is blocked or flaky
        const interval = setInterval(fetchPlayers, 3000)

        // Subscribe to player joins
        console.log(`🔌 Subscribing to room:${roomId}:players`)
        const channel = supabase
            .channel(`room:${roomId}:players`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to ALL events
                    schema: 'public',
                    table: 'player_sessions',
                    filter: `room_id=eq.${roomId}`
                },
                (payload: any) => {
                    console.log('⚡ Realtime Update:', payload)
                    fetchPlayers()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`
                },
                (payload: any) => {
                    if (payload.new.status === 'active') {
                        navigate(`/quiz/${roomId}`)
                    }
                }
            )
            .subscribe((status: any) => {
                console.log(`📡 Subscription Status: ${status}`)
            })

        return () => {
            clearInterval(interval)
            channel.unsubscribe()
        }
    }, [roomId])

    async function fetchRoomData() {
        const { data } = await supabase
            .from('rooms')
            .select('room_code, host_id')
            .eq('id', roomId)
            .single()

        if (data) {
            setRoomCode(data.room_code)
            // TODO: Check if current user is host
            setIsHost(true) // Placeholder
        }
    }

    async function fetchPlayers() {
        const { data } = await supabase
            .from('player_sessions')
            .select(`
        id,
        user:users (
          id,
          username,
          avatar_url
        )
      `)
            .eq('room_id', roomId)

        if (data) {
            setPlayers(data.map((p: any) => p.user))
        }
    }

    async function handleStart() {
        if (!roomId) return

        setIsStarting(true)
        try {
            await startRoom(roomId)
            navigate(`/quiz/${roomId}`)
        } catch (error) {
            console.error('Failed to start room:', error)
            alert('Failed to start room')
            setIsStarting(false)
        }
    }

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode)
        alert('Room code copied!')
    }

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden font-display">
            {/* Background Effects */}
            <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-accent-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-bg-tertiary/30 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 rounded-4xl max-w-2xl w-full relative z-10 border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
                {/* Room Code Display */}
                <div className="text-center mb-10">
                    <div className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-widest">Room Code</div>
                    <div className="relative inline-block group cursor-pointer" onClick={copyRoomCode}>
                        <h1 className="text-7xl font-bold text-white mb-4 tracking-wider group-hover:text-accent-primary transition-colors">
                            {roomCode}
                        </h1>
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                            <span className="text-xs bg-accent-primary text-bg-primary px-2 py-1 rounded-md font-bold">COPY</span>
                        </div>
                    </div>
                </div>

                {/* Players List */}
                <div className="mb-10">
                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
                        <span className="bg-bg-tertiary w-8 h-8 rounded-full flex items-center justify-center text-sm">{players.length}</span>
                        Players ready
                    </h3>

                    {players.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-glass-border rounded-3xl bg-bg-secondary/30">
                            <p className="text-text-secondary">Waiting for players to join...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {players.map((player, idx) => (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-center gap-3 p-3 bg-bg-secondary rounded-2xl border border-glass-border hover:border-accent-primary/50 transition-colors"
                                >
                                    <img
                                        src={player.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                                        alt={player.username}
                                        className="w-10 h-10 rounded-full bg-bg-tertiary object-cover"
                                    />
                                    <span className="font-semibold text-white truncate">{player.username}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Start Button (Host Only) */}
                {isHost && (
                    <button
                        onClick={handleStart}
                        disabled={players.length < 1 || isStarting}
                        className="btn-primary w-full text-lg py-4 shadow-lg shadow-accent-primary/20"
                    >
                        {isStarting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin text-xl">⚙️</span>
                                Starting Game...
                            </span>
                        ) : (
                            'Start Quiz Now'
                        )}
                    </button>
                )}

                {/* Waiting Message (Non-Host) */}
                {!isHost && (
                    <div className="text-center p-6 bg-bg-secondary rounded-3xl border border-glass-border">
                        <div className="text-xl font-bold text-white mb-2">Host has control</div>
                        <div className="flex justify-center gap-1">
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 bg-accent-primary rounded-full" />
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-accent-primary rounded-full" />
                            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-accent-primary rounded-full" />
                        </div>
                        <div className="text-sm text-text-secondary mt-2">
                            Please wait for the host to start the game
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
