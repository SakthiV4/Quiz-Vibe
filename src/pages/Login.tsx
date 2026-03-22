import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { User, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'

export function Login() {
    const navigate = useNavigate()
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showForgotPassword, setShowForgotPassword] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetSuccess, setResetSuccess] = useState(false)

    useEffect(() => {
        checkUser()
    }, [])

    async function checkUser() {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) navigate('/')
    }

    async function handleAuth() {
        try {
            setLoading(true)
            setError(null)

            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
                navigate('/')
            } else {
                if (!username) throw new Error('Username is required')

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { username } }
                })

                if (signUpError) throw signUpError

                // Check if session is established (if confirm email is off)
                if (data.session && data.user) {
                    await createUserProfile(data.user.id, email, username)
                    navigate('/')
                } else if (data.user && !data.session) {
                    // User created but needs email confirmation
                    setError('Please check your email to confirm your account.')
                    setLoading(false)
                    return
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            if (!error) setLoading(false)
        }
    }

    async function createUserProfile(userId: string, email: string, username: string) {
        // Note: we do NOT pass `top` — DiceBear determines hair from seed, avoiding 400 errors
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&accessoriesProbability=0`

        const { error } = await supabase.from('users').insert({
            id: userId,
            email: email,
            username: username,
            avatar_url: avatarUrl
        })
        if (error) console.error('Error creating profile:', error)
    }

    async function handlePasswordReset() {
        try {
            setLoading(true)
            setError(null)
            setResetSuccess(false)

            if (!resetEmail) {
                throw new Error('Please enter your email address')
            }

            console.log('Attempting password reset for:', resetEmail)

            const { data, error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/reset-password`
            })

            console.log('Reset password response:', { data, error })

            if (error) {
                console.error('Password reset error:', error)
                throw new Error(`Failed to send reset email: ${error.message}`)
            }

            setResetSuccess(true)
            setError(null)
            console.log('Password reset email sent successfully')
        } catch (err: any) {
            console.error('Password reset exception:', err)
            setError(err.message)
            setResetSuccess(false)
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
                className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10"
            >
                {/* Left Side - Brand */}
                <div className="hidden lg:block">
                    <h1 className="text-5xl font-bold text-white mb-4 leading-tight tracking-tight">
                        Master Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-white">
                            Knowledge.
                        </span>
                    </h1>
                    <p className="text-text-secondary text-base mb-8 max-w-xl leading-relaxed">
                        Join the platform where AI meets education. Create, compete, and learn with advanced quiz generation.
                    </p>

                    <div className="flex gap-4">
                        <div className="bg-bg-tertiary/50 backdrop-blur-md p-4 rounded-xl border border-glass-border min-w-[140px]">
                            <div className="text-accent-primary text-3xl font-bold mb-1">100+</div>
                            <div className="text-text-secondary text-sm">Active Rooms</div>
                        </div>
                        <div className="bg-bg-tertiary/50 backdrop-blur-md p-4 rounded-xl border border-glass-border min-w-[140px]">
                            <div className="text-white text-3xl font-bold mb-1">AI</div>
                            <div className="text-text-secondary text-sm">Powered</div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="bg-bg-secondary/80 backdrop-blur-xl border border-glass-border rounded-2xl p-8 shadow-2xl">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isLogin ? 'Welcome back' : 'Create account'}
                        </h2>
                        <p className="text-text-secondary text-sm">
                            Enter your details below to get started.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary ml-1">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 text-text-secondary" size={18} />
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full bg-bg-primary border border-glass-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-accent-primary outline-none transition-all placeholder:text-text-secondary/50"
                                            placeholder="johndoe"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-text-secondary ml-1">Gender (for avatar)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setGender('male')}
                                            className={`py-3 rounded-xl border border-glass-border font-medium text-sm transition-all ${gender === 'male'
                                                ? 'bg-accent-primary text-bg-primary font-bold shadow-lg shadow-accent-primary/20'
                                                : 'bg-bg-primary text-text-secondary hover:bg-bg-tertiary'
                                                }`}
                                        >
                                            👨 Male
                                        </button>
                                        <button
                                            onClick={() => setGender('female')}
                                            className={`py-3 rounded-xl border border-glass-border font-medium text-sm transition-all ${gender === 'female'
                                                ? 'bg-accent-primary text-bg-primary font-bold shadow-lg shadow-accent-primary/20'
                                                : 'bg-bg-primary text-text-secondary hover:bg-bg-tertiary'
                                                }`}
                                        >
                                            👩 Female
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-secondary ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-text-secondary" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-bg-primary border border-glass-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-accent-primary outline-none transition-all placeholder:text-text-secondary/50"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-secondary ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-text-secondary" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-bg-primary border border-glass-border rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-accent-primary outline-none transition-all placeholder:text-text-secondary/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowForgotPassword(true)}
                                    className="text-accent-primary hover:underline text-sm"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {resetSuccess && (
                            <div className="p-3 bg-accent-primary/10 border border-accent-primary/20 rounded-xl text-accent-primary text-sm flex items-center gap-2">
                                <AlertCircle size={18} />
                                Password reset email sent! Check your inbox.
                            </div>
                        )}

                        <button
                            onClick={handleAuth}
                            disabled={loading}
                            className="w-full bg-accent-primary text-bg-primary font-bold text-sm py-3 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 mt-6 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                            {!loading && <ArrowRight size={18} />}
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary text-sm">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-accent-primary font-bold hover:underline"
                            >
                                {isLogin ? 'Sign up' : 'Log in'}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-bg-secondary border border-glass-border rounded-3xl p-10 max-w-md w-full"
                    >
                        <h3 className="text-3xl font-bold text-white mb-4">Reset Password</h3>
                        <p className="text-text-secondary mb-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-text-secondary" size={20} />
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="w-full bg-bg-primary border border-glass-border rounded-xl py-4 pl-12 pr-4 text-white focus:border-accent-primary outline-none transition-all placeholder:text-text-secondary/50"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false)
                                        setResetEmail('')
                                        setError(null)
                                        setResetSuccess(false)
                                    }}
                                    className="flex-1 bg-bg-tertiary text-white font-bold py-4 rounded-xl hover:bg-bg-tertiary/80 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordReset}
                                    disabled={loading}
                                    className="flex-1 bg-accent-primary text-bg-primary font-bold py-4 rounded-xl hover:bg-white transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
