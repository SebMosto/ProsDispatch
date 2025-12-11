export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          business_name: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          business_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          business_name?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>;
      };
      set_profile_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: Record<string, unknown>;
      };
    };
    Enums: {};
    CompositeTypes: {};
  };
}

export type Tables<TName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TName]['Row'];
export type TablesInsert<
  TName extends keyof Database['public']['Tables'],
> = Database['public']['Tables'][TName]['Insert'];
export type TablesUpdate<
  TName extends keyof Database['public']['Tables'],
> = Database['public']['Tables'][TName]['Update'];
