import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Game configuration with multipliers for profit calculation
const GAME_CONFIG: Record<string, { 
  duration: number; 
  options: { value: string; multiplier: number }[] 
}> = {
  color: {
    duration: 180, // 3 minutes
    options: [
      { value: "red", multiplier: 2 },
      { value: "green", multiplier: 2 },
      { value: "violet", multiplier: 5 },
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
  parity: {
    duration: 120, // 2 minutes
    options: [
      { value: "odd", multiplier: 2 },
      { value: "even", multiplier: 2 },
    ],
  },
  bigsmall: {
    duration: 120,
    options: [
      { value: "big", multiplier: 2 },
      { value: "small", multiplier: 2 },
    ],
  },
  dice: {
    duration: 180,
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
    duration: 180,
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
    duration: 120,
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

// Color game has special rules - numbers also match colors
function getColorWinningBets(result: string): string[] {
  const winningChoices = [result];
  
  // Number results also match their color
  if (["0", "5"].includes(result)) {
    winningChoices.push("violet");
  }
  if (["1", "3", "5", "7", "9"].includes(result)) {
    winningChoices.push("red");
  }
  if (["0", "2", "4", "6", "8"].includes(result)) {
    winningChoices.push("green");
  }
  
  return winningChoices;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if auto game controller is enabled and get settings
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "auto_game_controller")
      .single();

    const isEnabled = setting?.value?.enabled ?? true;
    const configuredDurations = setting?.value?.durations as Record<string, number> | undefined;

    if (!isEnabled) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Auto game controller is disabled",
        enabled: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const results: Record<string, string> = {};
    const now = new Date();

    // Helper to get configured duration or fallback to default
    const getDuration = (gameType: string): number => {
      return configuredDurations?.[gameType] ?? GAME_CONFIG[gameType].duration;
    };

    for (const [gameType, config] of Object.entries(GAME_CONFIG)) {
      // Get active round for this game type
      const { data: activeRound } = await supabase
        .from("game_rounds")
        .select("*")
        .eq("game_type", gameType)
        .in("status", ["betting", "locked"])
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

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
              // Special color game logic
              const winningChoices = getColorWinningBets(option.value);
              const winningBets = bets?.filter(bet => winningChoices.includes(bet.bet_choice)) || [];
              
              for (const bet of winningBets) {
                // Determine multiplier based on what they bet
                let multiplier = 2; // Default for color bets
                if (!isNaN(parseInt(bet.bet_choice))) {
                  multiplier = 10; // Number bet
                } else if (bet.bet_choice === "violet") {
                  multiplier = 5;
                }
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
                const winningChoices = getColorWinningBets(bestResult);
                won = winningChoices.includes(bet.bet_choice);
                if (won) {
                  if (!isNaN(parseInt(bet.bet_choice))) {
                    multiplier = 10;
                  } else if (bet.bet_choice === "violet") {
                    multiplier = 5;
                  } else {
                    multiplier = 2;
                  }
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

          results[gameType] = `Completed round ${activeRound.round_number} with result: ${bestResult}, profit: ${bestProfit}`;

          // Create new round
          const { data: lastRound } = await supabase
            .from("game_rounds")
            .select("round_number")
            .eq("game_type", gameType)
            .order("round_number", { ascending: false })
            .limit(1)
            .single();

          const newRoundNumber = (lastRound?.round_number || 0) + 1;
          const startTime = new Date();
          const roundDuration = getDuration(gameType);
          const endTime = new Date(startTime.getTime() + roundDuration * 1000);

          await supabase.from("game_rounds").insert({
            game_type: gameType,
            round_number: newRoundNumber,
            duration: Math.floor(roundDuration / 60), // Store as minutes
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "betting",
          });

          results[gameType] += `, started round ${newRoundNumber}`;
        } else if (activeRound.status === "betting") {
          results[gameType] = `Round ${activeRound.round_number} still accepting bets`;
        }
      } else {
        // No active round - create one
        const { data: lastRound } = await supabase
          .from("game_rounds")
          .select("round_number")
          .eq("game_type", gameType)
          .order("round_number", { ascending: false })
          .limit(1)
          .single();

        const newRoundNumber = (lastRound?.round_number || 0) + 1;
        const startTime = new Date();
        const roundDuration = getDuration(gameType);
        const endTime = new Date(startTime.getTime() + roundDuration * 1000);

        await supabase.from("game_rounds").insert({
          game_type: gameType,
          round_number: newRoundNumber,
          duration: Math.floor(roundDuration / 60), // Store as minutes
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "betting",
        });

        results[gameType] = `Created new round ${newRoundNumber}`;
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
