import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createRoom } from '@/utils/roomCode'

/**
 * The Creator Mode - Topic-based Quiz Generation
 */
export default function CreatorMode() {
    const navigate = useNavigate()
    const [topic, setTopic] = useState('')
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [questionCount, setQuestionCount] = useState(10)
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        if (!topic.trim()) {
            alert('Please enter a topic')
            return
        }

        setIsGenerating(true)
        console.log('🚀 Starting generation for topic:', topic)

        try {
            // 0. Check User
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not logged in')
            console.log('👤 User Authenticated:', user.id)

            // 1. Create a room first
            console.log('🏠 Creating Room...')
            const result = await createRoom(
                user.id,
                'creator',
                {
                    questionCount,
                    difficulty,
                    topic
                }
            )
            console.log('✅ Room Created:', result)
            const { roomId } = result

            // 2. Call Edge Function to generate quiz
            console.log('🤖 Invoking AI Service...')
            const { data, error } = await supabase.functions.invoke('generate-creator-quiz', {
                body: {
                    topic,
                    difficulty,
                    questionCount
                }
            })

            console.log('🤖 AI Response:', data, error)

            if (error) {
                console.error('AI Service Error:', error)
                throw new Error(`AI Service Failed: ${error.message}`)
            }

            if (!data || !data.success) {
                throw new Error(data?.error || 'Failed to generate quiz (Empty response)')
            }

            // 3. Save questions
            console.log('💾 Saving Questions...')
            const questionsToInsert = data.questions.map((q: any, index: number) => ({
                room_id: roomId,
                question_text: q.question_text,
                options: q.options,
                correct_answer: q.correct_answer,
                explanation: q.explanation,
                hint: q.hint,
                difficulty_level: q.difficulty_level,
                background_image_url: q.background_image_url,
                order_index: index
            }))

            const { error: questionsError } = await supabase
                .from('questions')
                .insert(questionsToInsert)

            if (questionsError) throw questionsError
            console.log('✅ Questions Saved!')

            // 4. Navigate to quiz
            navigate(`/quiz/${roomId}`)

        } catch (error: any) {
            console.error('❌ FATAL ERROR in CreatorMode:', error)
            alert(`Failed to create quiz:\n${error.message}\n\nCheck console (F12) for details.`)
            setIsGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden font-display">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-bg-tertiary/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-10 rounded-4xl max-w-2xl w-full relative z-10 border border-glass-border shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/')}
                        className="bg-bg-secondary p-3 rounded-xl text-text-secondary hover:text-white hover:bg-bg-tertiary transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">The Creator</h1>
                        <p className="text-text-secondary text-sm">AI-generated quizzes on any topic</p>
                    </div>
                </div>

                {/* Topic Input - Premium Search Bar */}
                <div className="mb-8 relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="text-text-secondary group-focus-within:text-accent-primary transition-colors" size={24} />
                    </div>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What do you want to learn about?"
                        className="w-full pl-14 pr-4 py-5 rounded-2xl bg-bg-secondary border border-glass-border text-white text-lg placeholder-text-tertiary focus:border-accent-primary focus:outline-none focus:ring-4 focus:ring-accent-primary/10 transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="bg-bg-tertiary px-3 py-1 rounded-lg text-xs font-bold text-text-secondary border border-glass-border">TOPIC</div>
                    </div>
                </div>

                {/* Difficulty Selector */}
                <div className="mb-8">
                    <label className="text-sm font-bold text-white uppercase tracking-wider mb-4 block pl-1">
                        Select Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-4 h-14">
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`
                                    relative rounded-xl font-bold text-sm uppercase tracking-wide transition-all h-full
                                    ${difficulty === level
                                        ? 'bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/20 scale-[1.02]'
                                        : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-white border border-glass-border'
                                    }
                                `}
                            >
                                {level}
                                {difficulty === level && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute inset-0 border-2 border-white/20 rounded-xl"
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question Count Slider */}
                <div className="mb-10 p-6 bg-bg-secondary/50 rounded-3xl border border-glass-border">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-white uppercase tracking-wider">
                            Length
                        </label>
                        <span className="text-2xl font-bold text-accent-primary">
                            {questionCount}<span className="text-sm text-text-tertiary ml-1">Qs</span>
                        </span>
                    </div>

                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="5"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent-primary"
                    />
                    <div className="flex justify-between text-xs text-text-secondary mt-3 font-medium">
                        <span>Short (5)</span>
                        <span>Long (20)</span>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn-primary w-full py-4 text-lg shadow-lg shadow-accent-primary/20"
                >
                    {isGenerating ? (
                        <span className="flex items-center justify-center gap-3">
                            <Sparkles className="animate-spin" size={24} />
                            Generating Magic...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            Create Quiz <ArrowRight size={20} />
                        </span>
                    )}
                </button>
            </motion.div>
        </div>
    )
}
