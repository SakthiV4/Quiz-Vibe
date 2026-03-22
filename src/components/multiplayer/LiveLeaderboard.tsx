import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaderboardEntry {
    rank: number
    userId: string
    username: string
    avatar: string
    score: number
    streak: number
    isCurrentUser: boolean
}

interface LiveLeaderboardProps {
    roomId: string
    currentUserId: string
}

/**
 * Live Leaderboard Component
 * Real-time rankings powered by Supabase Realtime
 */
export function LiveLeaderboard({ roomId, currentUserId }: LiveLeaderboardProps) {
    const [rankings, setRankings] = useState<LeaderboardEntry[]>([])

    useEffect(() => {
        // Initial fetch
        fetchLeaderboard()

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`room:${roomId}:leaderboard`)
            .on(
                'postgres_changes',
                {
                    event: '*', // All events: INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'player_sessions',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    console.log('🔄 Leaderboard update received:', payload)
                    fetchLeaderboard() // Refresh rankings
                }
            )
            .subscribe()

        return () => {
            channel.unsubscribe()
        }
    }, [roomId])

    async function fetchLeaderboard() {
        const { data, error } = await supabase
            .from('player_sessions')
            .select(`
        id,
        score,
        correct_streak,
        finished_at,
        user:users (
          id,
          username,
          avatar_url
        )
      `)
            .eq('room_id', roomId)
            .order('score', { ascending: false })
            .order('finished_at', { ascending: true, nullsFirst: false })

        if (error) {
            console.error('Leaderboard error:', error)
            return
        }

        const validData = data || []

        // Remove duplicates (keep highest score)
        const uniqueUsers = new Map<string, any>()
        validData.forEach((entry: any) => {
            const existing = uniqueUsers.get(entry.user.id)
            if (!existing || entry.score > existing.score) {
                uniqueUsers.set(entry.user.id, entry)
            }
        })

        const sortedData = Array.from(uniqueUsers.values())
            .sort((a, b) => b.score - a.score || new Date(a.finished_at || 0).getTime() - new Date(b.finished_at || 0).getTime())

        const ranked = sortedData.map((entry: any, index: number) => ({
            rank: index + 1,
            userId: entry.user.id,
            username: entry.user.username,
            avatar: entry.user.avatar_url,
            score: entry.score,
            streak: entry.correct_streak,
            isCurrentUser: entry.user.id === currentUserId
        }))

        setRankings(ranked)
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    🏆 Live Rankings
                </h3>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-sm font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-accent-primary" />
                    LIVE
                </span>
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {rankings.map((entry, index) => (
                        <motion.div
                            key={entry.userId}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{
                                duration: 0.3,
                                delay: index * 0.05
                            }}
                            className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${entry.isCurrentUser
                                ? 'bg-accent-primary/10 border-accent-primary/50 shadow-[0_0_15px_rgba(227,255,204,0.1)]'
                                : 'bg-bg-secondary/50 border-glass-border'
                                }`}
                        >
                            {/* Rank Badge */}
                            <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-lg ${entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                                entry.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' :
                                    entry.rank === 3 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/50' :
                                        'bg-bg-tertiary text-text-secondary'
                                }`}>
                                {entry.rank === 1 && '🥇'}
                                {entry.rank === 2 && '🥈'}
                                {entry.rank === 3 && '🥉'}
                                {entry.rank > 3 && `#${entry.rank}`}
                            </div>

                            {/* Avatar */}
                            <img
                                src={entry.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                                alt={entry.username}
                                className="w-12 h-12 rounded-full bg-bg-tertiary object-cover border-2 border-bg-tertiary"
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold truncate ${entry.isCurrentUser ? 'text-accent-primary' : 'text-white'}`}>
                                        {entry.username}
                                    </span>
                                    {entry.isCurrentUser && (
                                        <span className="text-[10px] bg-accent-primary text-bg-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                            You
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-text-secondary flex items-center gap-2">
                                    {entry.streak > 0 && (
                                        <span className="text-orange-400 flex items-center gap-1">
                                            🔥 {entry.streak} Streak
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Score */}
                            <div className="text-right">
                                <div className="text-xl font-bold text-white">{entry.score}</div>
                                <div className="text-xs text-text-secondary">points</div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {rankings.length === 0 && (
                    <div className="text-center py-8 text-text-secondary">
                        Waiting for players...
                    </div>
                )}
            </div>
        </div>
    )
}
