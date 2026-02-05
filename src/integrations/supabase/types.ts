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
      admin_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      beat_plays: {
        Row: {
          beat_id: string
          id: string
          ip_hash: string | null
          played_at: string
          session_id: string | null
        }
        Insert: {
          beat_id: string
          id?: string
          ip_hash?: string | null
          played_at?: string
          session_id?: string | null
        }
        Update: {
          beat_id?: string
          id?: string
          ip_hash?: string | null
          played_at?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beat_plays_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
        ]
      }
      beats: {
        Row: {
          bpm: number
          cover_url: string | null
          created_at: string
          genre: string
          id: string
          is_active: boolean | null
          is_exclusive_available: boolean | null
          is_free: boolean | null
          mood: string
          mp3_file_path: string | null
          preview_url: string | null
          stems_file_path: string | null
          title: string
          updated_at: string
          wav_file_path: string | null
        }
        Insert: {
          bpm?: number
          cover_url?: string | null
          created_at?: string
          genre?: string
          id?: string
          is_active?: boolean | null
          is_exclusive_available?: boolean | null
          is_free?: boolean | null
          mood?: string
          mp3_file_path?: string | null
          preview_url?: string | null
          stems_file_path?: string | null
          title: string
          updated_at?: string
          wav_file_path?: string | null
        }
        Update: {
          bpm?: number
          cover_url?: string | null
          created_at?: string
          genre?: string
          id?: string
          is_active?: boolean | null
          is_exclusive_available?: boolean | null
          is_free?: boolean | null
          mood?: string
          mp3_file_path?: string | null
          preview_url?: string | null
          stems_file_path?: string | null
          title?: string
          updated_at?: string
          wav_file_path?: string | null
        }
        Relationships: []
      }
      exclusive_offers: {
        Row: {
          admin_response: string | null
          beat_id: string
          counter_amount: number | null
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          message: string | null
          offer_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          beat_id: string
          counter_amount?: number | null
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          message?: string | null
          offer_amount: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          beat_id?: string
          counter_amount?: number | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          message?: string | null
          offer_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exclusive_offers_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
        ]
      }
      license_templates: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      license_tiers: {
        Row: {
          beat_id: string
          created_at: string
          id: string
          includes: string[]
          is_active: boolean | null
          license_pdf_path: string | null
          name: string
          price: number
          type: string
        }
        Insert: {
          beat_id: string
          created_at?: string
          id?: string
          includes?: string[]
          is_active?: boolean | null
          license_pdf_path?: string | null
          name: string
          price: number
          type: string
        }
        Update: {
          beat_id?: string
          created_at?: string
          id?: string
          includes?: string[]
          is_active?: boolean | null
          license_pdf_path?: string | null
          name?: string
          price?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_tiers_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          beat_id: string | null
          beat_title: string
          created_at: string
          download_count: number | null
          id: string
          item_title: string | null
          item_type: string
          license_name: string
          license_tier_id: string | null
          order_id: string
          price: number
          sound_kit_id: string | null
        }
        Insert: {
          beat_id?: string | null
          beat_title: string
          created_at?: string
          download_count?: number | null
          id?: string
          item_title?: string | null
          item_type?: string
          license_name: string
          license_tier_id?: string | null
          order_id: string
          price: number
          sound_kit_id?: string | null
        }
        Update: {
          beat_id?: string | null
          beat_title?: string
          created_at?: string
          download_count?: number | null
          id?: string
          item_title?: string | null
          item_type?: string
          license_name?: string
          license_tier_id?: string | null
          order_id?: string
          price?: number
          sound_kit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_license_tier_id_fkey"
            columns: ["license_tier_id"]
            isOneToOne: false
            referencedRelation: "license_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_sound_kit_id_fkey"
            columns: ["sound_kit_id"]
            isOneToOne: false
            referencedRelation: "sound_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          download_expires_at: string | null
          id: string
          paypal_order_id: string | null
          paypal_transaction_id: string | null
          status: string
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          download_expires_at?: string | null
          id?: string
          paypal_order_id?: string | null
          paypal_transaction_id?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          download_expires_at?: string | null
          id?: string
          paypal_order_id?: string | null
          paypal_transaction_id?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string
          id: string
          is_encrypted: boolean | null
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_encrypted?: boolean | null
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_views: {
        Row: {
          id: string
          ip_hash: string | null
          page_path: string
          referrer: string | null
          session_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_hash?: string | null
          page_path: string
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_hash?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string | null
          viewed_at?: string
        }
        Relationships: []
      }
      sound_kits: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean | null
          preview_url: string | null
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          preview_url?: string | null
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean | null
          preview_url?: string | null
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_analytics_rate_limit: {
        Args: {
          p_max_count: number
          p_session_id: string
          p_table_name: string
          p_window_minutes: number
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "customer"
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
      app_role: ["admin", "customer"],
    },
  },
} as const
