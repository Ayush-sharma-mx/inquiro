import React from 'react';
import { Question } from '@/types';

interface QuestionProps {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  error?: string;
  autoFocus?: boolean;
}

export const QuestionRenderer: React.FC<QuestionProps> = ({ question, value, onChange, error, autoFocus = false }) => {
  const renderInput = () => {
    switch (question.type) {
      case 'short_text':
        return (
          <input
            type="text"
            autoFocus={autoFocus}
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-2xl focus:border-blue-600 focus:outline-none"
            placeholder="Type your answer here..."
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'long_text':
        return (
          <textarea
            autoFocus={autoFocus}
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-xl focus:border-blue-600 focus:outline-none resize-none"
            placeholder="Type your answer here... (Shift+Enter for a new line)"
            rows={3}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            autoFocus={autoFocus}
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-2xl focus:border-blue-600 focus:outline-none"
            placeholder="name@example.com"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            autoFocus={autoFocus}
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-2xl focus:border-blue-600 focus:outline-none"
            placeholder="0"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
          />
        );
      case 'multiple_choice': {
        const options: string[] = question.settings_json?.options || [];
        return (
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex w-full items-center rounded-lg border-2 px-4 py-3 text-left text-lg transition-colors ${
                  value === opt ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="mr-3 flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm font-medium">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        );
      }
      case 'dropdown': {
        const options: string[] = question.settings_json?.options || [];
        return (
          <select
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-lg focus:border-blue-600 focus:outline-none"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>Select an option</option>
            {options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      }
      case 'yes_no':
        return (
          <div className="flex space-x-4">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`rounded-lg border-2 px-8 py-3 text-lg font-medium transition-colors ${
                  value === opt ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 'rating': {
        const max = question.settings_json?.max || question.settings_json?.steps || 5;
        return (
          <div className="flex space-x-2">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-lg font-medium transition-colors ${
                  value >= n ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div>
      {renderInput()}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
