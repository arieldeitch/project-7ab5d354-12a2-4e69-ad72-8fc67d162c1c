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
      achievements: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: number
          player_id: string
          title: string
          unlocked_at: string
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: number
          player_id: string
          title: string
          unlocked_at?: string
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: number
          player_id?: string
          title?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      bracket_predictions: {
        Row: {
          champion_team_id: number | null
          created_at: string
          finalists: Json | null
          golden_boot_player_id: number | null
          group_runners_up: Json | null
          group_winners: Json | null
          id: string
          is_locked: boolean
          mvp_player_id: number | null
          player_id: string
          quarter_finals: Json | null
          round_of_16: Json | null
          round_of_32: Json | null
          runner_up_team_id: number | null
          semi_finals: Json | null
          third_place_team_id: number | null
          total_bracket_points: number
          updated_at: string
        }
        Insert: {
          champion_team_id?: number | null
          created_at?: string
          finalists?: Json | null
          golden_boot_player_id?: number | null
          group_runners_up?: Json | null
          group_winners?: Json | null
          id?: string
          is_locked?: boolean
          mvp_player_id?: number | null
          player_id: string
          quarter_finals?: Json | null
          round_of_16?: Json | null
          round_of_32?: Json | null
          runner_up_team_id?: number | null
          semi_finals?: Json | null
          third_place_team_id?: number | null
          total_bracket_points?: number
          updated_at?: string
        }
        Update: {
          champion_team_id?: number | null
          created_at?: string
          finalists?: Json | null
          golden_boot_player_id?: number | null
          group_runners_up?: Json | null
          group_winners?: Json | null
          id?: string
          is_locked?: boolean
          mvp_player_id?: number | null
          player_id?: string
          quarter_finals?: Json | null
          round_of_16?: Json | null
          round_of_32?: Json | null
          runner_up_team_id?: number | null
          semi_finals?: Json | null
          third_place_team_id?: number | null
          total_bracket_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bracket_predictions_champion_team_id_fkey"
            columns: ["champion_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_predictions_golden_boot_player_id_fkey"
            columns: ["golden_boot_player_id"]
            isOneToOne: false
            referencedRelation: "football_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_predictions_mvp_player_id_fkey"
            columns: ["mvp_player_id"]
            isOneToOne: false
            referencedRelation: "football_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_predictions_runner_up_team_id_fkey"
            columns: ["runner_up_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bracket_predictions_third_place_team_id_fkey"
            columns: ["third_place_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      football_players: {
        Row: {
          created_at: string
          id: number
          name: string
          name_he: string | null
          nationality: string | null
          photo_url: string | null
          position: string | null
          team_id: number | null
        }
        Insert: {
          created_at?: string
          id: number
          name: string
          name_he?: string | null
          nationality?: string | null
          photo_url?: string | null
          position?: string | null
          team_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          name_he?: string | null
          nationality?: string | null
          photo_url?: string | null
          position?: string | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "football_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      match_events: {
        Row: {
          created_at: string
          detail: string | null
          event_type: string
          id: number
          match_id: number
          minute: number | null
          player_id: number | null
          player_name: string | null
          team_id: number | null
        }
        Insert: {
          created_at?: string
          detail?: string | null
          event_type: string
          id?: number
          match_id: number
          minute?: number | null
          player_id?: number | null
          player_name?: string | null
          team_id?: number | null
        }
        Update: {
          created_at?: string
          detail?: string | null
          event_type?: string
          id?: number
          match_id?: number
          minute?: number | null
          player_id?: number | null
          player_name?: string | null
          team_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "football_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_score_ht: number | null
          away_team_id: number | null
          city: string | null
          corners_away: number | null
          corners_home: number | null
          created_at: string
          external_id: string | null
          group_code: string | null
          home_score: number | null
          home_score_ht: number | null
          home_team_id: number | null
          id: number
          kickoff_at: string
          minute: number | null
          possession_away: number | null
          possession_home: number | null
          red_away: number | null
          red_home: number | null
          shots_away: number | null
          shots_home: number | null
          stadium: string | null
          stage: Database["public"]["Enums"]["tournament_stage"]
          status: Database["public"]["Enums"]["match_status"]
          updated_at: string
          yellow_away: number | null
          yellow_home: number | null
        }
        Insert: {
          away_score?: number | null
          away_score_ht?: number | null
          away_team_id?: number | null
          city?: string | null
          corners_away?: number | null
          corners_home?: number | null
          created_at?: string
          external_id?: string | null
          group_code?: string | null
          home_score?: number | null
          home_score_ht?: number | null
          home_team_id?: number | null
          id: number
          kickoff_at: string
          minute?: number | null
          possession_away?: number | null
          possession_home?: number | null
          red_away?: number | null
          red_home?: number | null
          shots_away?: number | null
          shots_home?: number | null
          stadium?: string | null
          stage?: Database["public"]["Enums"]["tournament_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          yellow_away?: number | null
          yellow_home?: number | null
        }
        Update: {
          away_score?: number | null
          away_score_ht?: number | null
          away_team_id?: number | null
          city?: string | null
          corners_away?: number | null
          corners_home?: number | null
          created_at?: string
          external_id?: string | null
          group_code?: string | null
          home_score?: number | null
          home_score_ht?: number | null
          home_team_id?: number | null
          id?: number
          kickoff_at?: string
          minute?: number | null
          possession_away?: number | null
          possession_home?: number | null
          red_away?: number | null
          red_home?: number | null
          shots_away?: number | null
          shots_home?: number | null
          stadium?: string | null
          stage?: Database["public"]["Enums"]["tournament_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          updated_at?: string
          yellow_away?: number | null
          yellow_home?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_group_code_fkey"
            columns: ["group_code"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      medals: {
        Row: {
          created_at: string
          day: string
          id: number
          kind: Database["public"]["Enums"]["medal_kind"]
          player_id: string
          points: number
        }
        Insert: {
          created_at?: string
          day: string
          id?: number
          kind: Database["public"]["Enums"]["medal_kind"]
          player_id: string
          points?: number
        }
        Update: {
          created_at?: string
          day?: string
          id?: number
          kind?: Database["public"]["Enums"]["medal_kind"]
          player_id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "medals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          icon: string | null
          id: number
          player_id: string | null
          read: boolean
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: number
          player_id?: string | null
          read?: boolean
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          icon?: string | null
          id?: number
          player_id?: string | null
          read?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          age: number
          avatar_emoji: string | null
          created_at: string
          display_name: string
          favorite_player_id: number | null
          favorite_team_id: number | null
          id: string
          name: string
          total_points: number
          updated_at: string
        }
        Insert: {
          age: number
          avatar_emoji?: string | null
          created_at?: string
          display_name: string
          favorite_player_id?: number | null
          favorite_team_id?: number | null
          id?: string
          name: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          age?: number
          avatar_emoji?: string | null
          created_at?: string
          display_name?: string
          favorite_player_id?: number | null
          favorite_team_id?: number | null
          id?: string
          name?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      prediction_scores: {
        Row: {
          anytime_scorer_points: number
          btts_points: number
          calculated_at: string
          first_scorer_points: number
          id: number
          match_id: number
          player_id: string
          prediction_id: string
          score_points: number
          total_points: number
          totals_points: number
          winner_points: number
        }
        Insert: {
          anytime_scorer_points?: number
          btts_points?: number
          calculated_at?: string
          first_scorer_points?: number
          id?: number
          match_id: number
          player_id: string
          prediction_id: string
          score_points?: number
          total_points?: number
          totals_points?: number
          winner_points?: number
        }
        Update: {
          anytime_scorer_points?: number
          btts_points?: number
          calculated_at?: string
          first_scorer_points?: number
          id?: number
          match_id?: number
          player_id?: string
          prediction_id?: string
          score_points?: number
          total_points?: number
          totals_points?: number
          winner_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "prediction_scores_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_scores_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: true
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          anytime_scorer_id: number | null
          away_score: number | null
          both_teams_score: boolean | null
          created_at: string
          first_scorer_id: number | null
          home_score: number | null
          id: string
          is_locked: boolean
          match_id: number
          over_2_5: boolean | null
          player_id: string
          updated_at: string
          winner: Database["public"]["Enums"]["prediction_winner"] | null
        }
        Insert: {
          anytime_scorer_id?: number | null
          away_score?: number | null
          both_teams_score?: boolean | null
          created_at?: string
          first_scorer_id?: number | null
          home_score?: number | null
          id?: string
          is_locked?: boolean
          match_id: number
          over_2_5?: boolean | null
          player_id: string
          updated_at?: string
          winner?: Database["public"]["Enums"]["prediction_winner"] | null
        }
        Update: {
          anytime_scorer_id?: number | null
          away_score?: number | null
          both_teams_score?: boolean | null
          created_at?: string
          first_scorer_id?: number | null
          home_score?: number | null
          id?: string
          is_locked?: boolean
          match_id?: number
          over_2_5?: boolean | null
          player_id?: string
          updated_at?: string
          winner?: Database["public"]["Enums"]["prediction_winner"] | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_anytime_scorer_id_fkey"
            columns: ["anytime_scorer_id"]
            isOneToOne: false
            referencedRelation: "football_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_first_scorer_id_fkey"
            columns: ["first_scorer_id"]
            isOneToOne: false
            referencedRelation: "football_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_logs: {
        Row: {
          detail: string | null
          finished_at: string | null
          id: number
          items_count: number | null
          kind: string
          started_at: string
          status: string
        }
        Insert: {
          detail?: string | null
          finished_at?: string | null
          id?: number
          items_count?: number | null
          kind: string
          started_at?: string
          status: string
        }
        Update: {
          detail?: string | null
          finished_at?: string | null
          id?: number
          items_count?: number | null
          kind?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      scoring_config: {
        Row: {
          anytime_scorer: number
          bracket_champion: number
          bracket_final: number
          bracket_golden_boot: number
          bracket_mvp: number
          bracket_qf: number
          bracket_r16: number
          bracket_sf: number
          btts_correct: number
          first_scorer_exact: number
          first_scorer_team: number
          id: number
          score_exact: number
          score_off_by_1: number
          score_off_by_2: number
          score_off_by_3: number
          totals_close: number
          totals_correct: number
          updated_at: string
          winner_correct: number
        }
        Insert: {
          anytime_scorer?: number
          bracket_champion?: number
          bracket_final?: number
          bracket_golden_boot?: number
          bracket_mvp?: number
          bracket_qf?: number
          bracket_r16?: number
          bracket_sf?: number
          btts_correct?: number
          first_scorer_exact?: number
          first_scorer_team?: number
          id?: number
          score_exact?: number
          score_off_by_1?: number
          score_off_by_2?: number
          score_off_by_3?: number
          totals_close?: number
          totals_correct?: number
          updated_at?: string
          winner_correct?: number
        }
        Update: {
          anytime_scorer?: number
          bracket_champion?: number
          bracket_final?: number
          bracket_golden_boot?: number
          bracket_mvp?: number
          bracket_qf?: number
          bracket_r16?: number
          bracket_sf?: number
          btts_correct?: number
          first_scorer_exact?: number
          first_scorer_team?: number
          id?: number
          score_exact?: number
          score_off_by_1?: number
          score_off_by_2?: number
          score_off_by_3?: number
          totals_close?: number
          totals_correct?: number
          updated_at?: string
          winner_correct?: number
        }
        Relationships: []
      }
      standings: {
        Row: {
          draws: number
          goal_difference: number
          goals_against: number
          goals_for: number
          group_code: string
          id: number
          losses: number
          played: number
          points: number
          rank: number
          team_id: number
          updated_at: string
          wins: number
        }
        Insert: {
          draws?: number
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          group_code: string
          id?: number
          losses?: number
          played?: number
          points?: number
          rank: number
          team_id: number
          updated_at?: string
          wins?: number
        }
        Update: {
          draws?: number
          goal_difference?: number
          goals_against?: number
          goals_for?: number
          group_code?: string
          id?: number
          losses?: number
          played?: number
          points?: number
          rank?: number
          team_id?: number
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_group_code_fkey"
            columns: ["group_code"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "standings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          code: string | null
          created_at: string
          flag_url: string | null
          group_code: string | null
          id: number
          logo_url: string | null
          name: string
          name_he: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          flag_url?: string | null
          group_code?: string | null
          id: number
          logo_url?: string | null
          name: string
          name_he?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          flag_url?: string | null
          group_code?: string | null
          id?: number
          logo_url?: string | null
          name?: string
          name_he?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
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
      match_status:
        | "scheduled"
        | "live"
        | "finished"
        | "postponed"
        | "cancelled"
      medal_kind: "gold" | "silver" | "bronze" | "great_effort"
      prediction_winner: "home" | "draw" | "away"
      tournament_stage:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarter_final"
        | "semi_final"
        | "third_place"
        | "final"
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
      match_status: ["scheduled", "live", "finished", "postponed", "cancelled"],
      medal_kind: ["gold", "silver", "bronze", "great_effort"],
      prediction_winner: ["home", "draw", "away"],
      tournament_stage: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarter_final",
        "semi_final",
        "third_place",
        "final",
      ],
    },
  },
} as const
