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
      branches: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          first_name: string | null
          last_name: string | null
          role: 'admin' | 'employee' | 'boss'
          branch_id: string | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: 'admin' | 'employee' | 'boss'
          branch_id?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          role?: 'admin' | 'employee' | 'boss'
          branch_id?: string | null
          is_approved?: boolean
          created_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string | null
          quantity: number
          usage_location: string | null
          image_url: string | null
          branch_id: string
          created_by: string | null
          created_at: string
          inventory_number: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          quantity?: number
          usage_location?: string | null
          image_url?: string | null
          branch_id: string
          created_by?: string | null
          created_at?: string
          inventory_number?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          quantity?: number
          usage_location?: string | null
          image_url?: string | null
          branch_id?: string
          created_by?: string | null
          created_at?: string
          inventory_number?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_email_by_username: {
        Args: {
          p_username: string
        }
        Returns: string
      }
    }
    Enums: {
      user_role: 'admin' | 'employee' | 'boss'
    }
  }
}
