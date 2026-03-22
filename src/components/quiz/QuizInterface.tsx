import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DifficultyScaler } from '@/services/difficultyScaler'
import { HintButton } from './HintButton'
import { ExplanationPanel } from './ExplanationPanel'
import { supabase, Question } from '@/lib/supabase'
import { Clock, Trophy, X } from 'lucide-react'

interface QuizInterfaceProps {
    roomId: string
    userId: string
    playerSessionId: string
    questions: Question[]
    onQuizComplete: () => void
}

/**
 * Main Quiz Interface Component
 * Integrates difficulty scaling, hints, explanations, and scoring
 */
export function QuizInterface({
    roomId,
    userId,
    playerSessionId,
    questions,
    onQuizComplete
}: QuizInterfaceProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
    const [showExplanation, setShowExplanation] = useState(false)
    const [score, setScore] = useState(0)
    const [hintsUsed, setHintsUsed] = useState<string[]>([])
    const [difficultyScaler] = useState(() => new DifficultyScaler())
    const [timeLeft, setTimeLeft] = useState(30) // 30 seconds per question
    const navigate = useNavigate()

    const currentQuestion = questions[currentQuestionIndex]
    const isLastQuestion = currentQuestionIndex === questions.length - 1

    const handleExit = () => {
        if (window.confirm('Are you sure you want to quit the quiz? Progress will be lost.')) {
            navigate('/')
        }
    }

    // Timer countdown
    useEffect(() => {
        if (showExplanation || timeLeft === 0) return

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleTimeout()
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [timeLeft, showExplanation])

    // ... (rest of methods)

    const handleTimeout = () => {
        // Auto-submit with no answer
        handleAnswer(-1) // -1 indicates timeout
    }

    const handleAnswer = async (answerIndex: number) => {
        if (selectedAnswer !== null || showExplanation) return

        setSelectedAnswer(answerIndex)
        const isCorrect = answerIndex === currentQuestion.correct_answer

        // Calculate points (bonus for speed and no hints)
        const timeBonus = Math.floor((timeLeft / 30) * 50)
        const hintPenalty = hintsUsed.includes(currentQuestion.id) ? 25 : 0
        const basePoints = isCorrect ? 100 : 0
        const points = Math.max(0, basePoints + timeBonus - hintPenalty)

        if (isCorrect) {
            setScore(prev => prev + points)
        }

        // Update difficulty scaler
        const scaled = difficultyScaler.updatePerformance(isCorrect, currentQuestion.id)

        // Update player session in database
        await supabase
            .from('player_sessions')
            .update({
                score: score + (isCorrect ? points : 0),
                current_question_index: currentQuestionIndex + 1,
                current_difficulty: difficultyScaler.getCurrentDifficulty(),
                correct_streak: difficultyScaler.getConsecutiveCorrect(),
                answers: [
                    ...difficultyScaler.getAnsweredQuestions().map(qId => ({
                        question_id: qId,
                        selected_answer: answerIndex,
                        is_correct: isCorrect,
                        time_taken: 30 - timeLeft
                    }))
                ]
            })
            .eq('id', playerSessionId)

        // Log difficulty scaling event if it occurred
        if (scaled) {
            await supabase
                .from('difficulty_scaling_events')
                .insert({
                    user_id: userId,
                    room_id: roomId,
                    old_difficulty: difficultyScaler.getCurrentDifficulty() - 1,
                    new_difficulty: difficultyScaler.getCurrentDifficulty(),
                    trigger: 'consecutive_correct_3'
                })
        }

        setShowExplanation(true)
    }

    const handleNext = async () => {
        if (isLastQuestion) {
            console.log('Attempting to complete quiz with Session ID:', playerSessionId)

            // Mark quiz as complete and check for returned data to verify update
            const { data, error } = await supabase
                .from('player_sessions')
                .update({
                    finished_at: new Date().toISOString(),
                    score: score // Force final score update just in case
                })
                .eq('id', playerSessionId)
                .select() // Return the updated row

            if (error) {
                console.error('Error marking quiz as finished:', error)
                alert(`Error saving result: ${error.message}. Please verify your connection.`)
            } else if (!data || data.length === 0) {
                // This means the update succeeded but 0 rows were affected (Silent Failure)
                console.error('Quiz completion update affected 0 rows. Possible RLS or ID mismatch.', { playerSessionId })
                alert('Connection Error: Your session could not be verified. The result might not be saved. (Error: Session ID mismatch)')
                // We still let them proceed to results, but warn them.
                onQuizComplete()
            } else {
                console.log('Quiz marked as finished successfully', data)
                onQuizComplete()
            }
        } else {
            setCurrentQuestionIndex(prev => prev + 1)
            setSelectedAnswer(null)
            setShowExplanation(false)
            setTimeLeft(30)
        }
    }

    const handleHintUsed = () => {
        setHintsUsed(prev => [...prev, currentQuestion.id])
    }

    if (!currentQuestion) {
        return <div className="text-center text-text-secondary">Loading question...</div>
    }

    return (
        <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 md:p-6 font-display overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-accent-primary/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-bg-tertiary/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-[1600px] relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 bg-bg-tertiary/60 backdrop-blur-md p-6 rounded-3xl mx-2 border border-glass-border">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleExit}
                            className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-white hover:text-error"
                            title="Exit Quiz"
                        >
                            <X size={32} />
                        </button>
                        <div className="text-text-secondary text-xl font-bold uppercase tracking-wider">
                            Question {currentQuestionIndex + 1} <span className="text-text-tertiary">/ {questions.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 bg-bg-secondary px-6 py-3 rounded-2xl border border-glass-border">
                            <Trophy className="text-accent-primary" size={24} />
                            <span className="text-white font-bold text-xl">{score}</span>
                        </div>
                        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border border-glass-border transition-colors ${timeLeft <= 5 ? 'bg-error/20 border-error/50 text-error animate-pulse' : 'bg-bg-secondary text-white'}`}>
                            <Clock size={24} />
                            <span className="font-mono font-bold text-xl w-8">{timeLeft}</span>
                        </div>
                    </div>
                </div>

                {/* Question Card - MASSIVE DARK GLASS CARD */}
                <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-bg-tertiary/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] mb-4 relative overflow-hidden shadow-2xl min-h-[400px] flex flex-col justify-center border border-glass-border"
                >
                    {/* Image Background Overlay (Subtle) */}
                    {currentQuestion.background_image_url && (
                        <div
                            className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
                            style={{
                                backgroundImage: `url(${currentQuestion.background_image_url})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                    )}

                    <div className="max-w-6xl mx-auto w-full relative z-10">
                        <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-white leading-tight drop-shadow-lg">
                            {currentQuestion.question_text}
                        </h2>

                        {/* Answer Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence mode='wait'>
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = selectedAnswer === index;
                                    const isCorrect = index === currentQuestion.correct_answer;
                                    const showResult = showExplanation;

                                    let statusClass = 'border-glass-border bg-bg-secondary/50 hover:bg-bg-secondary hover:border-accent-primary/50 text-text-primary hover:shadow-[0_0_15px_rgba(227,255,204,0.1)]';
                                    if (showResult) {
                                        if (isCorrect) statusClass = 'border-success bg-success/20 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]';
                                        else if (isSelected) statusClass = 'border-error bg-error/20 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]';
                                        else statusClass = 'border-glass-border opacity-30';
                                    } else if (isSelected) {
                                        statusClass = 'border-accent-primary bg-accent-primary/20 text-accent-primary shadow-[0_0_15px_rgba(227,255,204,0.2)]';
                                    }

                                    return (
                                        <motion.button
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={!showExplanation ? { scale: 1.01, translateY: -2 } : {}}
                                            whileTap={!showExplanation ? { scale: 0.99 } : {}}
                                            onClick={() => handleAnswer(index)}
                                            disabled={showExplanation}
                                            className={`
                                                p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group shadow-lg
                                                ${statusClass}
                                                ${showExplanation ? 'cursor-default' : 'cursor-pointer'}
                                            `}
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`
                                                    w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border-2
                                                    ${showResult && isCorrect ? 'bg-success text-bg-primary border-success' :
                                                        showResult && isSelected && !isCorrect ? 'bg-error text-white border-error' :
                                                            'bg-bg-tertiary border-glass-border text-text-secondary group-hover:border-accent-primary group-hover:text-accent-primary'}
                                                `}>
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <span className="font-bold text-lg">{option}</span>
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center px-2">
                    {!showExplanation && (
                        <HintButton
                            questionId={currentQuestion.id}
                            hint={currentQuestion.hint}
                            onHintUsed={handleHintUsed}
                        />
                    )}
                </div>

                {/* Explanation Modal */}
                <AnimatePresence>
                    {showExplanation && (
                        <ExplanationPanel
                            isCorrect={selectedAnswer === currentQuestion.correct_answer}
                            correctAnswer={currentQuestion.options[currentQuestion.correct_answer]}
                            userAnswer={selectedAnswer !== null ? currentQuestion.options[selectedAnswer] : 'No answer'}
                            explanation={currentQuestion.explanation}
                            points={selectedAnswer === currentQuestion.correct_answer ? 100 : 0}
                            onNext={handleNext}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
