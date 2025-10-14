/**
 * Supabase database types
 *
 * This file should be generated using the Supabase CLI after migrations are run:
 * npx supabase gen types typescript --project-id [YOUR-PROJECT-REF] > types/supabase.ts
 *
 * For now, this is a placeholder with the expected structure.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      media_files: {
        Row: {
          id: string;
          user_id: string;
          file_hash: string;
          filename: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_hash: string;
          filename: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_hash?: string;
          filename?: string;
          file_size?: number;
          mime_type?: string;
          storage_path?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      tracks: {
        Row: {
          id: string;
          project_id: string;
          track_index: number;
          visible: boolean;
          locked: boolean;
          muted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          track_index: number;
          visible?: boolean;
          locked?: boolean;
          muted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          track_index?: number;
          visible?: boolean;
          locked?: boolean;
          muted?: boolean;
          created_at?: string;
        };
      };
      effects: {
        Row: {
          id: string;
          project_id: string;
          kind: string;
          track: number;
          start_at_position: number;
          duration: number;
          start_time: number;
          end_time: number;
          media_file_id: string | null;
          properties: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          kind: string;
          track: number;
          start_at_position: number;
          duration: number;
          start_time: number;
          end_time: number;
          media_file_id?: string | null;
          properties?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          kind?: string;
          track?: number;
          start_at_position?: number;
          duration?: number;
          start_time?: number;
          end_time?: number;
          media_file_id?: string | null;
          properties?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      filters: {
        Row: {
          id: string;
          project_id: string;
          effect_id: string;
          type: string;
          value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          effect_id: string;
          type: string;
          value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          effect_id?: string;
          type?: string;
          value?: number;
          created_at?: string;
        };
      };
      animations: {
        Row: {
          id: string;
          project_id: string;
          effect_id: string;
          type: string;
          for_type: string;
          ease_type: string;
          duration: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          effect_id: string;
          type: string;
          for_type: string;
          ease_type: string;
          duration: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          effect_id?: string;
          type?: string;
          for_type?: string;
          ease_type?: string;
          duration?: number;
          created_at?: string;
        };
      };
      transitions: {
        Row: {
          id: string;
          project_id: string;
          from_effect_id: string;
          to_effect_id: string;
          name: string;
          duration: number;
          params: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          from_effect_id: string;
          to_effect_id: string;
          name: string;
          duration: number;
          params?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          from_effect_id?: string;
          to_effect_id?: string;
          name?: string;
          duration?: number;
          params?: Json;
          created_at?: string;
        };
      };
      export_jobs: {
        Row: {
          id: string;
          project_id: string;
          status: string;
          settings: Json;
          output_url: string | null;
          progress: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          status: string;
          settings?: Json;
          output_url?: string | null;
          progress?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          status?: string;
          settings?: Json;
          output_url?: string | null;
          progress?: number;
          created_at?: string;
          completed_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
