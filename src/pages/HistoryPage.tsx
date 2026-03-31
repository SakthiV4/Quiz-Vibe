import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Calendar, Trophy, FileText, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

interface QuizHistoryItem {
    session_id: string
    room_id: string
    score: number
    finished_at: string
    room: {
        mode: string
        topic: string | null
        question_count: number
    }
}

export default function HistoryPage() {
    const navigate = useNavigate()
    const [history, setHistory] = useState<QuizHistoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            console.log('Fetching history for user:', user.id)

            // DEBUG: Sorting by 'joined_at' (created_at does not exist on player_sessions)
            const { data, error } = await supabase
                .from('player_sessions')
                .select(`
                    id,
                    room_id,
                    score,
                    finished_at,
                    room:rooms (
                        mode,
                        topic,
                        question_count
                    )
                `)
                .eq('user_id', user.id)
                .order('joined_at', { ascending: false })

            if (error) {
                console.error('Database error fetching history:', error)
                throw error
            }

            console.log('Raw history data:', data)

            setHistory(data.map((item: any) => ({
                session_id: item.id,
                room_id: item.room_id,
                score: item.score || 0,
                finished_at: item.finished_at || null,
                room: item.room || { mode: 'unknown', topic: 'Unknown Quiz', question_count: 0 }
            })))
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (item: QuizHistoryItem) => {
        setDownloadingId(item.session_id)
        try {
            const { data: questions, error } = await supabase
                .from('questions')
                .select('*')
                .eq('room_id', item.room_id)
                .order('order_index', { ascending: true })

            if (error) throw error

            if (!questions || questions.length === 0) {
                alert('No questions found for this quiz.')
                return
            }

            const date = new Date(item.finished_at || new Date().toISOString()).toLocaleDateString()
            let content = `QUIZ VIBE - PRACTICE SHEET\n`
            content += `--------------------------\n`
            content += `Topic: ${item.room.topic || item.room.mode}\n`
            content += `Date: ${date}\n`
            content += `Score Obtained: ${item.score}\n`
            content += `--------------------------\n\n`

            questions.forEach((q: any, index: number) => {
                content += `Q${index + 1}: ${q.question_text}\n`
                q.options.forEach((opt: string, i: number) => {
                    content += `   ${String.fromCharCode(65 + i)}) ${opt}\n`
                })
                content += `\n   Correct Answer: ${String.fromCharCode(65 + q.correct_answer)}`
                content += `\n   Explanation: ${q.explanation}\n`
                content += `\n------------------------------------------------\n\n`
            })

            const blob = new Blob([content], { type: 'text/plain' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `quiz-vibe-${item.room.mode}-${date.replace(/\//g, '-')}.txt`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

        } catch (error) {
            console.error('Download failed:', error)
            alert('Failed to download quiz. Please try again.')
        } finally {
            setDownloadingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-bg-primary p-6 md:p-12 font-display text-text-primary relative">
            <div className="max-w-4xl mx-auto relative z-10">
                <header className="flex items-center gap-4 mb-12">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-bg-secondary px-6 py-3 rounded-xl text-text-secondary hover:text-white hover:bg-bg-tertiary transition-all flex items-center gap-3 font-bold"
                    >
                        <ArrowLeft size={20} />
                        Back to Dashboard
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">Assessment History</h1>
                        <p className="text-text-secondary">Review and download your past attempts</p>
                    </div>
                </header>

                {loading ? (
                    <div className="text-center py-20 text-text-secondary">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-20 bg-bg-secondary/30 rounded-3xl border border-glass-border">
                        <FileText size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold mb-2">No Quizzes Yet</h3>
                        <p className="text-text-secondary">Complete a quiz to see it here!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {history.map((item) => (
                            <motion.div
                                key={item.session_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-bg-secondary/50 border border-glass-border p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-bg-secondary transition-colors"
                            >
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="w-16 h-16 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary shrink-0">
                                        <Trophy size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold capitalize mb-1">
                                            {item.room?.topic || item.room?.mode?.replace('-', ' ') || 'Untitled Quiz'}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {item.finished_at
                                                    ? new Date(item.finished_at).toLocaleString('en-IN', {
                                                        timeZone: 'Asia/Kolkata',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })
                                                    : <span className="text-warning">In Progress / Abandoned</span>}
                                            </span>
                                            <span className="bg-bg-tertiary px-2 py-0.5 rounded text-white">
                                                Score: {item.score}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDownload(item)}
                                    disabled={downloadingId === item.session_id}
                                    className="btn-secondary flex items-center gap-2 w-full md:w-auto justify-center"
                                >
                                    {downloadingId === item.session_id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Download size={18} />
                                    )}
                                    <span>Download PDF</span>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
