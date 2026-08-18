// Hand-written to match supabase/migrations/20260818000001_init_profiles.sql
// and 20260818000002_follows_and_avatars.sql.
// Once the Supabase CLI is linked to the project, regenerate with:
//   npx supabase gen types typescript --linked > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          is_private: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_private?: boolean;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_private?: boolean;
        };
        Relationships: [];
      };
      account_private: {
        Row: {
          id: string;
          date_of_birth: string;
          created_at: string;
        };
        Insert: {
          id: string;
          date_of_birth: string;
        };
        Update: {
          date_of_birth?: string;
        };
        Relationships: [];
      };
      reserved_usernames: {
        Row: { username: string };
        Insert: { username: string };
        Update: { username?: string };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          status: "accepted" | "pending";
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: {
          status?: "accepted" | "pending";
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
