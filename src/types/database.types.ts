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
      checkouts: {
        Row: {
          checked_out_at: string
          checked_out_by: string
          created_at: string
          id: string
          lot_id: string
          purpose: string | null
          quantity: number
        }
        Insert: {
          checked_out_at?: string
          checked_out_by: string
          created_at?: string
          id?: string
          lot_id: string
          purpose?: string | null
          quantity: number
        }
        Update: {
          checked_out_at?: string
          checked_out_by?: string
          created_at?: string
          id?: string
          lot_id?: string
          purpose?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkouts_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "item_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      item_lots: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          is_peroxide: boolean
          item_id: string
          lab_id: string
          lot_number: string
          manufacture_date: string | null
          purchase_order_id: string
          received_by: string
          received_date: string
          received_quantity: number
          remaining_quantity: number
          status: Database["public"]["Enums"]["lot_status"]
          supplier: string | null
          unit: string
          updated_at: string
          village_id: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_peroxide?: boolean
          item_id: string
          lab_id: string
          lot_number: string
          manufacture_date?: string | null
          purchase_order_id: string
          received_by: string
          received_date: string
          received_quantity: number
          remaining_quantity: number
          status?: Database["public"]["Enums"]["lot_status"]
          supplier?: string | null
          unit: string
          updated_at?: string
          village_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          is_peroxide?: boolean
          item_id?: string
          lab_id?: string
          lot_number?: string
          manufacture_date?: string | null
          purchase_order_id?: string
          received_by?: string
          received_date?: string
          received_quantity?: number
          remaining_quantity?: number
          status?: Database["public"]["Enums"]["lot_status"]
          supplier?: string | null
          unit?: string
          updated_at?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_lots_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_lots_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_lots_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_lots_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_lots_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      item_master: {
        Row: {
          cas_number: string | null
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          id: string
          is_active: boolean
          is_peroxide: boolean
          is_regulated: boolean
          min_stock_level: number | null
          name: string
          storage_requirements: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          cas_number?: string | null
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          is_peroxide?: boolean
          is_regulated?: boolean
          min_stock_level?: number | null
          name: string
          storage_requirements?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          cas_number?: string | null
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          id?: string
          is_active?: boolean
          is_peroxide?: boolean
          is_regulated?: boolean
          min_stock_level?: number | null
          name?: string
          storage_requirements?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      labs: {
        Row: {
          code: string
          created_at: string
          id: string
          location: string | null
          name: string
          updated_at: string
          village_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
          village_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labs_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      peroxide_inspections: {
        Row: {
          action_taken: string | null
          created_at: string
          id: string
          inspection_date: string
          inspector_id: string
          lot_id: string
          notes: string | null
          ppm_reading: number
          status: Database["public"]["Enums"]["inspection_status"]
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          id?: string
          inspection_date: string
          inspector_id: string
          lot_id: string
          notes?: string | null
          ppm_reading: number
          status: Database["public"]["Enums"]["inspection_status"]
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_id?: string
          lot_id?: string
          notes?: string | null
          ppm_reading?: number
          status?: Database["public"]["Enums"]["inspection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "peroxide_inspections_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "peroxide_inspections_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "item_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          item_id: string
          lab_id: string
          notes: string | null
          po_number: string | null
          purpose: string | null
          quantity: number
          reject_reason: string | null
          requester_id: string
          status: Database["public"]["Enums"]["order_status"]
          unit: string
          updated_at: string
          village_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          item_id: string
          lab_id: string
          notes?: string | null
          po_number?: string | null
          purpose?: string | null
          quantity: number
          reject_reason?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["order_status"]
          unit: string
          updated_at?: string
          village_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          item_id?: string
          lab_id?: string
          notes?: string | null
          po_number?: string | null
          purpose?: string | null
          quantity?: number
          reject_reason?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          unit?: string
          updated_at?: string
          village_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_record_lots: {
        Row: {
          created_at: string
          id: string
          lot_id: string
          regulatory_record_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id: string
          regulatory_record_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string
          regulatory_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_record_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "item_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_record_lots_regulatory_record_id_fkey"
            columns: ["regulatory_record_id"]
            isOneToOne: false
            referencedRelation: "regulatory_records"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_records: {
        Row: {
          created_at: string
          description: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          is_controlled: boolean
          item_id: string
          lab_id: string | null
          regulation_code: string | null
          regulation_type: string
          status: Database["public"]["Enums"]["regulatory_status"]
          updated_at: string
          village_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_controlled?: boolean
          item_id: string
          lab_id?: string | null
          regulation_code?: string | null
          regulation_type: string
          status?: Database["public"]["Enums"]["regulatory_status"]
          updated_at?: string
          village_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_controlled?: boolean
          item_id?: string
          lab_id?: string | null
          regulation_code?: string | null
          regulation_type?: string
          status?: Database["public"]["Enums"]["regulatory_status"]
          updated_at?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_records_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_records_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      shelf_life_extensions: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          lot_id: string
          new_expiry_date: string
          old_expiry_date: string
          reason: string
          reject_reason: string | null
          requested_by: string
          review_date: string | null
          status: Database["public"]["Enums"]["extension_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          lot_id: string
          new_expiry_date: string
          old_expiry_date: string
          reason: string
          reject_reason?: string | null
          requested_by: string
          review_date?: string | null
          status?: Database["public"]["Enums"]["extension_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          lot_id?: string
          new_expiry_date?: string
          old_expiry_date?: string
          reason?: string
          reject_reason?: string | null
          requested_by?: string
          review_date?: string | null
          status?: Database["public"]["Enums"]["extension_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelf_life_extensions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelf_life_extensions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "item_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelf_life_extensions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          description: string
          id: string
          metadata: Json | null
          reference_id: string
          reference_type: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          village_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          reference_id: string
          reference_type: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          village_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          reference_id?: string
          reference_type?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auth_user_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          lab_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          village_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          lab_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          village_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auth_user_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          lab_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      villages: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_po_number: {
        Args: { p_village_code: string; p_year: number }
        Returns: string
      }
      get_current_profile_id: { Args: Record<PropertyKey, never>; Returns: string }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_current_user_village_id: { Args: Record<PropertyKey, never>; Returns: string }
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      perform_checkout: {
        Args: {
          p_lot_id: string
          p_purpose?: string
          p_quantity: number
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      extension_status: "pending" | "approved" | "rejected"
      inspection_status: "normal" | "warning" | "quarantine"
      item_category:
        | "chemical_reagent"
        | "calibration_std"
        | "gas"
        | "material_supply"
        | "peroxide"
      lot_status: "active" | "depleted" | "expired" | "quarantined" | "disposed"
      order_status:
        | "pending"
        | "approved"
        | "rejected"
        | "ordered"
        | "partially_received"
        | "received"
        | "closed"
      regulatory_status: "active" | "expired" | "pending_review"
      transaction_type:
        | "order_created"
        | "order_approved"
        | "order_rejected"
        | "check_in"
        | "check_out"
        | "inspection"
        | "shelf_life_extension"
        | "regulatory_update"
        | "user_approved"
      user_role: "admin" | "requester" | "focal_point" | "staff" | "compliance"
      user_status: "pending" | "active" | "rejected" | "inactive"
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

// Convenience aliases kept from original hand-crafted types
export type UserRole = Database["public"]["Enums"]["user_role"]
export type UserStatus = Database["public"]["Enums"]["user_status"]
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type LotStatus = Database["public"]["Enums"]["lot_status"]
export type InspectionStatus = Database["public"]["Enums"]["inspection_status"]
export type ExtensionStatus = Database["public"]["Enums"]["extension_status"]
export type RegulatoryStatus = Database["public"]["Enums"]["regulatory_status"]
export type ItemCategory = Database["public"]["Enums"]["item_category"]
export type TransactionType = Database["public"]["Enums"]["transaction_type"]
