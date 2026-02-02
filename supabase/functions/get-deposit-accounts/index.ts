import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DepositAccountResponse {
  bankAccount: {
    id: string;
    bank_name: string;
    account_holder_name: string;
    account_number: string;
    ifsc_code: string | null;
  } | null;
  upiAccount: {
    id: string;
    upi_id: string;
    holder_name: string;
    qr_code_url: string | null;
  } | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the user is authenticated using their token
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch bank account with least transactions (for load balancing)
    const { data: bankData, error: bankError } = await supabaseAdmin
      .from("admin_bank_accounts")
      .select("id, bank_name, account_holder_name, account_number, ifsc_code")
      .eq("is_active", true)
      .order("total_transactions", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bankError) {
      console.error("Error fetching bank account:", bankError);
    }

    // Fetch UPI account with least transactions (for load balancing)
    const { data: upiData, error: upiError } = await supabaseAdmin
      .from("admin_upi_accounts")
      .select("id, upi_id, holder_name, qr_code_url")
      .eq("is_active", true)
      .order("total_transactions", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (upiError) {
      console.error("Error fetching UPI account:", upiError);
    }

    const response: DepositAccountResponse = {
      bankAccount: bankData,
      upiAccount: upiData,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in get-deposit-accounts:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
