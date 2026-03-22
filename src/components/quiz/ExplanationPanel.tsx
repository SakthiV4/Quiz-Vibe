import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Bot, ArrowRight } from 'lucide-react'

interface ExplanationPanelProps {
    isCorrect: boolean
    correctAnswer: string
    userAnswer: string
    explanation: string
    points: number
    onNext: () => void
}

/**
 * AI Explanation Panel
 * Shows one-sentence AI-generated explanation after answering
 */
export function ExplanationPanel({
    isCorrect,
    correctAnswer,
    userAnswer: _userAnswer,
    explanation,
    points,
    onNext
}: ExplanationPanelProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`
                fixed inset-x-0 bottom-0 p-6 md:p-8 rounded-t-4xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-50
                ${isCorrect ? 'bg-success/10 backdrop-blur-xl border-t border-success/30' : 'bg-error/10 backdrop-blur-xl border-t border-error/30'}
            `}
        >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex-1">
                    {/* Result Header */}
                    <div className="flex items-center gap-3 mb-3">
                        {isCorrect ? (
                            <>
                                <CheckCircle className="text-success" size={28} />
                                <span className="text-2xl font-bold text-white">Correct!</span>
                                <span className="ml-3 bg-success/20 text-success px-3 py-1 rounded-full font-mono font-bold">+{points} pts</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="text-error" size={28} />
                                <span className="text-2xl font-bold text-white">Incorrect</span>
                            </>
                        )}
                    </div>

                    {/* Explanation */}
                    <div className="bg-bg-primary/60 rounded-2xl p-4 border border-glass-border">
                        <div className="flex items-start gap-3">
                            <div className="bg-accent-primary/20 p-1.5 rounded-lg mt-0.5">
                                <Bot className="text-accent-primary" size={18} />
                            </div>
                            <div>
                                {!isCorrect && (
                                    <div className="text-sm text-text-secondary mb-1">
                                        The answer was <span className="text-white font-bold">{correctAnswer}</span>.
                                    </div>
                                )}
                                <p className="text-white leading-relaxed">{explanation}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Next Button */}
                <button
                    onClick={onNext}
                    className="w-full md:w-auto px-8 py-4 bg-white text-bg-primary font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
                >
                    Next Question <ArrowRight size={20} />
                </button>
            </div>
        </motion.div>
    )
}
