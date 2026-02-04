import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All game types
const GAME_TYPES = ['color', 'parity', 'bigsmall', 'dice', 'number', 'spin'];

// All duration categories in seconds (1, 3, 5 minutes only)
const DURATION_CATEGORIES = [60, 180, 300]; // 1, 3, 5 minutes

// Game configuration with multipliers for profit calculation
const GAME_CONFIG: Record<string, { 
  options: { value: string; multiplier: number }[] 
}> = {
  color: {
    options: [
      { value: "red", multiplier: 2 },
      { value: "green", multiplier: 2 },
      { value: "violet", multiplier: 5 },
    ],
  },
  parity: {
    options: [
      { value: "odd", multiplier: 2 },
      { value: "even", multiplier: 2 },
    ],
  },
  bigsmall: {
    options: [
      { value: "big", multiplier: 2 },
      { value: "small", multiplier: 2 },
    ],
  },
  dice: {
    options: [
      { value: "1", multiplier: 6 },
      { value: "2", multiplier: 6 },
      { value: "3", multiplier: 6 },
      { value: "4", multiplier: 6 },
      { value: "5", multiplier: 6 },
      { value: "6", multiplier: 6 },
    ],
  },
  number: {
    options: [
      { value: "0", multiplier: 10 },
      { value: "1", multiplier: 10 },
      { value: "2", multiplier: 10 },
      { value: "3", multiplier: 10 },
      { value: "4", multiplier: 10 },
      { value: "5", multiplier: 10 },
      { value: "6", multiplier: 10 },
      { value: "7", multiplier: 10 },
      { value: "8", multiplier: 10 },
      { value: "9", multiplier: 10 },
    ],
  },
  spin: {
    options: [
      { value: "2x", multiplier: 2 },
      { value: "3x", multiplier: 3 },
      { value: "5x", multiplier: 5 },
      { value: "10x", multiplier: 10 },
      { value: "0.5x", multiplier: 0.5 },
      { value: "1x", multiplier: 1 },
    ],
  },
};

// Color game matching - which colors win for each result
function getColorWinningBets(result: string): string[] {
  // For color game, result is always red, green, or violet
  return [result];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if auto game controller is enabled
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_game_controller")
      .single();

    const isEnabled = setting?.value?.enabled ?? true;

    if (!isEnabled) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Auto game controller is disabled",
        enabled: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const results: Record<string, string[]> = {};
    const now = new Date();

    // Process each game type
    for (const gameType of GAME_TYPES) {
      results[gameType] = [];
      const config = GAME_CONFIG[gameType];

      // Process each duration category for this game
      for (const durationSeconds of DURATION_CATEGORIES) {
        const durationMinutes = durationSeconds / 60;

        // Get active round for this game type AND duration
        const { data: activeRound } = await supabase
          .from("game_rounds")
          .select("*")
          .eq("game_type", gameType)
          .eq("duration", durationMinutes)
          .in("status", ["betting", "locked"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeRound) {
          const endTime = new Date(activeRound.end_time);
          
          if (activeRound.status === "betting" && now >= endTime) {
            // Lock the round and calculate optimal result
            await supabase
              .from("game_rounds")
              .update({ status: "locked" })
              .eq("id", activeRound.id);
            
            // Get all bets for this round
            const { data: bets } = await supabase
              .from("bets")
              .select("*")
              .eq("round_id", activeRound.id);

            // Calculate profit/loss for each possible result
            let bestResult = config.options[0].value;
            let bestProfit = -Infinity;
            const totalBetAmount = bets?.reduce((sum, bet) => sum + Number(bet.amount), 0) || 0;

            for (const option of config.options) {
              let payout = 0;
              
              if (gameType === "color") {
                // Color game logic - simple color matching
                const winningBets = bets?.filter(bet => bet.bet_choice === option.value) || [];
                
                for (const bet of winningBets) {
                  // Determine multiplier based on what they bet
                  const multiplier = bet.bet_choice === "violet" ? 5 : 2;
                  payout += Number(bet.amount) * multiplier;
                }
              } else {
                // Standard game logic
                const winningBets = bets?.filter(bet => bet.bet_choice === option.value) || [];
                payout = winningBets.reduce((sum, bet) => sum + Number(bet.amount) * option.multiplier, 0);
              }

              const profit = totalBetAmount - payout;
              
              if (profit > bestProfit) {
                bestProfit = profit;
                bestResult = option.value;
              }
            }

            // If no bets, pick random result for fairness appearance
            if (!bets || bets.length === 0) {
              const randomIndex = Math.floor(Math.random() * config.options.length);
              bestResult = config.options[randomIndex].value;
            }

            // Set the result
            await supabase
              .from("game_rounds")
              .update({ result: bestResult, status: "completed" })
              .eq("id", activeRound.id);

            // Process payouts
            if (bets && bets.length > 0) {
              for (const bet of bets) {
                let won = false;
                let multiplier = 0;

                if (gameType === "color") {
                  won = bet.bet_choice === bestResult;
                  if (won) {
                    multiplier = bet.bet_choice === "violet" ? 5 : 2;
                  }
                } else {
                  won = bet.bet_choice === bestResult;
                  if (won) {
                    const optionConfig = config.options.find(o => o.value === bestResult);
                    multiplier = optionConfig?.multiplier || 0;
                  }
                }

                const payout = won ? Number(bet.amount) * multiplier : 0;

                // Update bet record
                await supabase
                  .from("bets")
                  .update({ won, payout })
                  .eq("id", bet.id);

                // Credit winner's wallet
                if (won && payout > 0) {
                  const { data: wallet } = await supabase
                    .from("wallets")
                    .select("balance")
                    .eq("user_id", bet.user_id)
                    .single();

                  if (wallet) {
                    await supabase
                      .from("wallets")
                      .update({ balance: Number(wallet.balance) + payout })
                      .eq("user_id", bet.user_id);
                  }
                }
              }
            }

            results[gameType].push(`${durationMinutes}min: Completed #${activeRound.round_number}`);

            // 2-second gap before creating new round (allows clients to sync data)
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Create new round for this duration
            const { data: lastRound } = await supabase
              .from("game_rounds")
              .select("round_number")
              .eq("game_type", gameType)
              .eq("duration", durationMinutes)
              .order("round_number", { ascending: false })
              .limit(1)
              .maybeSingle();

            const newRoundNumber = (lastRound?.round_number || 0) + 1;
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

            await supabase.from("game_rounds").insert({
              game_type: gameType,
              round_number: newRoundNumber,
              duration: durationMinutes,
              start_time: startTime.toISOString(),
              end_time: endTime.toISOString(),
              status: "betting",
            });

            results[gameType].push(`${durationMinutes}min: Started #${newRoundNumber}`);
          } else if (activeRound.status === "betting") {
            // Round still active, nothing to do
          }
        } else {
          // No active round for this game+duration - create one
          const { data: lastRound } = await supabase
            .from("game_rounds")
            .select("round_number")
            .eq("game_type", gameType)
            .eq("duration", durationMinutes)
            .order("round_number", { ascending: false })
            .limit(1)
            .maybeSingle();

          const newRoundNumber = (lastRound?.round_number || 0) + 1;
          const startTime = new Date();
          const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

          await supabase.from("game_rounds").insert({
            game_type: gameType,
            round_number: newRoundNumber,
            duration: durationMinutes,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "betting",
          });

          results[gameType].push(`${durationMinutes}min: Created #${newRoundNumber}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results, timestamp: now.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Auto game controller error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
