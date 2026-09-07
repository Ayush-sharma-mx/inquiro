import { Form, Question, FormResponse, FormSummary } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function parseJsonFields(obj: any): any {
  if (Array.isArray(obj)) return obj.map(parseJsonFields);
  if (obj && typeof obj === 'object') {
    const result = { ...obj };
    for (const key of ['settings_json', 'theme_json', 'value_json']) {
      if (typeof result[key] === 'string') {
        try { result[key] = JSON.parse(result[key]); } catch { /* keep as-is */ }
      }
    }
    if (result.questions) result.questions = result.questions.map(parseJsonFields);
    if (result.answers) result.answers = result.answers.map(parseJsonFields);
    return result;
  }
  return obj;
}

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return parseJsonFields(data);
}

export const api = {
  forms: {
    list: () => fetchAPI<Form[]>('/forms'),
    get: (id: number) => fetchAPI<Form>(`/forms/${id}`),
    create: (data?: { title?: string }) => fetchAPI<Form>('/forms', { method: 'POST', body: JSON.stringify(data || {}) }),
    update: (id: number, data: Partial<Form>) => fetchAPI<Form>(`/forms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<void>(`/forms/${id}`, { method: 'DELETE' }),
    duplicate: (id: number) => fetchAPI<Form>(`/forms/${id}/duplicate`, { method: 'POST' }),
    publish: (id: number) => fetchAPI<Form>(`/forms/${id}/publish`, { method: 'POST' }),
    unpublish: (id: number) => fetchAPI<Form>(`/forms/${id}/unpublish`, { method: 'POST' }),
  },
  questions: {
    create: (formId: number, data: Partial<Question>) => fetchAPI<Question>(`/forms/${formId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
    update: (qid: number, data: Partial<Question>) => fetchAPI<Question>(`/questions/${qid}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (qid: number) => fetchAPI<void>(`/questions/${qid}`, { method: 'DELETE' }),
    reorder: (formId: number, questionIds: number[]) => fetchAPI<void>(`/forms/${formId}/questions/reorder`, { method: 'PATCH', body: JSON.stringify({ question_ids: questionIds }) }),
  },
  public: {
    getForm: (slug: string) => fetchAPI<Form>(`/public/forms/${slug}`),
    submitResponse: (slug: string, data: { answers: { question_id: number; value: any }[]; started_at?: string; completion_time_seconds?: number }) =>
      fetchAPI<FormResponse>(`/public/forms/${slug}/responses`, { method: 'POST', body: JSON.stringify(data) }),
  },
  responses: {
    list: (formId: number) => fetchAPI<FormResponse[]>(`/forms/${formId}/responses`),
    get: (formId: number, rid: number) => fetchAPI<FormResponse>(`/forms/${formId}/responses/${rid}`),
    summary: (formId: number) => fetchAPI<FormSummary>(`/forms/${formId}/summary`),
  },
};
