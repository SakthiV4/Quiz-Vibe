import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
// Force Update
import { supabase } from './lib/supabase'
import HomePage from './pages/HomePage'
import BookwormMode from './pages/BookwormMode'
import CreatorMode from './pages/CreatorMode'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import WaitingRoom from './pages/WaitingRoom'
import QuizPage from './pages/QuizPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import { Login } from './pages/Login'
import { ResetPassword } from './pages/ResetPassword'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check current session
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Auto-sync profile if missing (Self-healing)
                const { data: profile } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle()

                if (!profile) {
                    console.log('🔧 Auto-creating missing profile for', user.email)
                    await supabase.from('users').insert({
                        id: user.id,
                        email: user.email!,
                        username: user.user_metadata?.username || `user_${user.id.substring(0, 4)}`,
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                    })
                }

                setUser(user)
            }
            setLoading(false)
        }

        checkUser()

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-primary flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-primary"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <div className="min-h-screen bg-bg-primary">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/reset-password" element={<ResetPassword />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        } />

                        <Route path="/bookworm" element={
                            <ProtectedRoute>
                                <BookwormMode />
                            </ProtectedRoute>
                        } />

                        <Route path="/creator" element={
                            <ProtectedRoute>
                                <CreatorMode />
                            </ProtectedRoute>
                        } />

                        <Route path="/create-room" element={
                            <ProtectedRoute>
                                <CreateRoom />
                            </ProtectedRoute>
                        } />

                        <Route path="/join-room" element={
                            <ProtectedRoute>
                                <JoinRoom />
                            </ProtectedRoute>
                        } />

                        <Route path="/waiting/:roomId" element={
                            <ProtectedRoute>
                                <WaitingRoom />
                            </ProtectedRoute>
                        } />

                        <Route path="/quiz/:roomId" element={
                            <ProtectedRoute>
                                <QuizPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/results/:roomId" element={
                            <ProtectedRoute>
                                <ResultsPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/history" element={
                            <ProtectedRoute>
                                <HistoryPage />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </Router>
        </QueryClientProvider>
    )
}

export default App
