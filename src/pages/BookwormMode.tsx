import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, FileText, ArrowLeft, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createRoom } from '@/utils/roomCode'

/**
 * The Bookworm Mode - PDF/Image OCR Quiz Generation
 */
export default function BookwormMode() {
    const navigate = useNavigate()
    const [file, setFile] = useState<File | null>(null)
    const [questionCount, setQuestionCount] = useState(10)
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [isProcessing, setIsProcessing] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleGenerate = async () => {
        if (!file) {
            alert('Please upload a file')
            return
        }

        setIsProcessing(true)

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${fileName}`

            // Ensure bucket exists (or use 'documents' or 'uploads')
            // Note: Bucket must be public or signed URLs used. Assuming 'documents' bucket.
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath)

            // 2. Create room
            const { roomId } = await createRoom(
                (await supabase.auth.getUser()).data.user?.id || '',
                'bookworm',
                { questionCount }
            )

            // 3. Call Edge Function
            const { data, error } = await supabase.functions.invoke('process-bookworm', {
                body: {
                    fileUrl: publicUrl,
                    questionCount,
                    difficulty // Pass difficulty to backend
                }
            })

            if (error) throw error

            if (!data.success) {
                throw new Error(data.error || 'Failed to process document')
            }

            // 4. Save questions
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

            navigate(`/quiz/${roomId}`)

        } catch (error: any) {
            console.error('Failed to process file:', error)

            let errorMessage = error.message
            if (error && typeof error === 'object' && 'context' in error) {
                // Try to extract response body from Supabase error context if available
                // This is often where the actual "GEMINI_API_KEY missing" message hides
                errorMessage += " (Check console for details)"
            }

            // alert('Server Error: The AI service crashed. This almost always means the API Keys are missing in Supabase.\n\nPlease check the instructions I just sent.')
            alert(`SERVER ERROR (Debug): ${errorMessage}\n\nPlease take a screenshot of this.`)
        }

        setIsProcessing(false)
    }


    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden font-display">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-bg-tertiary/20 rounded-full blur-[100px] pointer-events-none" />

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
                        <h1 className="text-3xl font-bold text-white">The Bookworm</h1>
                        <p className="text-text-secondary text-sm">Convert notes to quizzes instantly</p>
                    </div>
                </div>

                {/* File Upload Area */}
                <div
                    className={`mb-8 border-3 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer relative overflow-hidden group ${isDragOver ? 'border-accent-primary bg-accent-primary/5' : 'border-glass-border hover:border-text-secondary bg-bg-secondary/30'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        {file ? (
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-accent-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent-primary">
                                    <FileText size={40} />
                                </div>
                                <div className="font-bold text-xl text-white mb-1">{file.name}</div>
                                <div className="text-sm text-text-secondary">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                                <div className="mt-4 text-xs text-accent-primary bg-accent-primary/10 px-3 py-1 rounded-full inline-block">
                                    Ready to process
                                </div>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-secondary group-hover:scale-110 transition-transform duration-300">
                                    <Upload size={40} />
                                </div>
                                <div className="font-bold text-xl text-white mb-2 group-hover:text-accent-primary transition-colors">
                                    Click or Drag File
                                </div>
                                <div className="text-sm text-text-secondary">
                                    Supports PDF, JPG, PNG (Max 6MB)
                                </div>
                            </div>
                        )}
                    </label>
                </div>

                {/* Question Count Slider */}
                <div className="mb-8 p-6 bg-bg-secondary/50 rounded-3xl border border-glass-border">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-white uppercase tracking-wider">
                            Question Count
                        </label>
                        <span className="text-2xl font-bold text-accent-primary">
                            {questionCount}
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
                        <span>5 Questions</span>
                        <span>20 Questions</span>
                    </div>
                </div>

                {/* Difficulty Selector */}
                <div className="mb-8 p-6 bg-bg-secondary/50 rounded-3xl border border-glass-border">
                    <label className="text-sm font-bold text-white uppercase tracking-wider mb-4 block">
                        Difficulty
                    </label>
                    <div className="flex gap-4">
                        {(['easy', 'medium', 'hard'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setDifficulty(level)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold capitalize transition-all ${difficulty === level
                                        ? 'bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/20 scale-105'
                                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary hover:text-white'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!file || isProcessing}
                    className="btn-primary w-full py-4 text-lg shadow-lg shadow-accent-primary/20"
                >
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-3">
                            <Loader2 className="animate-spin" size={24} />
                            Analyzing Document...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            Generate Quiz <ArrowRight size={20} />
                        </span>
                    )}
                </button>
            </motion.div>
        </div>
    )
}
