import { motion } from 'framer-motion';
import { Clock, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WaitingForRoundProps {
  gameName: string;
}

export function WaitingForRound({ gameName }: WaitingForRoundProps) {
  return (
    <Card className="game-card overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-transparent to-muted/50" />
      <CardContent className="relative pt-8 pb-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary/30 border-t-primary flex items-center justify-center"
        >
          <Clock className="w-6 h-6 text-primary" />
        </motion.div>
        <h3 className="text-xl font-bold mb-2">Waiting for Next Round</h3>
        <p className="text-muted-foreground text-sm mb-4">
          The admin will start a new {gameName} round soon.
        </p>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Please wait...</span>
        </div>
      </CardContent>
    </Card>
  );
}
