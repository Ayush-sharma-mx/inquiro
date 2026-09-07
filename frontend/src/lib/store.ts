import { create } from 'zustand';
import { Form, Question } from '../types';

interface BuilderState {
  currentForm: Form | null;
  questions: Question[];
  selectedQuestionId: number | null;
  setForm: (form: Form) => void;
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: number, data: Partial<Question>) => void;
  removeQuestion: (id: number) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  setSelectedQuestion: (id: number | null) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  currentForm: null,
  questions: [],
  selectedQuestionId: null,
  setForm: (form) => set({ currentForm: form, questions: form.questions || [] }),
  setQuestions: (questions) => set({ questions }),
  addQuestion: (question) => set((state) => ({ questions: [...state.questions, question] })),
  updateQuestion: (id, data) =>
    set((state) => ({
      questions: state.questions.map((q) => (q.id === id ? { ...q, ...data } : q)),
    })),
  removeQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
      selectedQuestionId: state.selectedQuestionId === id ? null : state.selectedQuestionId,
    })),
  reorderQuestions: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.questions);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      // Update order_index
      const reordered = result.map((q, index) => ({ ...q, order_index: index }));
      return { questions: reordered };
    }),
  setSelectedQuestion: (id) => set({ selectedQuestionId: id }),
}));
