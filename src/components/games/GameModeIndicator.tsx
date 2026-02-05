 import { useState, useEffect } from 'react';
 import { Bot, Hand } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { useAuth } from '@/contexts/AuthContext';
 import { supabase } from '@/integrations/supabase/client';
 
 export function GameModeIndicator() {
   const { isAdmin } = useAuth();
   const [isAutoMode, setIsAutoMode] = useState(true);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     if (!isAdmin) return;
 
     const fetchMode = async () => {
       try {
         const { data } = await supabase
           .from('app_settings')
           .select('value')
           .eq('key', 'auto_game_controller')
           .single();
         
         const enabled = (data?.value as { enabled?: boolean })?.enabled ?? true;
         setIsAutoMode(enabled);
       } catch {
         // Default to auto
       } finally {
         setIsLoading(false);
       }
     };
 
     fetchMode();
 
     // Subscribe to changes
     const channel = supabase
       .channel('game-mode-indicator')
       .on(
         'postgres_changes',
         {
           event: 'UPDATE',
           schema: 'public',
           table: 'app_settings',
           filter: 'key=eq.auto_game_controller'
         },
         (payload) => {
           const newValue = (payload.new as { value?: { enabled?: boolean } })?.value;
           setIsAutoMode(newValue?.enabled ?? true);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [isAdmin]);
 
   // Only show to admins
   if (!isAdmin || isLoading) return null;
 
   return (
     <Badge 
       variant="outline" 
       className={`flex items-center gap-1.5 text-xs font-medium ${
         isAutoMode 
           ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
           : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
       }`}
     >
       {isAutoMode ? (
         <>
           <Bot className="w-3 h-3" />
           Auto
         </>
       ) : (
         <>
           <Hand className="w-3 h-3" />
           Manual
         </>
       )}
     </Badge>
   );
 }