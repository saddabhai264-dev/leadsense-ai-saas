export const leadStatuses = ["new", "contacted", "interested", "closed"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export const emailStatuses = ["unknown", "valid", "risky", "invalid"] as const;
export type EmailStatus = (typeof emailStatuses)[number];

export type Lead = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_name: string;
  company_domain: string | null;
  company_size: string | null;
  industry: string | null;
  location: string | null;
  linkedin_url: string | null;
  status: LeadStatus;
  score: number;
  score_reason: string | null;
  email_status: EmailStatus;
  email_confidence: number | null;
  email_verification_reason: string | null;
  email_verified_at: string | null;
  source: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteAnalysis = {
  id?: string;
  url: string;
  companyName: string;
  summary: string;
  industry: string;
  employeeRange: string;
  technologies: string[];
  buyingSignals: string[];
  painPoints: string[];
  score: number;
  recommendation: string;
};

export type EmailDraft = {
  subject: string;
  body: string;
  angle: string;
  confidence: number;
};

export const campaignStatuses = ["draft", "active", "paused", "completed"] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export type CampaignStep = {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_days: number;
  subject: string;
  body: string;
  created_at: string;
};

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  audience: string;
  offer: string;
  goal: string;
  status: CampaignStatus;
  total_leads: number;
  reply_rate: number;
  created_at: string;
  updated_at: string;
  campaign_steps?: CampaignStep[];
  campaign_leads?: CampaignLead[];
};

export type CampaignLead = {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: "queued" | "sent" | "replied" | "bounced" | "unsubscribed";
  current_step: number;
  sent_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  added_at: string;
  lead?: Lead;
};

export type SenderAccount = {
  id: string;
  user_id: string;
  provider: "gmail" | "outlook" | "smtp";
  from_name: string;
  from_email: string;
  reply_to: string | null;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password_encrypted: string | null;
  daily_limit: number;
  status: "draft" | "connected" | "error";
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailEvent = {
  id: string;
  user_id: string;
  campaign_id: string | null;
  lead_id: string | null;
  sender_account_id: string | null;
  event_type: "queued" | "sent" | "failed" | "opened" | "clicked" | "replied" | "bounced";
  subject: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          company_name: string | null;
          plan: "free" | "pro" | "team";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          company_name?: string | null;
          plan?: "free" | "pro" | "team";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          full_name: string | null;
          avatar_url: string | null;
          company_name: string | null;
          plan: "free" | "pro" | "team";
        }>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Lead, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      website_analyses: {
        Row: {
          id: string;
          user_id: string;
          url: string;
          result: WebsiteAnalysis;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          url: string;
          result: WebsiteAnalysis;
          created_at?: string;
        };
        Update: Partial<{
          url: string;
          result: WebsiteAnalysis;
        }>;
        Relationships: [];
      };
      email_drafts: {
        Row: {
          id: string;
          user_id: string;
          lead_id: string | null;
          subject: string;
          body: string;
          tone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lead_id?: string | null;
          subject: string;
          body: string;
          tone: string;
          created_at?: string;
        };
        Update: Partial<{
          subject: string;
          body: string;
          tone: string;
        }>;
        Relationships: [];
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, "id" | "created_at" | "updated_at" | "campaign_steps" | "campaign_leads"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Campaign, "id" | "user_id" | "created_at" | "campaign_steps" | "campaign_leads">>;
        Relationships: [];
      };
      campaign_steps: {
        Row: CampaignStep;
        Insert: Omit<CampaignStep, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CampaignStep, "id" | "campaign_id" | "created_at">>;
        Relationships: [];
      };
      campaign_leads: {
        Row: CampaignLead;
        Insert: Omit<CampaignLead, "id" | "added_at" | "lead"> & {
          id?: string;
          added_at?: string;
        };
        Update: Partial<Omit<CampaignLead, "id" | "campaign_id" | "lead_id" | "added_at" | "lead">>;
        Relationships: [];
      };
      sender_accounts: {
        Row: SenderAccount;
        Insert: Omit<SenderAccount, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SenderAccount, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      email_events: {
        Row: EmailEvent;
        Insert: Omit<EmailEvent, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<EmailEvent, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Subscription, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lead_status: LeadStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
