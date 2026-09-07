import React from 'react';
import { Question } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface QuestionProps {
  question: Question;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}

export const QuestionRenderer: React.FC<QuestionProps> = ({ question, value, onChange, error }) => {
  const renderInput = () => {
    switch (question.type) {
      case 'short_text':
        return (
          <input
            type="text"
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-2xl focus:border-blue-600 focus:outline-none"
            placeholder="Type your answer here..."
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'long_text':
        return (
          <textarea
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-xl focus:border-blue-600 focus:outline-none resize-none"
            placeholder="Type your answer here..."
            rows={3}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case 'email':
        return (
          <input
            type="email"
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
            className="w-full border-b-2 border-gray-300 bg-transparent py-2 text-2xl focus:border-blue-600 focus:outline-none"
            placeholder="0"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value))}
          />
        );
      case 'yes_no':
        return (
          <div className="flex space-x-4">
            {['Yes', 'No'].map((opt) => (
              <button
                key={opt}
                className={`flex-1 rounded-md border-2 p-6 text-xl font-medium transition-all ${value === opt ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => onChange(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      case 'multiple_choice':
        const options = question.settings_json?.options || ['Option 1'];
        return (
          <div className="space-y-3">
            {options.map((opt: string, i: number) => {
              const char = String.fromCharCode(65 + i);
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  className={`flex w-full items-center rounded-md border-2 p-4 transition-all ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 hover:bg-gray-50'}`}
                  onClick={() => onChange(opt)}
                >
                  <span className={`mr-4 flex h-8 w-8 items-center justify-center rounded border text-sm font-bold ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-600'}`}>
                    {char}
                  </span>
                  <span className="text-lg">{opt}</span>
                </button>
              );
            })}
          </div>
        );
      case 'dropdown':
        const ddOptions = question.settings_json?.options || [];
        return (
          <select
            className="w-full rounded-md border-2 border-gray-300 bg-transparent p-4 text-xl focus:border-blue-600 focus:outline-none"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>Select an option...</option>
            {ddOptions.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'rating':
        const max = question.settings_json?.max || question.settings_json?.steps || 5;
        return (
          <div className="flex space-x-2">
            {Array.from({ length: max }).map((_, i) => (
              <button
                key={i}
                onClick={() => onChange(i + 1)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-12 w-12 transition-colors ${value && value > i ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`}
                />
              </button>
            ))}
          </div>
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-2 text-3xl font-bold text-gray-900">
        {question.title || 'Untitled Question'}
        {question.is_required && <span className="ml-2 text-red-500">*</span>}
      </h2>
      {question.description && (
        <p className="mb-8 text-lg text-gray-600">{question.description}</p>
      )}
      <div className="mt-8">{renderInput()}</div>
      {error && <p className="mt-4 flex items-center text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
};
