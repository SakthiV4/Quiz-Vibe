import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    to?: string // Optional specific route
    label?: string
}

export function BackButton({ to, label = 'Back' }: BackButtonProps) {
    const navigate = useNavigate()

    const handleBack = () => {
        if (to) {
            navigate(to)
        } else {
            navigate(-1) // Go back to previous page
        }
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02, x: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 bg-bg-secondary border border-glass-border rounded-xl text-text-secondary font-medium hover:bg-bg-tertiary hover:text-white transition-all mb-4 group"
        >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            {label}
        </motion.button>
    )
}
