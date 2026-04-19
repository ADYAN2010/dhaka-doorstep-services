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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          is_pinned: boolean
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          published: boolean
          published_at: string | null
          read_minutes: number
          slug: string
          tag: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_minutes?: number
          slug: string
          tag?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published?: boolean
          published_at?: string | null
          read_minutes?: number
          slug?: string
          tag?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address: string | null
          area: string
          budget_range: string | null
          category: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          preferred_date: string
          preferred_time_slot: string
          provider_id: string | null
          service: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          area: string
          budget_range?: string | null
          category: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          preferred_date: string
          preferred_time_slot: string
          provider_id?: string | null
          service?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          area?: string
          budget_range?: string | null
          category?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          preferred_date?: string
          preferred_time_slot?: string
          provider_id?: string | null
          service?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          country: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          launch_status: Database["public"]["Enums"]["city_launch_status"]
          launched_at: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          launch_status?: Database["public"]["Enums"]["city_launch_status"]
          launched_at?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          launch_status?: Database["public"]["Enums"]["city_launch_status"]
          launched_at?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_ledger: {
        Row: {
          booking_id: string
          category: string
          commission_amount: number
          commission_rate: number
          created_at: string
          currency: string
          customer_id: string | null
          gross_amount: number
          id: string
          paid_out: boolean
          payout_id: string | null
          provider_id: string
          provider_net: number
        }
        Insert: {
          booking_id: string
          category: string
          commission_amount: number
          commission_rate: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          gross_amount: number
          id?: string
          paid_out?: boolean
          payout_id?: string | null
          provider_id: string
          provider_net: number
        }
        Update: {
          booking_id?: string
          category?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          gross_amount?: number
          id?: string
          paid_out?: boolean
          payout_id?: string | null
          provider_id?: string
          provider_net?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          handled: boolean
          id: string
          message: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          handled?: boolean
          id?: string
          message: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          handled?: boolean
          id?: string
          message?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          category_filter: string | null
          city_filter: string | null
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value: number
          id: string
          max_discount_amount: number | null
          min_order_amount: number | null
          per_user_limit: number | null
          status: Database["public"]["Enums"]["coupon_status"]
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category_filter?: string | null
          city_filter?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          status?: Database["public"]["Enums"]["coupon_status"]
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category_filter?: string | null
          city_filter?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: Database["public"]["Enums"]["coupon_discount_type"]
          discount_value?: number
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number | null
          per_user_limit?: number | null
          status?: Database["public"]["Enums"]["coupon_status"]
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          booking_id: string
          created_at: string
          currency: string
          id: string
          invoice_number: string
          issued_at: string | null
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number: string
          issued_at?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          invoice_number?: string
          issued_at?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          audience_segment: string | null
          budget: number | null
          channel: Database["public"]["Enums"]["campaign_channel"]
          clicks: number
          conversions: number
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          impressions: number
          name: string
          spent: number
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_category: string | null
          target_city: string | null
          updated_at: string
        }
        Insert: {
          audience_segment?: string | null
          budget?: number | null
          channel?: Database["public"]["Enums"]["campaign_channel"]
          clicks?: number
          conversions?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          impressions?: number
          name: string
          spent?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_category?: string | null
          target_city?: string | null
          updated_at?: string
        }
        Update: {
          audience_segment?: string | null
          budget?: number | null
          channel?: Database["public"]["Enums"]["campaign_channel"]
          clicks?: number
          conversions?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          impressions?: number
          name?: string
          spent?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_category?: string | null
          target_city?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          booking_id: string
          created_at: string
          customer_id: string
          customer_unread_count: number
          id: string
          last_message_at: string
          provider_id: string
          provider_unread_count: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_id: string
          customer_unread_count?: number
          id?: string
          last_message_at?: string
          provider_id: string
          provider_unread_count?: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_id?: string
          customer_unread_count?: number
          id?: string
          last_message_at?: string
          provider_id?: string
          provider_unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string | null
          trigger_event: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body?: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          trigger_event?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          trigger_event?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_ref: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_ref?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_ref?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: []
      }
      payout_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          ledger_id: string
          payout_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          ledger_id: string
          payout_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ledger_id?: string
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: true
            referencedRelation: "commission_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          method: Database["public"]["Enums"]["payout_method"]
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          provider_id: string
          reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
          total_net: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payout_method"]
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          total_net?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: Database["public"]["Enums"]["payout_method"]
          notes?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider_id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          total_net?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          provider_status: Database["public"]["Enums"]["provider_status"]
          updated_at: string
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          provider_status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          provider_status?: Database["public"]["Enums"]["provider_status"]
          updated_at?: string
        }
        Relationships: []
      }
      provider_applications: {
        Row: {
          about: string | null
          applicant_type: string
          availability: string | null
          category: string
          coverage_area: string
          created_at: string
          email: string
          experience: string
          full_name: string
          id: string
          phone: string
          status: Database["public"]["Enums"]["application_status"]
          team_size: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          about?: string | null
          applicant_type: string
          availability?: string | null
          category: string
          coverage_area: string
          created_at?: string
          email: string
          experience: string
          full_name: string
          id?: string
          phone: string
          status?: Database["public"]["Enums"]["application_status"]
          team_size?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          about?: string | null
          applicant_type?: string
          availability?: string | null
          category?: string
          coverage_area?: string
          created_at?: string
          email?: string
          experience?: string
          full_name?: string
          id?: string
          phone?: string
          status?: Database["public"]["Enums"]["application_status"]
          team_size?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      provider_areas: {
        Row: {
          area: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
          user_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: []
      }
      provider_categories: {
        Row: {
          category: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_providers: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          user_id?: string
        }
        Relationships: []
      }
      service_subcategories: {
        Row: {
          base_price: number | null
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_featured: boolean
          is_seasonal: boolean
          is_trending: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_seasonal?: boolean
          is_trending?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_seasonal?: boolean
          is_trending?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      static_pages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          og_image_url: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image_url?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      support_ticket_categories: {
        Row: {
          created_at: string
          default_priority: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          sla_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_priority?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          sla_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_priority?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          sla_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          pricing_modifier: number
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pricing_modifier?: number
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pricing_modifier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      provider_review_stats: {
        Row: {
          avg_rating: number | null
          provider_id: string | null
          review_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_lead: {
        Args: { _booking_id: string }
        Returns: {
          address: string | null
          area: string
          budget_range: string | null
          category: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          preferred_date: string
          preferred_time_slot: string
          provider_id: string | null
          service: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_approve_application: {
        Args: { _application_id: string }
        Returns: {
          about: string | null
          applicant_type: string
          availability: string | null
          category: string
          coverage_area: string
          created_at: string
          email: string
          experience: string
          full_name: string
          id: string
          phone: string
          status: Database["public"]["Enums"]["application_status"]
          team_size: string | null
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "provider_applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_create_payout: {
        Args: {
          _ledger_ids: string[]
          _method?: Database["public"]["Enums"]["payout_method"]
          _notes?: string
          _provider_id: string
          _reference?: string
        }
        Returns: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          method: Database["public"]["Enums"]["payout_method"]
          notes: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          provider_id: string
          reference: string | null
          status: Database["public"]["Enums"]["payout_status"]
          total_net: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "payouts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      category_commission_rate: { Args: { _category: string }; Returns: number }
      claim_first_admin: { Args: never; Returns: boolean }
      get_or_create_thread: {
        Args: { _booking_id: string }
        Returns: {
          booking_id: string
          created_at: string
          customer_id: string
          customer_unread_count: number
          id: string
          last_message_at: string
          provider_id: string
          provider_unread_count: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "message_threads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_provider: { Args: { _user_id: string }; Returns: boolean }
      is_thread_participant: {
        Args: { _thread_id: string; _user_id: string }
        Returns: boolean
      }
      mark_booking_completed: {
        Args: { _booking_id: string }
        Returns: {
          address: string | null
          area: string
          budget_range: string | null
          category: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          preferred_date: string
          preferred_time_slot: string
          provider_id: string | null
          service: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_thread_read: { Args: { _thread_id: string }; Returns: undefined }
      next_invoice_number: { Args: never; Returns: string }
      provider_available_at: {
        Args: { _time: string; _user_id: string; _weekday: number }
        Returns: boolean
      }
      provider_covers: {
        Args: { _area: string; _category: string; _user_id: string }
        Returns: boolean
      }
      record_booking_payment: {
        Args: {
          _amount: number
          _booking_id: string
          _gateway?: Database["public"]["Enums"]["payment_gateway"]
          _gateway_ref?: string
          _method: Database["public"]["Enums"]["payment_method"]
          _notes?: string
          _status?: Database["public"]["Enums"]["payment_status"]
        }
        Returns: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_ref: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        SetofOptions: {
          from: "*"
          to: "payments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_provider_status: {
        Args: {
          _status: Database["public"]["Enums"]["provider_status"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "provider" | "admin"
      application_status: "new" | "reviewing" | "approved" | "rejected"
      booking_status:
        | "new"
        | "confirmed"
        | "assigned"
        | "completed"
        | "cancelled"
      campaign_channel: "banner" | "email" | "sms" | "push" | "multi"
      campaign_status: "draft" | "scheduled" | "live" | "paused" | "ended"
      city_launch_status: "coming_soon" | "beta" | "live" | "paused"
      coupon_discount_type: "percent" | "fixed"
      coupon_status: "draft" | "scheduled" | "active" | "paused" | "expired"
      invoice_status: "draft" | "issued" | "paid" | "void"
      notification_channel: "email" | "sms" | "push"
      payment_gateway: "none" | "stripe" | "bkash" | "nagad" | "manual"
      payment_method:
        | "cash"
        | "card"
        | "bkash"
        | "nagad"
        | "bank_transfer"
        | "other"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payout_method: "bank_transfer" | "bkash" | "nagad" | "cash" | "other"
      payout_status: "pending" | "paid" | "failed"
      provider_status: "not_applicable" | "pending" | "approved" | "rejected"
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
      app_role: ["customer", "provider", "admin"],
      application_status: ["new", "reviewing", "approved", "rejected"],
      booking_status: [
        "new",
        "confirmed",
        "assigned",
        "completed",
        "cancelled",
      ],
      campaign_channel: ["banner", "email", "sms", "push", "multi"],
      campaign_status: ["draft", "scheduled", "live", "paused", "ended"],
      city_launch_status: ["coming_soon", "beta", "live", "paused"],
      coupon_discount_type: ["percent", "fixed"],
      coupon_status: ["draft", "scheduled", "active", "paused", "expired"],
      invoice_status: ["draft", "issued", "paid", "void"],
      notification_channel: ["email", "sms", "push"],
      payment_gateway: ["none", "stripe", "bkash", "nagad", "manual"],
      payment_method: [
        "cash",
        "card",
        "bkash",
        "nagad",
        "bank_transfer",
        "other",
      ],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_method: ["bank_transfer", "bkash", "nagad", "cash", "other"],
      payout_status: ["pending", "paid", "failed"],
      provider_status: ["not_applicable", "pending", "approved", "rejected"],
    },
  },
} as const
