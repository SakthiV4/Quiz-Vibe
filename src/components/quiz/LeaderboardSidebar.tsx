import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Trophy, Medal, User } from 'lucide-react'

interface Player {
    id: string
    username: string
    avatar_url: string
    score: number
}

interface LeaderboardSidebarProps {
    roomId: string
    currentUserId: string
}

export function LeaderboardSidebar({ roomId, currentUserId }: LeaderboardSidebarProps) {
    const [players, setPlayers] = useState<Player[]>([])

    useEffect(() => {
        fetchLeaderboard()

        // Subscribe to score updates
        const channel = supabase
            .channel(`room:${roomId}:leaderboard`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'player_sessions',
                    filter: `room_id=eq.${roomId}`
                },
                (payload: any) => {
                    console.log('🏆 Leaderboard Update:', payload)
                    // Optimistically update or refetch
                    // For accuracy with ranking, refetching is safer
                    fetchLeaderboard()
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [roomId])

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('player_sessions')
            .select(`
                score,
                user:users (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('room_id', roomId)
            .order('score', { ascending: false })

        if (data) {
            // Deduplicate players by user.id
            const uniquePlayers = new Map()
            data.forEach((item: any) => {
                if (!uniquePlayers.has(item.user.id)) {
                    uniquePlayers.set(item.user.id, {
                        id: item.user.id,
                        username: item.user.username,
                        avatar_url: item.user.avatar_url,
                        score: item.score
                    })
                }
            })
            setPlayers(Array.from(uniquePlayers.values()))
        }
    }

    // Hide leaderboard if only 1 player (Solo Mode)
    if (players.length <= 1) {
        return null
    }

    return (
        <div className="h-full flex flex-col bg-bg-secondary/30 border-r border-glass-border backdrop-blur-sm p-4 w-80">
            <div className="flex items-center gap-2 mb-6 p-2">
                <Trophy className="text-accent-primary" size={24} />
                <h2 className="text-xl font-bold text-white font-display">Leaderboard</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                <AnimatePresence mode='popLayout'>
                    {players.map((player, index) => (
                        <motion.div
                            layout
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                            className={`
                                relative flex items-center gap-3 p-3 rounded-xl border
                                ${player.id === currentUserId
                                    ? 'bg-accent-primary/10 border-accent-primary/50'
                                    : 'bg-bg-tertiary/50 border-transparent'}
                            `}
                        >
                            {/* Rank Badge */}
                            <div className={`
                                w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                ${index === 0 ? 'bg-yellow-500 text-bg-primary' :
                                    index === 1 ? 'bg-gray-400 text-bg-primary' :
                                        index === 2 ? 'bg-orange-500 text-bg-primary' :
                                            'bg-bg-primary text-text-secondary'}
                            `}>
                                {index + 1}
                            </div>

                            {/* Avatar */}
                            {player.avatar_url ? (
                                <img src={player.avatar_url} alt={player.username} className="w-8 h-8 rounded-full object-cover bg-bg-primary" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-bg-primary flex items-center justify-center">
                                    <User size={14} className="text-text-secondary" />
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold truncate ${player.id === currentUserId ? 'text-accent-primary' : 'text-white'}`}>
                                    {player.username}
                                    {player.id === currentUserId && ' (You)'}
                                </p>
                            </div>

                            {/* Score */}
                            <div className="text-right">
                                <span className="text-sm font-mono font-bold text-accent-primary">
                                    {player.score}
                                </span>
                            </div>

                            {/* Crown for #1 */}
                            {index === 0 && (
                                <div className="absolute -top-1 -right-1 transform rotate-12">
                                    <Medal size={16} className="text-yellow-500 drop-shadow-lg" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {players.length === 0 && (
                    <div className="text-center text-text-tertiary text-sm py-8">
                        Waiting for players...
                    </div>
                )}
            </div>
        </div>
    )
}
