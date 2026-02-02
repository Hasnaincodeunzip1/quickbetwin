export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          balance: number
          bank_name: string
          created_at: string
          id: string
          ifsc_code: string | null
          is_active: boolean
          total_deposits: number
          total_transactions: number
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          balance?: number
          bank_name: string
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          total_deposits?: number
          total_transactions?: number
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          balance?: number
          bank_name?: string
          created_at?: string
          id?: string
          ifsc_code?: string | null
          is_active?: boolean
          total_deposits?: number
          total_transactions?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_upi_accounts: {
        Row: {
          created_at: string
          holder_name: string
          id: string
          is_active: boolean
          qr_code_url: string | null
          total_transactions: number
          updated_at: string
          upi_id: string
        }
        Insert: {
          created_at?: string
          holder_name: string
          id?: string
          is_active?: boolean
          qr_code_url?: string | null
          total_transactions?: number
          updated_at?: string
          upi_id: string
        }
        Update: {
          created_at?: string
          holder_name?: string
          id?: string
          is_active?: boolean
          qr_code_url?: string | null
          total_transactions?: number
          updated_at?: string
          upi_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bets: {
        Row: {
          amount: number
          bet_choice: string
          created_at: string
          id: string
          payout: number | null
          round_id: string
          user_id: string
          won: boolean | null
        }
        Insert: {
          amount: number
          bet_choice: string
          created_at?: string
          id?: string
          payout?: number | null
          round_id: string
          user_id: string
          won?: boolean | null
        }
        Update: {
          amount?: number
          bet_choice?: string
          created_at?: string
          id?: string
          payout?: number | null
          round_id?: string
          user_id?: string
          won?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bets_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "game_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      game_rounds: {
        Row: {
          created_at: string
          duration: number
          end_time: string
          game_type: string
          id: string
          result: string | null
          round_number: number
          start_time: string
          status: string
          total_amount: number | null
          total_bets: number | null
        }
        Insert: {
          created_at?: string
          duration: number
          end_time: string
          game_type: string
          id?: string
          result?: string | null
          round_number: number
          start_time: string
          status?: string
          total_amount?: number | null
          total_bets?: number | null
        }
        Update: {
          created_at?: string
          duration?: number
          end_time?: string
          game_type?: string
          id?: string
          result?: string | null
          round_number?: number
          start_time?: string
          status?: string
          total_amount?: number | null
          total_bets?: number | null
        }
        Relationships: []
      }
      lottery_draws: {
        Row: {
          created_at: string
          draw_date: string | null
          id: string
          name: string
          prize_amount: number
          status: string
          updated_at: string
          vip_level: Database["public"]["Enums"]["vip_level"]
          winner_ticket_id: string | null
          winner_user_id: string | null
        }
        Insert: {
          created_at?: string
          draw_date?: string | null
          id?: string
          name: string
          prize_amount: number
          status?: string
          updated_at?: string
          vip_level: Database["public"]["Enums"]["vip_level"]
          winner_ticket_id?: string | null
          winner_user_id?: string | null
        }
        Update: {
          created_at?: string
          draw_date?: string | null
          id?: string
          name?: string
          prize_amount?: number
          status?: string
          updated_at?: string
          vip_level?: Database["public"]["Enums"]["vip_level"]
          winner_ticket_id?: string | null
          winner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lottery_draws_winner_ticket_id_fkey"
            columns: ["winner_ticket_id"]
            isOneToOne: false
            referencedRelation: "lottery_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      lottery_tickets: {
        Row: {
          created_at: string
          earned_at_referral_count: number
          id: string
          is_used: boolean | null
          ticket_number: string
          user_id: string
          vip_level: Database["public"]["Enums"]["vip_level"]
        }
        Insert: {
          created_at?: string
          earned_at_referral_count: number
          id?: string
          is_used?: boolean | null
          ticket_number: string
          user_id: string
          vip_level?: Database["public"]["Enums"]["vip_level"]
        }
        Update: {
          created_at?: string
          earned_at_referral_count?: number
          id?: string
          is_used?: boolean | null
          ticket_number?: string
          user_id?: string
          vip_level?: Database["public"]["Enums"]["vip_level"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          phone: string | null
          referral_code: string
          referred_by: string | null
          status: string | null
          updated_at: string
          vip_level: Database["public"]["Enums"]["vip_level"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          referral_code: string
          referred_by?: string | null
          status?: string | null
          updated_at?: string
          vip_level?: Database["public"]["Enums"]["vip_level"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          status?: string | null
          updated_at?: string
          vip_level?: Database["public"]["Enums"]["vip_level"]
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus: number
          bonus_claimed: boolean
          created_at: string
          id: string
          referred_deposited: boolean
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          bonus?: number
          bonus_claimed?: boolean
          created_at?: string
          id?: string
          referred_deposited?: boolean
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          bonus?: number
          bonus_claimed?: boolean
          created_at?: string
          id?: string
          referred_deposited?: boolean
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          assigned_bank_account_id: string | null
          assigned_upi_account_id: string | null
          bank_details: string | null
          created_at: string
          id: string
          reference: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          assigned_bank_account_id?: string | null
          assigned_upi_account_id?: string | null
          bank_details?: string | null
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          assigned_bank_account_id?: string | null
          assigned_upi_account_id?: string | null
          bank_details?: string | null
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_assigned_bank_account_id_fkey"
            columns: ["assigned_bank_account_id"]
            isOneToOne: false
            referencedRelation: "admin_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_assigned_upi_account_id_fkey"
            columns: ["assigned_upi_account_id"]
            isOneToOne: false
            referencedRelation: "admin_upi_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_purchases: {
        Row: {
          base_price: number
          created_at: string
          id: string
          tax_amount: number
          total_paid: number
          user_id: string
          vip_level: Database["public"]["Enums"]["vip_level"]
        }
        Insert: {
          base_price: number
          created_at?: string
          id?: string
          tax_amount: number
          total_paid: number
          user_id: string
          vip_level: Database["public"]["Enums"]["vip_level"]
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: string
          tax_amount?: number
          total_paid?: number
          user_id?: string
          vip_level?: Database["public"]["Enums"]["vip_level"]
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_bank_balance: {
        Args: { account_id: string; withdrawal_amount: number }
        Returns: undefined
      }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_bank_deposits: {
        Args: { account_id: string; deposit_amount: number }
        Returns: undefined
      }
      increment_bank_transactions: {
        Args: { account_id: string }
        Returns: undefined
      }
      increment_upi_transactions: {
        Args: { account_id: string }
        Returns: undefined
      }
      purchase_vip: {
        Args: {
          p_base_price: number
          p_tax_amount: number
          p_total_price: number
          p_vip_level: Database["public"]["Enums"]["vip_level"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      vip_level: "none" | "bronze" | "silver" | "gold" | "platinum" | "diamond"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      vip_level: ["none", "bronze", "silver", "gold", "platinum", "diamond"],
    },
  },
} as const
