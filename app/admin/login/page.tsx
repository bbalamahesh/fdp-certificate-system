'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SECURITY_QUESTIONS } from '@/lib/auth/securityQuestions'

type MessageType = 'error' | 'success' | ''

export default function AdminLogin() {
  const router = useRouter()
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
  })
  const [forgotData, setForgotData] = useState({
    username: '',
    securityQuestion: '',
    securityAnswer: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  function showError(text: string) {
    setMessageType('error')
    setMessage(text)
  }

  function showSuccess(text: string) {
    setMessageType('success')
    setMessage(text)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        showError(data.error || 'Invalid credentials')
        return
      }

      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminUsername', data.user.username)
      localStorage.setItem('adminRole', data.user.role)
      router.push('/admin/dashboard')
    } catch {
      showError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (registerData.password !== registerData.confirmPassword) {
      showError('Password and confirm password do not match.')
      setLoading(false)
      return
    }

    if (!registerData.securityQuestion) {
      showError('Please select a security question.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()
      if (!response.ok) {
        const firstFieldError =
          data?.details?.fieldErrors &&
          Object.values(data.details.fieldErrors).flat()[0]
        showError(firstFieldError || data.error || 'Registration failed')
        return
      }

      setLoginData({ username: registerData.username, password: registerData.password })
      setRegisterData({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        securityQuestion: '',
        securityAnswer: '',
      })
      showSuccess('Registration successful. Please login.')
    } catch {
      showError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function loadSecurityQuestion() {
    if (!forgotData.username.trim()) {
      showError('Enter username first to fetch security question.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/security-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotData.username }),
      })
      const data = await response.json()
      if (!response.ok) {
        showError(data.error || 'Failed to fetch security question')
        return
      }

      setForgotData((prev) => ({ ...prev, securityQuestion: data.securityQuestion || '' }))
      showSuccess('Security question loaded. Answer it to reset password.')
    } catch {
      showError('Failed to fetch security question')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!forgotData.securityQuestion) {
      showError('Load security question first.')
      setLoading(false)
      return
    }

    if (forgotData.newPassword !== forgotData.confirmPassword) {
      showError('New password and confirm password do not match.')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotData.username,
          securityAnswer: forgotData.securityAnswer,
          newPassword: forgotData.newPassword,
          confirmPassword: forgotData.confirmPassword,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        showError(data.error || 'Failed to reset password')
        return
      }

      showSuccess('Password reset successful. You can login now.')
      setLoginData({ username: forgotData.username, password: '' })
      setForgotData({
        username: '',
        securityQuestion: '',
        securityAnswer: '',
        newPassword: '',
        confirmPassword: '',
      })
      setForgotOpen(false)
    } catch {
      showError('Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>Login or register to create events</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <Label>Username</Label>
                  <Input
                    value={loginData.username}
                    onChange={(e) => setLoginData((p) => ({ ...p, username: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData((p) => ({ ...p, password: e.target.value }))}
                    required
                  />
                </div>
                <Button disabled={loading} className="w-full" type="submit">
                  {loading ? 'Please wait...' : 'Login'}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setForgotOpen((prev) => !prev)
                  setMessage('')
                }}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>

              {forgotOpen ? (
                <form onSubmit={handleResetPassword} className="mt-4 space-y-3 rounded-md border p-3">
                  <div>
                    <Label>Username</Label>
                    <Input
                      value={forgotData.username}
                      onChange={(e) =>
                        setForgotData((prev) => ({
                          ...prev,
                          username: e.target.value,
                          securityQuestion: '',
                        }))
                      }
                      required
                    />
                  </div>

                  <Button type="button" variant="outline" onClick={loadSecurityQuestion} disabled={loading}>
                    Load Security Question
                  </Button>

                  {forgotData.securityQuestion ? (
                    <>
                      <div>
                        <Label>Security Question</Label>
                        <Input value={forgotData.securityQuestion} disabled />
                      </div>
                      <div>
                        <Label>Security Answer</Label>
                        <Input
                          value={forgotData.securityAnswer}
                          onChange={(e) =>
                            setForgotData((prev) => ({ ...prev, securityAnswer: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={forgotData.newPassword}
                          onChange={(e) =>
                            setForgotData((prev) => ({ ...prev, newPassword: e.target.value }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={forgotData.confirmPassword}
                          onChange={(e) =>
                            setForgotData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                          }
                          required
                        />
                      </div>

                      <Button disabled={loading} className="w-full" type="submit">
                        {loading ? 'Please wait...' : 'Reset Password'}
                      </Button>
                    </>
                  ) : null}
                </form>
              ) : null}
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={registerData.firstName}
                      onChange={(e) =>
                        setRegisterData((p) => ({ ...p, firstName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={registerData.lastName}
                      onChange={(e) =>
                        setRegisterData((p) => ({ ...p, lastName: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Username</Label>
                  <Input
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, username: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, password: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Security Question</Label>
                  <Select
                    value={registerData.securityQuestion}
                    onValueChange={(value) =>
                      setRegisterData((p) => ({ ...p, securityQuestion: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a security question" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECURITY_QUESTIONS.map((question) => (
                        <SelectItem key={question} value={question}>
                          {question}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Security Answer</Label>
                  <Input
                    value={registerData.securityAnswer}
                    onChange={(e) =>
                      setRegisterData((p) => ({ ...p, securityAnswer: e.target.value }))
                    }
                    required
                  />
                </div>

                <Button disabled={loading} className="w-full" type="submit">
                  {loading ? 'Please wait...' : 'Register as Admin'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {message ? (
            <Alert className="mt-4" variant={messageType === 'success' ? 'default' : 'destructive'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
