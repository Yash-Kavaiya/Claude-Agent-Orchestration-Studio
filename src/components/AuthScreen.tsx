import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Shield, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

export function AuthScreen() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const { sendOTP, verifyOTP, isLoading, error, clearError } = useAuthStore()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    
    try {
      await sendOTP(email.trim())
      setStep('otp')
    } catch (error) {
      // Error is handled in store
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) return
    
    try {
      await verifyOTP(email, otp.trim())
      // Auth store will handle success state
    } catch (error) {
      // Error is handled in store
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    clearError()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Claude Agent Platform</h1>
            <p className="text-muted-foreground mt-2">
              Build, deploy, and orchestrate AI agents with visual workflows
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2">
              {step === 'email' ? (
                <>
                  <Mail className="w-5 h-5 text-primary" />
                  Welcome Back
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 text-primary" />
                  Verify Code
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 'email' 
                ? 'Enter your email to receive a verification code'
                : `We sent a code to ${email}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'email' ? (
              <form key="email" onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-11" 
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            ) : (
              <form key="otp" onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={isLoading}
                    className="h-11 text-center text-lg tracking-widest"
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full h-11" 
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Change Email
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>🚀 Visual Workflow Builder • 🤖 Claude Agent SDK • 🔗 MCP Integration</p>
          <p className="text-xs">Secure email OTP authentication • No passwords required</p>
        </div>
      </div>
    </div>
  )
}