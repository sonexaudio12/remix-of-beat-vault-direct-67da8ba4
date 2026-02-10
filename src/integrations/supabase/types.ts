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
      discount_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          is_active?: boolean
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
          discount_amount: number | null
          discount_code: string | null
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
          discount_amount?: number | null
          discount_code?: string | null
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
          discount_amount?: number | null
          discount_code?: string | null
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
      service_order_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          order_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          order_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          order_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_updates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          notes: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string
          service_id: string
          status: string
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          service_id: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          notes?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string
          service_id?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          price: number
          sort_order: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          sort_order?: number | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          sort_order?: number | null
          title?: string
          type?: string
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
      store_config: {
        Row: {
          config_data: Json
          config_type: string
          created_at: string
          id: string
          is_published: boolean
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          config_data?: Json
          config_type?: string
          created_at?: string
          id?: string
          is_published?: boolean
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          config_data?: Json
          config_type?: string
          created_at?: string
          id?: string
          is_published?: boolean
          updated_at?: string
          user_id?: string
          version?: number
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
