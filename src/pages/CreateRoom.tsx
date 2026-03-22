import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createRoom } from '@/utils/roomCode'
import { supabase } from '@/lib/supabase'
import { Upload, FileText, Loader2, Sparkles } from 'lucide-react'

/**
 * Create Room Page - Host a multiplayer quiz
 */
export default function CreateRoom() {
    const navigate = useNavigate()
    const [mode, setMode] = useState<'bookworm' | 'creator'>('creator')
    const [topic, setTopic] = useState('')
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [questionCount, setQuestionCount] = useState(10)
    const [isCreating, setIsCreating] = useState(false)

    // Bookworm specific state
    const [file, setFile] = useState<File | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const MAX_FILE_SIZE = 6 * 1024 * 1024 // 6MB

    // File Handling
    const validateFile = (file: File) => {
        if (file.size > MAX_FILE_SIZE) {
            alert(`File too large! Max size is 6MB.`)
            return false
        }
        return true
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && validateFile(e.target.files[0])) {
            setFile(e.target.files[0])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files?.[0] && validateFile(e.dataTransfer.files[0])) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleCreate = async () => {
        // Validation
        if (mode === 'creator' && !topic.trim()) return alert('Please enter a topic')
        if (mode === 'bookworm' && !file) return alert('Please upload a document')

        setIsCreating(true)

        try {
            // 0. Authenticate
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('You must be logged in to create a room')

            let generatedQuestions = []
            let fileUrl = ''

            // 1. Prepare Content (Upload or Generate Params)
            if (mode === 'bookworm' && file) {
                // Upload File
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('documents')
                    .upload(fileName, file)
                if (uploadError) throw uploadError

                // Get URL
                const { data: { publicUrl } } = supabase.storage
                    .from('documents')
                    .getPublicUrl(fileName)
                fileUrl = publicUrl
            }

            // 2. Create Room
            const { roomId, roomCode: _roomCode } = await createRoom(user.id, mode, {
                questionCount,
                difficulty,
                topic: mode === 'creator' ? topic : (file?.name || 'Document Quiz')
            })

            // 3. Generate Questions via Edge Functions
            const functionName = mode === 'creator' ? 'generate-creator-quiz' : 'process-bookworm'
            const payload = mode === 'creator'
                ? { topic, difficulty, questionCount }
                : { fileUrl, questionCount }

            console.log(`🤖 Invoking ${functionName}...`)
            const { data, error } = await supabase.functions.invoke(functionName, { body: payload })

            if (error) throw error
            if (!data || !data.success) throw new Error(data?.error || 'AI generation failed')

            generatedQuestions = data.questions

            // 4. Save Questions to DB
            if (generatedQuestions.length > 0) {
                const questionsToInsert = generatedQuestions.map((q: any, index: number) => ({
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

                const { error: dbError } = await supabase
                    .from('questions')
                    .insert(questionsToInsert)

                if (dbError) throw dbError
            } else {
                throw new Error('No questions were generated.')
            }

            // 5. Navigate to Waiting Room
            console.log('✅ Room Ready! Navigating...')
            navigate(`/waiting/${roomId}`)

        } catch (error: any) {
            console.error('Failed to create room:', error)
            alert(`Error creating room:\n${error.message}`)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 rounded-2xl max-w-2xl w-full"
            >
                <h1 className="text-4xl font-display font-bold mb-2 text-gradient">
                    🏠 Create Room
                </h1>
                <p className="text-text-secondary mb-8">
                    Set up your multiplayer quiz room
                </p>

                {/* Mode Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-text-primary uppercase tracking-wider">
                        Step 1: Select Game Mode
                    </label>
                    <div className="grid grid-cols-2 gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
                        <button
                            onClick={() => setMode('creator')}
                            className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg
                                ${mode === 'creator'
                                    ? 'bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/20'
                                    : 'text-white hover:bg-white/5'}`}
                        >
                            <Sparkles size={20} /> Creator
                        </button>
                        <button
                            onClick={() => setMode('bookworm')}
                            className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-lg
                                ${mode === 'bookworm'
                                    ? 'bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/20'
                                    : 'text-white hover:bg-white/5'}`}
                        >
                            <FileText size={20} /> Bookworm
                        </button>
                    </div>
                </div>

                {/* CREATOR MODE INPUTS */}
                {mode === 'creator' && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2 text-text-primary">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Quantum Physics, 90s Music..."
                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-glass-border text-text-primary focus:border-accent-primary focus:outline-none"
                        />
                    </div>
                )}

                {/* BOOKWORM MODE INPUTS */}
                {mode === 'bookworm' && (
                    <div className="mb-6">
                        <label className="block text-sm font-semibold mb-2 text-text-primary">Upload Document (PDF/Image)</label>
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                                ${isDragOver ? 'border-accent-primary bg-accent-primary/10' : 'border-glass-border hover:border-text-secondary bg-bg-secondary/50'}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" id="multi-file-upload" />
                            <label htmlFor="multi-file-upload" className="cursor-pointer">
                                {file ? (
                                    <div className="text-accent-primary font-bold flex flex-col items-center">
                                        <FileText size={32} className="mb-2" />
                                        {file.name}
                                    </div>
                                ) : (
                                    <div className="text-text-secondary flex flex-col items-center">
                                        <Upload size={32} className="mb-2" />
                                        <span>Click or Drag File Here</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                )}

                {/* Difficulty */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Difficulty</label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`py-3 rounded-xl font-semibold transition-all capitalize
                                    ${difficulty === level ? 'bg-gradient-primary text-bg-primary' : 'bg-bg-secondary border border-glass-border text-text-secondary'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Question Count */}
                <div className="mb-8">
                    <label className="block text-sm font-semibold mb-2 text-text-primary">
                        Questions: <span className="text-accent-primary">{questionCount}</span>
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="20"
                        step="5"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="w-full accent-accent-primary"
                    />
                </div>

                {/* Create Button */}
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-accent-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="animate-spin" />
                            {mode === 'bookworm' ? 'Analyzing & Creating...' : 'Generating & Creating...'}
                        </span>
                    ) : (
                        'Create Room'
                    )}
                </button>

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
