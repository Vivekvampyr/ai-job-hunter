export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_gmail_connected: boolean;
  gmail_email?: string;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface ActiveResumeResponse {
  has_resume: boolean;
  resume?: Resume;
  preview_text_snippet?: string;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  resume_id?: string;
  full_name: string;
  email?: string;
  phone?: string;
  target_roles: string[];
  skills: string[];
  experience_level: string;
  preferred_locations: string[];
  work_preferences: string[];
  summary?: string;
  search_queries: string[];
  created_at: string;
  updated_at: string;
}

export interface JobContact {
  email: string;
  phone: string;
  application_form?: string;
  contact_type: string;
}

export interface JobMatchDetail {
  match_level: 'High' | 'Medium' | 'Low' | 'Pending';
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  role_fit: string;
  location_fit: string;
  reasons: string[];
}

export interface Job {
  id: string;
  company_name: string;
  company_website?: string;
  company_logo?: string;
  title: string;
  location: string;
  work_mode: string;
  country?: string;
  city?: string;
  required_skills: string[];
  description: string;
  apply_url: string;
  source_ats: string;
  contact: JobContact;
  match?: JobMatchDetail;
  posted_at?: string;
  fetched_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  status: string;
  match_level: string;
  match_score: number;
  recipient_email?: string;
  email_subject?: string;
  email_body?: string;
  resume_attached: boolean;
  gmail_message_id?: string;
  sent_at?: string;
  created_at: string;
}

export interface EmailPreview {
  job_id: string;
  company_name: string;
  job_title: string;
  recipient_email: string;
  subject: string;
  body: string;
  resume_file_name?: string;
  resume_attached: boolean;
  match: JobMatchDetail;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  full_name: string;
}
