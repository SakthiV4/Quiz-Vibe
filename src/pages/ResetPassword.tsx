import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

export function ResetPassword() {
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        // Check if user has a valid session from the reset link
        supabase.auth.onAuthStateChange((_event, _session) => {
            if (_event === 'PASSWORD_RECOVERY') {
                // User clicked the reset link and is authenticated
                console.log('Password recovery session detected')
            }
        })
    }, [])

    async function handleResetPassword() {
        try {
            setLoading(true)
            setError(null)

            // Validation
            if (!password || !confirmPassword) {
                throw new Error('Please fill in all fields')
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters')
            }

            if (password !== confirmPassword) {
                throw new Error('Passwords do not match')
            }

            // Update password
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setSuccess(true)

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login')
            }, 2000)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative overflow-hidden font-display">
            {/* Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-accent-primary/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-bg-tertiary/20 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="bg-bg-secondary/80 backdrop-blur-xl border border-glass-border rounded-3xl p-10 shadow-2xl">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Reset Password
                        </h2>
                        <p className="text-text-secondary">
                            Enter your new password below.
                        </p>
                    </div>

                    {!success ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary ml-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-4 text-text-secondary" size={20} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-bg-primary border border-glass-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-primary outline-none transition-all placeholder:text-text-secondary/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-text-secondary ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-4 text-text-secondary" size={20} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-bg-primary border border-glass-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-primary outline-none transition-all placeholder:text-text-secondary/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-2">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleResetPassword}
                                disabled={loading}
                                className="w-full bg-accent-primary text-bg-primary font-bold py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 mt-6 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Reset Password'}
                                {!loading && <ArrowRight size={20} />}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="text-accent-primary" size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                            <p className="text-text-secondary">
                                Redirecting to login...
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
