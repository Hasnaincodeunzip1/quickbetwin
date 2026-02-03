import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, ArrowRight, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhoneAuthFormProps {
  mode: 'login' | 'signup';
  onBack?: () => void;
}

export function PhoneAuthForm({ mode, onBack }: PhoneAuthFormProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  // Convert phone to email format for Supabase auth
  const phoneToEmail = (phoneNumber: string): string => {
    const digits = phoneNumber.replace(/\D/g, '');
    return `${digits}@phone.genxwin.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    if (!password || password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const email = phoneToEmail(phone);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || 'Player',
              phone: `+91${phone}`
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account Exists",
              description: "This phone number is already registered. Please login instead.",
              variant: "destructive"
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Account Created!",
          description: "Your account has been created successfully."
        });
        navigate('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login Failed",
              description: "Invalid phone number or password.",
              variant: "destructive"
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Welcome Back!",
          description: "You've successfully logged in."
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="phone-name">Display Name (optional)</Label>
          <Input
            id="phone-name"
            type="text"
            placeholder="Lucky Player"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone-number">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone-number"
            type="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="pl-10 bg-secondary border-border"
            required
            maxLength={10}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="phone-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-secondary border-border"
            required
            minLength={6}
          />
        </div>
      </div>

      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="phone-confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone-confirm-password"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 bg-secondary border-border"
              required
              minLength={6}
            />
          </div>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
        disabled={loading || phone.length !== 10 || password.length < 6}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {mode === 'signup' ? 'Create Account' : 'Login'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {onBack && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={onBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Email
        </Button>
      )}
    </form>
  );
}
