export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          business_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          business_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          business_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string | null
          address: string | null
          user_id: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          user_id: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          user_id?: string
          deleted_at?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          created_at: string
          address_line1: string
          address_line2: string | null
          city: string
          province: string
          postal_code: string
          client_id: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          address_line1: string
          address_line2?: string | null
          city: string
          province: string
          postal_code: string
          client_id: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          address_line1?: string
          address_line2?: string | null
          city?: string
          province?: string
          postal_code?: string
          client_id?: string
          deleted_at?: string | null
        }
      }
      jobs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          status: string
          title: string
          description: string | null
          client_id: string
          property_id: string
          user_id: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: string
          title: string
          description?: string | null
          client_id: string
          property_id: string
          user_id: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: string
          title?: string
          description?: string | null
          client_id?: string
          property_id?: string
          user_id?: string
          deleted_at?: string | null
        }
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          status: string
          job_id: string
          user_id: string
          due_date: string
          amount: number
          pdf_url: string | null
          paid_at: string | null
          payment_method: string | null
          payment_note: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: string
          job_id: string
          user_id: string
          due_date: string
          amount: number
          pdf_url?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_note?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          status?: string
          job_id?: string
          user_id?: string
          due_date?: string
          amount?: number
          pdf_url?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_note?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          created_at: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
        }
        Insert: {
          id?: string
          created_at?: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
        }
        Update: {
          id?: string
          created_at?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          amount?: number
        }
      }
      invoice_tokens: {
        Row: {
          id: string
          created_at: string
          invoice_id: string
          token: string
          expires_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          invoice_id: string
          token: string
          expires_at: string
        }
        Update: {
          id?: string
          created_at?: string
          invoice_id?: string
          token?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
