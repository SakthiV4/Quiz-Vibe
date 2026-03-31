import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Sparkles } from 'lucide-react'

interface HintButtonProps {
    questionId: string
    hint: string
    onHintUsed: () => void
}

/**
 * Socratic Hint Component
 * Displays AI-generated hints that guide without revealing the answer
 */
export function HintButton({ questionId, hint, onHintUsed }: HintButtonProps) {
    const [showHint, setShowHint] = useState(false)

    const handleHintClick = () => {
        setShowHint(true)
        onHintUsed()

        // Track hint usage analytics
        console.log('Hint used for question:', questionId)
    }

    return (
        <div className="w-full">
            {!showHint ? (
                <button
                    onClick={handleHintClick}
                    className="flex items-center gap-2 text-sm font-bold text-accent-primary hover:text-white transition-colors py-2 px-4 rounded-full border border-accent-primary/20 hover:bg-accent-primary/10"
                >
                    <Lightbulb size={16} />
                    Need a Hint?
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className="bg-accent-primary/10 border border-accent-primary/20 rounded-2xl p-4 w-full"
                >
                    <div className="flex items-center gap-2 mb-2 text-accent-primary font-bold text-sm uppercase tracking-wider">
                        <Sparkles size={14} />
                        <span>Socratic Hint</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed italic">
                        "{hint}"
                    </p>
                </motion.div>
            )}
        </div>
    )
}
