import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PhoneAuthFormProps {
  mode: 'login' | 'signup';
  onBack?: () => void;
}

export function PhoneAuthForm({ mode, onBack }: PhoneAuthFormProps) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const formatPhoneNumber = (input: string): string => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // If it starts with country code, keep it; otherwise add +91 for India
    if (digits.startsWith('91') && digits.length > 10) {
      return '+' + digits;
    } else if (digits.length === 10) {
      return '+91' + digits;
    }
    return '+' + digits;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: mode === 'signup' ? { name: name || 'Player' } : undefined
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "OTP Sent!",
        description: `We've sent a verification code to ${formattedPhone}`
      });
      setStep('otp');
    } catch (error: any) {
      console.error('OTP send error:', error);
      toast({
        title: "Failed to Send OTP",
        description: error.message || "Could not send verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      toast({
        title: mode === 'signup' ? "Account Created!" : "Welcome Back!",
        description: mode === 'signup' 
          ? "Your account has been created successfully."
          : "You've successfully logged in."
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('OTP verify error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });

      if (error) throw error;

      toast({
        title: "OTP Resent!",
        description: `A new verification code has been sent to ${formattedPhone}`
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not resend OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to<br />
            <strong className="text-foreground">{formatPhoneNumber(phone)}</strong>
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Verify & Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        <div className="flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => setStep('phone')}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Change Number
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="text-primary hover:underline"
          >
            Resend OTP
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="space-y-4">
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
        <p className="text-xs text-muted-foreground">
          We'll send you a 6-digit verification code
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
        disabled={loading || phone.length !== 10}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            Send OTP
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
