// Hand-written to match supabase/migrations/20260818000001_init_profiles.sql,
// 20260818000002_follows_and_avatars.sql, and
// 20260818000003_posts_and_social_core.sql.
// Once the Supabase CLI is linked to the project, regenerate with:
//   npx supabase gen types typescript --linked > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type PostType = "post" | "confession" | "story" | "question" | "poll" | "photo";
export type EducationLevel = "school" | "plus_two" | "bachelor" | "master" | "other";
export type InstitutionType = "school" | "college" | "university" | "other";
export type InstitutionStatus = "pending" | "approved" | "rejected";
export type Mood =
  | "love"
  | "heartbroken"
  | "sad"
  | "funny"
  | "angry"
  | "support"
  | "calm"
  | "motivated"
  | "confused"
  | "happy";
export type ReactionType = "love" | "hug" | "funny" | "relatable" | "angry" | "fire";
export type ReportTargetType = "post" | "comment" | "user" | "message" | "community";
export type ReportReason =
  | "harassment"
  | "bullying"
  | "spam"
  | "threat"
  | "hate"
  | "personal_information"
  | "impersonation"
  | "sexual_content"
  | "dangerous_content"
  | "other";
export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";
export type WhoCanMessage = "everyone" | "followers" | "no_one";
export type ConversationStatus = "pending" | "accepted" | "declined";
export type NotificationTargetType = "post" | "comment" | "profile" | "conversation" | "group_conversation";
export type AccountStatus = "active" | "suspended" | "banned";
export type StaffRole = "admin" | "moderator";
export type ModerationActionType =
  | "dismiss"
  | "remove_content"
  | "hide_content"
  | "warn"
  | "suspend"
  | "ban"
  | "restrict"
  | "unrestrict"
  | "unsuspend"
  | "unban";
export type NotificationType =
  | "follow"
  | "follow_request"
  | "follow_accepted"
  | "reaction_post"
  | "reaction_comment"
  | "comment"
  | "reply"
  | "mention_post"
  | "mention_comment"
  | "message"
  | "system";

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
          country: string | null;
          education_level: EducationLevel | null;
          institution_id: string | null;
          who_can_message: WhoCanMessage;
          status: AccountStatus;
          suspended_until: string | null;
          is_restricted: boolean;
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
          country?: string | null;
          education_level?: EducationLevel | null;
          institution_id?: string | null;
          who_can_message?: WhoCanMessage;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_private?: boolean;
          country?: string | null;
          education_level?: EducationLevel | null;
          institution_id?: string | null;
          who_can_message?: WhoCanMessage;
        };
        Relationships: [];
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          country: string | null;
          type: InstitutionType | null;
          status: InstitutionStatus;
          suggested_by: string | null;
          created_at: string;
        };
        Insert: {
          name: string;
          country?: string | null;
          type?: InstitutionType | null;
          suggested_by?: string | null;
        };
        Update: { status?: InstitutionStatus };
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
      categories: {
        Row: {
          id: string;
          slug: string;
          label: string;
          position: number;
          created_at: string;
        };
        Insert: { slug: string; label: string; position?: number };
        Update: { slug?: string; label?: string; position?: number };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          type: PostType;
          content: string | null;
          category_id: string | null;
          mood: Mood | null;
          is_anonymous: boolean;
          comments_enabled: boolean;
          content_warning: string | null;
          community_id: string | null;
          daily_question_id: string | null;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          type: PostType;
          content?: string | null;
          category_id?: string | null;
          mood?: Mood | null;
          is_anonymous?: boolean;
          comments_enabled?: boolean;
          content_warning?: string | null;
          community_id?: string | null;
          daily_question_id?: string | null;
        };
        Update: {
          content?: string | null;
          category_id?: string | null;
          mood?: Mood | null;
          comments_enabled?: boolean;
          content_warning?: string | null;
        };
        Relationships: [];
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          url: string;
          width: number | null;
          height: number | null;
          position: number;
          created_at: string;
        };
        Insert: {
          post_id: string;
          url: string;
          width?: number | null;
          height?: number | null;
          position?: number;
        };
        Update: { position?: number };
        Relationships: [];
      };
      poll_options: {
        Row: { id: string; post_id: string; option_text: string; position: number };
        Insert: { post_id: string; option_text: string; position?: number };
        Update: { option_text?: string; position?: number };
        Relationships: [];
      };
      poll_votes: {
        Row: { post_id: string; option_id: string; voter_id: string; created_at: string };
        Insert: { post_id: string; option_id: string; voter_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          content: string;
          is_anonymous: boolean;
          is_pinned: boolean;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          content: string;
          is_anonymous?: boolean;
        };
        Update: { content?: string };
        Relationships: [];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          type: ReactionType;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          type: ReactionType;
        };
        Update: { type?: ReactionType };
        Relationships: [];
      };
      bookmarks: {
        Row: { user_id: string; post_id: string; created_at: string };
        Insert: { user_id: string; post_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: ReportReason;
          details?: string | null;
        };
        Update: { status?: ReportStatus };
        Relationships: [];
      };
      hashtags: {
        Row: { id: string; name: string; created_at: string };
        Insert: { name: string };
        Update: { name?: string };
        Relationships: [];
      };
      post_hashtags: {
        Row: { post_id: string; hashtag_id: string };
        Insert: { post_id: string; hashtag_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      reposts: {
        Row: { id: string; user_id: string; post_id: string; quote: string | null; created_at: string };
        Insert: { user_id: string; post_id: string; quote?: string | null };
        Update: Record<string, never>;
        Relationships: [];
      };
      hidden_posts: {
        Row: { user_id: string; post_id: string; created_at: string };
        Insert: { user_id: string; post_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          emoji: string;
          created_at: string;
        };
        Insert: { slug: string; name: string; description?: string | null; emoji?: string };
        Update: { name?: string; description?: string | null; emoji?: string };
        Relationships: [];
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: "member" | "moderator";
          joined_at: string;
        };
        Insert: { community_id: string; user_id: string };
        Update: { role?: "member" | "moderator" };
        Relationships: [];
      };
      daily_questions: {
        Row: { id: string; question_text: string; created_at: string };
        Insert: { question_text: string };
        Update: { question_text?: string };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          reactions: boolean;
          comments: boolean;
          replies: boolean;
          follows: boolean;
          mentions: boolean;
          messages: boolean;
          quiet_mode: boolean;
          updated_at: string;
        };
        Insert: { user_id: string };
        Update: {
          reactions?: boolean;
          comments?: boolean;
          replies?: boolean;
          follows?: boolean;
          mentions?: boolean;
          messages?: boolean;
          quiet_mode?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string | null;
          is_anonymous_actor: boolean;
          type: NotificationType;
          target_type: NotificationTargetType | null;
          target_id: string | null;
          message: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: { read_at?: string | null };
        Relationships: [];
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string; created_at: string };
        Insert: { blocker_id: string; blocked_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      mutes: {
        Row: { muter_id: string; muted_id: string; created_at: string };
        Insert: { muter_id: string; muted_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          user_one_id: string;
          user_two_id: string;
          initiator_id: string;
          status: ConversationStatus;
          created_at: string;
          last_message_at: string;
        };
        Insert: never;
        Update: { status?: ConversationStatus };
        Relationships: [];
      };
      conversation_deletions: {
        Row: { conversation_id: string; user_id: string; deleted_at: string };
        Insert: { conversation_id: string; user_id: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      conversation_reads: {
        Row: { conversation_id: string; user_id: string; last_read_at: string };
        Insert: { conversation_id: string; user_id: string; last_read_at?: string };
        Update: { last_read_at?: string };
        Relationships: [];
      };
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };
        Insert: { conversation_id: string; sender_id: string; content: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      group_conversations: {
        Row: { id: string; name: string | null; created_by: string; created_at: string; last_message_at: string };
        Insert: never;
        Update: Record<string, never>;
        Relationships: [];
      };
      group_members: {
        Row: { group_id: string; user_id: string; role: "owner" | "member"; joined_at: string };
        Insert: never;
        Update: Record<string, never>;
        Relationships: [];
      };
      group_messages: {
        Row: { id: string; group_id: string; sender_id: string; content: string; created_at: string };
        Insert: { group_id: string; sender_id: string; content: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      admin_roles: {
        Row: { user_id: string; role: StaffRole; granted_by: string | null; granted_at: string };
        Insert: { user_id: string; role: StaffRole; granted_by?: string | null };
        Update: { role?: StaffRole };
        Relationships: [];
      };
      moderation_actions: {
        Row: {
          id: string;
          moderator_id: string | null;
          report_id: string | null;
          target_type: ReportTargetType;
          target_id: string;
          action: ModerationActionType;
          reason: string | null;
          created_at: string;
        };
        Insert: never;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: {
      posts_public: {
        Row: {
          id: string;
          type: PostType;
          content: string | null;
          category_id: string | null;
          mood: Mood | null;
          is_anonymous: boolean;
          comments_enabled: boolean;
          content_warning: string | null;
          created_at: string;
          updated_at: string;
          author_id: string | null;
          author_username: string | null;
          author_display_name: string | null;
          author_avatar_url: string | null;
        };
        Relationships: [];
      };
      comments_public: {
        Row: {
          id: string;
          post_id: string;
          parent_id: string | null;
          content: string;
          is_anonymous: boolean;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
          author_id: string | null;
          author_username: string | null;
          author_display_name: string | null;
          author_avatar_url: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      set_comment_pinned: {
        Args: { p_comment_id: string; p_pinned: boolean };
        Returns: void;
      };
      create_notification: {
        Args: {
          p_recipient_id: string;
          p_type: NotificationType;
          p_target_type: NotificationTargetType | null;
          p_target_id: string | null;
          p_is_anonymous_actor?: boolean;
        };
        Returns: void;
      };
      get_or_create_conversation: {
        Args: { p_other_user_id: string };
        Returns: string;
      };
      create_group_conversation: {
        Args: { p_name: string | null; p_member_ids: string[] };
        Returns: string;
      };
      add_group_member: {
        Args: { p_group_id: string; p_user_id: string };
        Returns: void;
      };
      is_staff: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      clear_expired_suspension: {
        Args: { p_user_id: string };
        Returns: void;
      };
      moderate: {
        Args: {
          p_action: ModerationActionType;
          p_target_type: ReportTargetType;
          p_target_id: string;
          p_report_id?: string | null;
          p_reason?: string | null;
          p_duration_hours?: number;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostPublic = Database["public"]["Views"]["posts_public"]["Row"];
export type CommentPublic = Database["public"]["Views"]["comments_public"]["Row"];
export type PollOption = Database["public"]["Tables"]["poll_options"]["Row"];
export type Reaction = Database["public"]["Tables"]["reactions"]["Row"];
export type Institution = Database["public"]["Tables"]["institutions"]["Row"];
export type Repost = Database["public"]["Tables"]["reposts"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];
export type DailyQuestion = Database["public"]["Tables"]["daily_questions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type NotificationPreferences = Database["public"]["Tables"]["notification_preferences"]["Row"];
export type Block = Database["public"]["Tables"]["blocks"]["Row"];
export type Mute = Database["public"]["Tables"]["mutes"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type GroupConversation = Database["public"]["Tables"]["group_conversations"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];
export type GroupMessage = Database["public"]["Tables"]["group_messages"]["Row"];
export type AdminRole = Database["public"]["Tables"]["admin_roles"]["Row"];
export type ModerationAction = Database["public"]["Tables"]["moderation_actions"]["Row"];
