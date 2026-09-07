export interface Creator { id: number; name: string; email: string; created_at: string; }

export type QuestionType = 'short_text' | 'long_text' | 'multiple_choice' | 'dropdown' | 'email' | 'number' | 'yes_no' | 'rating';

export interface Question {
  id: number;
  form_id: number;
  type: QuestionType;
  title: string;
  description: string | null;
  is_required: boolean;
  order_index: number;
  settings_json: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Form {
  id: number;
  creator_id: number;
  title: string;
  status: 'draft' | 'published';
  share_slug: string | null;
  theme_json: Record<string, any> | null;
  thank_you_message: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  questions?: Question[];
  response_count?: number;
}

export interface FormResponse {
  id: number;
  form_id: number;
  started_at: string;
  submitted_at: string | null;
  is_complete: boolean;
  completion_time_seconds: number | null;
  answers?: Answer[];
  answer_count?: number;
}

export interface Answer {
  id: number;
  response_id: number;
  question_id: number;
  value_text: string | null;
  value_number: number | null;
  value_json: any | null;
  question?: Question;
}

export interface QuestionSummary {
  question_id: number;
  question_title: string;
  question_type: QuestionType;
  response_count: number;
  stats: Record<string, any>;
}
