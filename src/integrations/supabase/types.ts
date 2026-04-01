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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      adapter_versions: {
        Row: {
          adapter_id: string | null
          auth_type: string | null
          base_url: string | null
          created_at: string | null
          deprecated: boolean | null
          id: string
          is_latest: boolean | null
          sample_request: Json | null
          sample_response: Json | null
          version: string
        }
        Insert: {
          adapter_id?: string | null
          auth_type?: string | null
          base_url?: string | null
          created_at?: string | null
          deprecated?: boolean | null
          id?: string
          is_latest?: boolean | null
          sample_request?: Json | null
          sample_response?: Json | null
          version: string
        }
        Update: {
          adapter_id?: string | null
          auth_type?: string | null
          base_url?: string | null
          created_at?: string | null
          deprecated?: boolean | null
          id?: string
          is_latest?: boolean | null
          sample_request?: Json | null
          sample_response?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "adapter_versions_adapter_id_fkey"
            columns: ["adapter_id"]
            isOneToOne: false
            referencedRelation: "adapters"
            referencedColumns: ["id"]
          },
        ]
      }
      adapters: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          input_schema: Json | null
          name: string
          output_schema: Json | null
          provider: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          input_schema?: Json | null
          name: string
          output_schema?: Json | null
          provider: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          input_schema?: Json | null
          name?: string
          output_schema?: Json | null
          provider?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          payload: Json | null
          performed_by: string | null
          tenant_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json | null
          performed_by?: string | null
          tenant_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          payload?: Json | null
          performed_by?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      config_history: {
        Row: {
          change_note: string | null
          changed_by: string | null
          config_id: string | null
          created_at: string | null
          id: string
          snapshot: Json
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          snapshot: Json
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "config_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "integration_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_type: string | null
          id: string
          parsed_result: Json | null
          raw_text: string | null
          status: string | null
          tenant_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_type?: string | null
          id?: string
          parsed_result?: Json | null
          raw_text?: string | null
          status?: string | null
          tenant_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string | null
          id?: string
          parsed_result?: Json | null
          raw_text?: string | null
          status?: string | null
          tenant_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      field_mappings: {
        Row: {
          ai_confidence: number | null
          config_id: string | null
          created_at: string | null
          id: string
          is_ai_suggested: boolean | null
          is_confirmed: boolean | null
          source_field: string
          target_field: string
          transform_rule: string | null
        }
        Insert: {
          ai_confidence?: number | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          is_confirmed?: boolean | null
          source_field: string
          target_field: string
          transform_rule?: string | null
        }
        Update: {
          ai_confidence?: number | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          is_ai_suggested?: boolean | null
          is_confirmed?: boolean | null
          source_field?: string
          target_field?: string
          transform_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_mappings_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "integration_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          adapter_version_id: string | null
          config: Json
          created_at: string | null
          document_id: string | null
          id: string
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          adapter_version_id?: string | null
          config: Json
          created_at?: string | null
          document_id?: string | null
          id?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          adapter_version_id?: string | null
          config?: Json
          created_at?: string | null
          document_id?: string | null
          id?: string
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_adapter_version_id_fkey"
            columns: ["adapter_version_id"]
            isOneToOne: false
            referencedRelation: "adapter_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_configs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          adapter_version_id: string | null
          config_id: string | null
          created_at: string | null
          id: string
          latency_ms: number | null
          request_payload: Json | null
          response_payload: Json | null
          status: string | null
          tenant_id: string | null
        }
        Insert: {
          adapter_version_id?: string | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          tenant_id?: string | null
        }
        Update: {
          adapter_version_id?: string | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulations_adapter_version_id_fkey"
            columns: ["adapter_version_id"]
            isOneToOne: false
            referencedRelation: "adapter_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "integration_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
