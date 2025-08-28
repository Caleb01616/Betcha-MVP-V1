'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, storeUser } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { user, error } = await loginUser(username, password)

    if (error) {
      setError(error)
    } else if (user) {
      // Store user session and redirect
      storeUser(user)
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-betcha-neutral-50 to-betcha-neutral-100 p-4">
      <Card className="w-full max-w-md betcha-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 betcha-gradient rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">B</span>
          </div>
          <CardTitle className="text-3xl font-bold text-betcha-neutral-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-betcha-neutral-600">
            Sign in to your Betcha account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg betcha-danger text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-betcha-neutral-700">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="betcha-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-betcha-neutral-700">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="betcha-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-betcha-neutral-400 hover:text-betcha-neutral-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full betcha-button-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-betcha-neutral-600">
                Don&apos;t have an account?{' '}
                <a
                  href="/register"
                  className="text-betcha-primary hover:text-betcha-primary-light font-medium"
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
