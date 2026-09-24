import axios from 'axios';
import type {
  User,
  CandidateProfile,
  Job,
  Application,
  EmailPreview,
  ActiveResumeResponse,
  AuthTokenResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication
  async register(data: { email: string; password: string; full_name: string }): Promise<AuthTokenResponse> {
    const res = await apiClient.post<AuthTokenResponse>('/auth/register', data);
    if (res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
    }
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthTokenResponse> {
    const res = await apiClient.post<AuthTokenResponse>('/auth/login', data);
    if (res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
    }
    return res.data;
  },

  async loginDemo(): Promise<AuthTokenResponse> {
    const res = await apiClient.post<AuthTokenResponse>('/auth/demo');
    if (res.data.access_token) {
      localStorage.setItem('token', res.data.access_token);
    }
    return res.data;
  },

  logout() {
    localStorage.removeItem('token');
  },

  // Current user
  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  // Resumes
  async getCurrentResume(): Promise<ActiveResumeResponse> {
    const res = await apiClient.get<ActiveResumeResponse>('/resumes/current');
    return res.data;
  },

  async uploadResume(file: File): Promise<{ message: string; profile_extracted: boolean }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Candidate Profile
  async getProfile(): Promise<CandidateProfile> {
    const res = await apiClient.get<CandidateProfile>('/profiles');
    return res.data;
  },

  async updateProfile(data: Partial<CandidateProfile>): Promise<CandidateProfile> {
    const res = await apiClient.put<CandidateProfile>('/profiles', data);
    return res.data;
  },

  async getSearchQueries(): Promise<string[]> {
    const res = await apiClient.get<{ queries: string[] }>('/profiles/queries');
    return res.data.queries;
  },

  // Jobs & Public ATS
  async searchJobs(params: {
    query?: string;
    locations?: string[];
    work_modes?: string[];
    match_levels?: string[];
  }): Promise<Job[]> {
    const res = await apiClient.post<{ jobs: Job[] }>('/jobs/search', params);
    return res.data.jobs;
  },

  async getJobs(params?: {
    query?: string;
    location?: string;
    work_mode?: string;
    match_level?: string;
  }): Promise<Job[]> {
    const res = await apiClient.get<{ jobs: Job[] }>('/jobs', { params });
    return res.data.jobs;
  },

  async getJobDetail(jobId: string): Promise<Job> {
    const res = await apiClient.get<Job>(`/jobs/${jobId}`);
    return res.data;
  },

  // Applications & Gmail
  async generateEmail(jobId: string, tone = 'confident and professional'): Promise<EmailPreview> {
    const res = await apiClient.post<EmailPreview>('/applications/generate-email', {
      job_id: jobId,
      tone,
    });
    return res.data;
  },

  async sendApplication(data: {
    job_id: string;
    recipient_email: string;
    subject: string;
    body: string;
    attach_resume: boolean;
    save_as_draft: boolean;
  }): Promise<Application> {
    const res = await apiClient.post<Application>('/applications/send', data);
    return res.data;
  },

  async getApplications(): Promise<Application[]> {
    const res = await apiClient.get<{ applications: Application[] }>('/applications');
    return res.data.applications;
  },

  // Excel Export URL generator
  getExcelExportUrl(params?: {
    query?: string;
    location?: string;
    work_mode?: string;
    match_level?: string;
  }): string {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.work_mode && params.work_mode !== 'All') queryParams.append('work_mode', params.work_mode);
    if (params?.match_level && params.match_level !== 'All') queryParams.append('match_level', params.match_level);
    return `${API_BASE_URL}/export/excel?${queryParams.toString()}`;
  },

  // Gmail OAuth
  async getGmailAuthUrl(): Promise<string> {
    const res = await apiClient.get<{ auth_url: string }>('/gmail/auth-url');
    return res.data.auth_url;
  },

  async connectGmail(code: string): Promise<User> {
    const res = await apiClient.post<User>('/gmail/connect', { code });
    return res.data;
  },

  async disconnectGmail(): Promise<User> {
    const res = await apiClient.post<User>('/gmail/disconnect');
    return res.data;
  },
};
