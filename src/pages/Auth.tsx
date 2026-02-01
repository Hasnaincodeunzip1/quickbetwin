import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User, ArrowLeft, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm';

export default function Auth() {
  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useAuth();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ 
        title: "Missing Fields", 
        description: "Please enter both email and password.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    
    const result = await login(email, password);
    
    setLoading(false);
    
    if (result.success) {
      toast({ title: "Welcome back!", description: "You've successfully logged in." });
      navigate('/dashboard');
    } else {
      toast({ 
        title: "Login Failed", 
        description: result.error || "Invalid email or password.", 
        variant: "destructive" 
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ 
        title: "Missing Fields", 
        description: "Please enter email and password.", 
        variant: "destructive" 
      });
      return;
    }

    if (password.length < 6) {
      toast({ 
        title: "Weak Password", 
        description: "Password must be at least 6 characters.", 
        variant: "destructive" 
      });
      return;
    }
    
    setLoading(true);
    
    const result = await signup(email, password, name);
    
    setLoading(false);
    
    if (result.success) {
      toast({ 
        title: "Account Created!", 
        description: "Welcome to ColorWin! You're now logged in." 
      });
      navigate('/dashboard');
    } else {
      // Provide more helpful error messages
      let errorMessage = result.error || "Could not create account.";
      if (result.error?.includes("already registered")) {
        errorMessage = "This email is already registered. Please login instead.";
        setAuthMode('login');
      }
      toast({ 
        title: "Signup Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Missing Email",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Check Your Email",
        description: "We've sent you a password reset link."
      });
    }
  };

  const renderEmailLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-secondary border-border"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 bg-secondary border-border"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={() => setAuthMode('forgot')}
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );

  const renderEmailSignupForm = () => (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Display Name (optional)</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-name"
            type="text"
            placeholder="Lucky Player"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-secondary border-border"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10 bg-secondary border-border"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-game-red">Color</span>
            <span className="text-game-green">Win</span>
          </h1>
          <p className="text-muted-foreground">Predict. Play. Prosper.</p>
        </div>

        <Card className="game-card border-0">
          <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">
            {authMode === 'login' ? 'Welcome Back' : authMode === 'signup' ? 'Create Account' : 'Reset Password'}
          </CardTitle>
          <CardDescription>
            {authMode === 'login' 
              ? 'Sign in to continue playing' 
              : authMode === 'signup'
              ? 'Join thousands of winners today'
              : 'Enter your email to reset your password'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {authMode === 'forgot' ? (
            resetEmailSent ? (
              <div className="text-center py-6">
                <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Check Your Email</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAuthMode('login');
                    setResetEmailSent(false);
                  }}
                  className="mt-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-secondary border-border"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setAuthMode('login')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </form>
            )
          ) : (
            <>
            {/* Auth Mode Tabs */}
            <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'login' | 'signup' | 'forgot')}>
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Auth Method Toggle */}
              <div className="flex justify-center gap-2 mt-4 mb-2">
                <Button
                  type="button"
                  variant={authMethod === 'email' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAuthMethod('email')}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={authMethod === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAuthMethod('phone')}
                  className="flex-1"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </Button>
              </div>

              <TabsContent value="login" className="mt-4">
                {authMethod === 'email' ? (
                  renderEmailLoginForm()
                ) : (
                  <PhoneAuthForm mode="login" />
                )}
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                {authMethod === 'email' ? (
                  renderEmailSignupForm()
                ) : (
                  <PhoneAuthForm mode="signup" />
                )}
              </TabsContent>
            </Tabs>

            {/* Info text */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </>
          )}
          </CardContent>
        </Card>

        {/* Back to home */}
        <p className="text-center mt-6 text-muted-foreground text-sm">
          <button 
            onClick={() => navigate('/')} 
            className="hover:text-primary transition-colors"
          >
            ← Back to Home
          </button>
        </p>
      </motion.div>
    </div>
  );
}
