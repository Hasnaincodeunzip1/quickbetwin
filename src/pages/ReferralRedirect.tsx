 import { useEffect } from 'react';
 import { useParams, useNavigate } from 'react-router-dom';
 import { Loader2 } from 'lucide-react';
 
 export default function ReferralRedirect() {
   const { code } = useParams<{ code: string }>();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (code) {
       // Store the referral code in localStorage for use during signup
       localStorage.setItem('referral_code', code.toUpperCase());
     }
     // Redirect to auth page for signup
     navigate('/auth', { replace: true });
   }, [code, navigate]);
 
   return (
     <div className="min-h-screen bg-background flex items-center justify-center">
       <div className="text-center">
         <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
         <p className="text-muted-foreground">Applying referral code...</p>
       </div>
     </div>
   );
 }