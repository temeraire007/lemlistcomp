export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'
export type TemplateStatus = 'draft' | 'active' | 'archived'
export type EmailDirection = 'outbound' | 'inbound'
export type LeadStatus = 'lead' | 'scheduled' | 'sent' | 'opened' | 'replied' | 'won' | 'lost'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          frequency: string | null
          start_time: string | null
          end_time: string | null
          days: string[] | null
          status: CampaignStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          frequency?: string | null
          start_time?: string | null
          end_time?: string | null
          days?: string[] | null
          status?: CampaignStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          frequency?: string | null
          start_time?: string | null
          end_time?: string | null
          days?: string[] | null
          status?: CampaignStatus
          created_at?: string
          updated_at?: string
        }
      }
      email_templates: {
        Row: {
          id: string
          user_id: string
          campaign_id: string | null
          name: string
          subject: string
          content: string
          preview_text: string | null
          variables: string[] | null
          status: TemplateStatus
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id?: string | null
          name: string
          subject: string
          content: string
          preview_text?: string | null
          variables?: string[] | null
          status?: TemplateStatus
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string | null
          name?: string
          subject?: string
          content?: string
          preview_text?: string | null
          variables?: string[] | null
          status?: TemplateStatus
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          first_name: string | null
          last_name: string | null
          email: string
          company: string | null
          status: LeadStatus
          notes: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          company?: string | null
          status?: LeadStatus
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          company?: string | null
          status?: LeadStatus
          notes?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      email_messages: {
        Row: {
          id: string
          lead_id: string
          user_id: string
          direction: EmailDirection
          message_id: string | null
          thread_id: string | null
          subject: string | null
          html_body: string | null
          text_body: string | null
          sent_at: string | null
          headers: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          user_id: string
          direction: EmailDirection
          message_id?: string | null
          thread_id?: string | null
          subject?: string | null
          html_body?: string | null
          text_body?: string | null
          sent_at?: string | null
          headers?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          user_id?: string
          direction?: EmailDirection
          message_id?: string | null
          thread_id?: string | null
          subject?: string | null
          html_body?: string | null
          text_body?: string | null
          sent_at?: string | null
          headers?: Json | null
          created_at?: string
          updated_at?: string
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
  }
}

