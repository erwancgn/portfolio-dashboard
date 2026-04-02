export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_reports: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          model: string | null
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          model?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_import_events: {
        Row: {
          asset_name: string | null
          broker: string
          currency: string
          event_type: string
          executed_at: string | null
          fee_amount: number
          gross_amount: number | null
          id: string
          import_id: string
          isin: string | null
          label: string
          net_amount: number | null
          quantity: number | null
          raw_block: string | null
          tax_amount: number
          ticker: string | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          asset_name?: string | null
          broker: string
          currency?: string
          event_type: string
          executed_at?: string | null
          fee_amount?: number
          gross_amount?: number | null
          id?: string
          import_id: string
          isin?: string | null
          label: string
          net_amount?: number | null
          quantity?: number | null
          raw_block?: string | null
          tax_amount?: number
          ticker?: string | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          asset_name?: string | null
          broker?: string
          currency?: string
          event_type?: string
          executed_at?: string | null
          fee_amount?: number
          gross_amount?: number | null
          id?: string
          import_id?: string
          isin?: string | null
          label?: string
          net_amount?: number | null
          quantity?: number | null
          raw_block?: string | null
          tax_amount?: number
          ticker?: string | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_import_events_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "broker_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_imports: {
        Row: {
          broker: string
          file_hash: string
          filename: string
          id: string
          imported_at: string
          parser_warnings: Json
          raw_text: string | null
          source_year: number | null
          status: string
          summary: Json
          user_id: string
        }
        Insert: {
          broker: string
          file_hash: string
          filename: string
          id?: string
          imported_at?: string
          parser_warnings?: Json
          raw_text?: string | null
          source_year?: number | null
          status?: string
          summary?: Json
          user_id: string
        }
        Update: {
          broker?: string
          file_hash?: string
          filename?: string
          id?: string
          imported_at?: string
          parser_warnings?: Json
          raw_text?: string | null
          source_year?: number | null
          status?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      classic_analysis_cache: {
        Row: {
          analysis: string | null
          computed_at: string
          id: string
          metadata: Json | null
          method: string
          score: number | null
          signal: string | null
          ticker: string
          user_id: string
        }
        Insert: {
          analysis?: string | null
          computed_at?: string
          id?: string
          metadata?: Json | null
          method: string
          score?: number | null
          signal?: string | null
          ticker: string
          user_id: string
        }
        Update: {
          analysis?: string | null
          computed_at?: string
          id?: string
          metadata?: Json | null
          method?: string
          score?: number | null
          signal?: string | null
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      dca_executions: {
        Row: {
          amount: number
          dca_rule_id: string | null
          executed_at: string | null
          execution_price: number
          id: string
          new_pru: number
          quantity_bought: number
          ticker: string
          user_id: string
        }
        Insert: {
          amount: number
          dca_rule_id?: string | null
          executed_at?: string | null
          execution_price: number
          id?: string
          new_pru: number
          quantity_bought: number
          ticker: string
          user_id: string
        }
        Update: {
          amount?: number
          dca_rule_id?: string | null
          executed_at?: string | null
          execution_price?: number
          id?: string
          new_pru?: number
          quantity_bought?: number
          ticker?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dca_executions_dca_rule_id_fkey"
            columns: ["dca_rule_id"]
            isOneToOne: false
            referencedRelation: "dca_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      dca_rules: {
        Row: {
          amount: number
          created_at: string | null
          envelope: string | null
          frequency: string
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          next_expected_at: string | null
          position_id: string | null
          ticker: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          envelope?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          next_expected_at?: string | null
          position_id?: string | null
          ticker: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          envelope?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          next_expected_at?: string | null
          position_id?: string | null
          ticker?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dca_rules_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      fair_value_cache: {
        Row: {
          analysis: string | null
          computed_at: string
          fair_value: number | null
          id: string
          signal: string | null
          sources: Json | null
          ticker: string
          user_id: string
        }
        Insert: {
          analysis?: string | null
          computed_at?: string
          fair_value?: number | null
          id?: string
          signal?: string | null
          sources?: Json | null
          ticker: string
          user_id: string
        }
        Update: {
          analysis?: string | null
          computed_at?: string
          fair_value?: number | null
          id?: string
          signal?: string | null
          sources?: Json | null
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
      liquidities: {
        Row: {
          amount: number
          envelope: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          envelope: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          envelope?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          date: string
          id: string
          positions_json: Json | null
          total_invested: number | null
          total_pnl: number | null
          total_value: number | null
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          positions_json?: Json | null
          total_invested?: number | null
          total_pnl?: number | null
          total_value?: number | null
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          positions_json?: Json | null
          total_invested?: number | null
          total_pnl?: number | null
          total_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          country: string | null
          created_at: string | null
          currency: string | null
          current_price: number | null
          description: string | null
          envelope: string | null
          id: string
          industry: string | null
          isin: string | null
          logo_url: string | null
          name: string | null
          pru: number
          quantity: number
          sector: string | null
          ticker: string
          type: Database["public"]["Enums"]["asset_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          description?: string | null
          envelope?: string | null
          id?: string
          industry?: string | null
          isin?: string | null
          logo_url?: string | null
          name?: string | null
          pru?: number
          quantity?: number
          sector?: string | null
          ticker: string
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          description?: string | null
          envelope?: string | null
          id?: string
          industry?: string | null
          isin?: string | null
          logo_url?: string | null
          name?: string | null
          pru?: number
          quantity?: number
          sector?: string | null
          ticker?: string
          type?: Database["public"]["Enums"]["asset_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          threshold: number
          ticker: string
          triggered_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          threshold: number
          ticker: string
          triggered_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          threshold?: number
          ticker?: string
          triggered_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          envelope: string | null
          executed_at: string
          id: string
          position_id: string | null
          price: number
          quantity: number
          realized_gain: number
          tax_amount: number
          tax_rate: number
          ticker: string
          total: number
          type: string
          user_id: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          envelope?: string | null
          executed_at?: string
          id?: string
          position_id?: string | null
          price: number
          quantity: number
          realized_gain?: number
          tax_amount?: number
          tax_rate?: number
          ticker: string
          total: number
          type: string
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          envelope?: string | null
          executed_at?: string
          id?: string
          position_id?: string | null
          price?: number
          quantity?: number
          realized_gain?: number
          tax_amount?: number
          tax_rate?: number
          ticker?: string
          total?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buy_position: {
        Args: {
          p_position_id: string
          p_price: number
          p_quantity: number
          p_user_id: string
        }
        Returns: Json
      }
      deposit_liquidity: {
        Args: {
          p_amount: number
          p_envelope: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      sell_position: {
        Args: {
          p_position_id: string
          p_price: number
          p_quantity: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      asset_type: "stock" | "etf" | "crypto"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      asset_type: ["stock", "etf", "crypto"],
    },
  },
} as const
