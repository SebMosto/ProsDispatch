export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          contractor_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          preferred_language: Database["public"]["Enums"]["supported_locale"]
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          preferred_language?: Database["public"]["Enums"]["supported_locale"]
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          preferred_language?: Database["public"]["Enums"]["supported_locale"]
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          stripe_customer_id: string | null
          subscription_status: string
          subscription_end_date: string | null
          tax_gst_rate: number
          tax_qst_rate: number
          stripe_connect_id: string | null
          stripe_connect_onboarded: boolean
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          stripe_customer_id?: string | null
          subscription_status?: string
          subscription_end_date?: string | null
          tax_gst_rate?: number
          tax_qst_rate?: number
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean
        }
        Update: {
          business_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          stripe_customer_id?: string | null
          subscription_status?: string
          subscription_end_date?: string | null
          tax_gst_rate?: number
          tax_qst_rate?: number
          stripe_connect_id?: string | null
          stripe_connect_onboarded?: boolean
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          id: string
          type: string
          event_created_at: string
          created_at: string
          status: string
        }
        Insert: {
          id: string
          type: string
          event_created_at: string
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          type?: string
          event_created_at?: string
          created_at?: string
          status?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          client_id: string
          contractor_id: string
          country: string
          created_at: string
          deleted_at: string | null
          id: string
          nickname: string | null
          postal_code: string
          province: string
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          client_id: string
          contractor_id: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          nickname?: string | null
          postal_code: string
          province: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          client_id?: string
          contractor_id?: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          nickname?: string | null
          postal_code?: string
          province?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          client_id: string
          contractor_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          property_id: string
          service_date: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          contractor_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          property_id: string
          service_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          contractor_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          property_id?: string
          service_date?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      job_events: {
        Row: {
          created_at: string
          created_by: string
          id: string
          job_id: string
          new_status: Database["public"]["Enums"]["job_status"]
          previous_status: Database["public"]["Enums"]["job_status"] | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          job_id: string
          new_status: Database["public"]["Enums"]["job_status"]
          previous_status?: Database["public"]["Enums"]["job_status"] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          job_id?: string
          new_status?: Database["public"]["Enums"]["job_status"]
          previous_status?: Database["public"]["Enums"]["job_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "job_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount: number
          description: string
          id?: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_tokens: {
        Row: {
          expires_at: string
          invoice_id: string
          opened_at: string | null
          token: string
        }
        Insert: {
          expires_at?: string
          invoice_id: string
          opened_at?: string | null
          token: string
        }
        Update: {
          expires_at?: string
          invoice_id?: string
          opened_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_tokens_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contractor_id: string
          id: string
          invoice_number: string
          job_id: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["invoice_payment_method"] | null
          payment_note: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id: string | null
          subtotal: number
          tax_data: Json
          total_amount: number
        }
        Insert: {
          contractor_id: string
          id?: string
          invoice_number: string
          job_id: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["invoice_payment_method"] | null
          payment_note?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_data?: Json
          total_amount?: number
        }
        Update: {
          contractor_id?: string
          id?: string
          invoice_number?: string
          job_id?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["invoice_payment_method"] | null
          payment_note?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_data?: Json
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_job_via_token: {
        Args: {
          p_job_id: string
        }
        Returns: boolean
      }
      create_job: {
        Args: {
          client_id: string
          property_id: string
          title: string
          description?: string | null
          service_date?: string | null
        }
        Returns: Json
      }
      get_invoice_by_token: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      transition_job_state: {
        Args: {
          job_id: string
          new_status: Database["public"]["Enums"]["job_status"]
        }
        Returns: boolean
      }
      get_admin_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_contractors: number
          total_jobs: number
          active_jobs: number
        }
      }
    }
    Enums: {
      client_type: "individual" | "business"
      invoice_payment_method: "stripe" | "cash" | "cheque" | "etransfer" | "other"
      invoice_status: "draft" | "sent" | "paid" | "void" | "overdue"
      job_status: "draft" | "sent" | "approved" | "in_progress" | "completed" | "invoiced" | "paid" | "archived"
      supported_locale: "en" | "fr"
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
      client_type: ["individual", "business"],
      invoice_payment_method: ["stripe", "cash", "cheque", "etransfer", "other"],
      invoice_status: ["draft", "sent", "paid", "void", "overdue"],
      job_status: ["draft", "sent", "approved", "in_progress", "completed", "invoiced", "paid", "archived"],
      supported_locale: ["en", "fr"],
    },
  },
} as const
