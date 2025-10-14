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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      animations: {
        Row: {
          created_at: string
          duration: number
          ease_type: string
          effect_id: string
          for_type: string
          id: string
          project_id: string
          type: string
        }
        Insert: {
          created_at?: string
          duration: number
          ease_type: string
          effect_id: string
          for_type: string
          id?: string
          project_id: string
          type: string
        }
        Update: {
          created_at?: string
          duration?: number
          ease_type?: string
          effect_id?: string
          for_type?: string
          id?: string
          project_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "animations_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      effects: {
        Row: {
          created_at: string
          duration: number
          end_time: number
          id: string
          kind: string
          media_file_id: string | null
          project_id: string
          properties: Json
          start_at_position: number
          start_time: number
          track: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration: number
          end_time: number
          id?: string
          kind: string
          media_file_id?: string | null
          project_id: string
          properties?: Json
          start_at_position: number
          start_time: number
          track: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: number
          end_time?: number
          id?: string
          kind?: string
          media_file_id?: string | null
          project_id?: string
          properties?: Json
          start_at_position?: number
          start_time?: number
          track?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "effects_media_file_id_fkey"
            columns: ["media_file_id"]
            isOneToOne: false
            referencedRelation: "media_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "effects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          output_url: string | null
          progress: number
          project_id: string
          settings: Json
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          output_url?: string | null
          progress?: number
          project_id: string
          settings?: Json
          status: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          output_url?: string | null
          progress?: number
          project_id?: string
          settings?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          created_at: string
          effect_id: string
          id: string
          project_id: string
          type: string
          value: number
        }
        Insert: {
          created_at?: string
          effect_id: string
          id?: string
          project_id: string
          type: string
          value: number
        }
        Update: {
          created_at?: string
          effect_id?: string
          id?: string
          project_id?: string
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "filters_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      media_files: {
        Row: {
          created_at: string
          file_hash: string
          file_size: number
          filename: string
          id: string
          metadata: Json
          mime_type: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_hash: string
          file_size: number
          filename: string
          id?: string
          metadata?: Json
          mime_type: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_hash?: string
          file_size?: number
          filename?: string
          id?: string
          metadata?: Json
          mime_type?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          created_at: string
          id: string
          locked: boolean
          muted: boolean
          project_id: string
          track_index: number
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          locked?: boolean
          muted?: boolean
          project_id: string
          track_index: number
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          locked?: boolean
          muted?: boolean
          project_id?: string
          track_index?: number
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transitions: {
        Row: {
          created_at: string
          duration: number
          from_effect_id: string | null
          id: string
          name: string
          params: Json
          project_id: string
          to_effect_id: string | null
        }
        Insert: {
          created_at?: string
          duration: number
          from_effect_id?: string | null
          id?: string
          name: string
          params?: Json
          project_id: string
          to_effect_id?: string | null
        }
        Update: {
          created_at?: string
          duration?: number
          from_effect_id?: string | null
          id?: string
          name?: string
          params?: Json
          project_id?: string
          to_effect_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transitions_from_effect_id_fkey"
            columns: ["from_effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transitions_to_effect_id_fkey"
            columns: ["to_effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
