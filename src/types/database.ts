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
          code?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          created_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
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
          company: string | null
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
          company?: string | null
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
          company?: string | null
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
          image_url_2: string | null
          branch_id: string
          company_id: string | null
          category_id: string | null
          created_by: string | null
          created_at: string
          company: string | null
          inventory_number: string | null
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          quantity?: number
          usage_location?: string | null
          image_url?: string | null
          image_url_2?: string | null
          branch_id: string
          company_id?: string | null
          category_id?: string | null
          created_by?: string | null
          created_at?: string
          company?: string | null
          inventory_number?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          quantity?: number
          usage_location?: string | null
          image_url?: string | null
          image_url_2?: string | null
          branch_id?: string
          company_id?: string | null
          category_id?: string | null
          created_by?: string | null
          created_at?: string
          company?: string | null
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
