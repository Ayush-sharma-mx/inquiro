import React from 'react';
import { QuestionType } from '@/types';
import { Type, AlignLeft, CheckSquare, ChevronDown, Mail, Hash, ToggleLeft, Star } from 'lucide-react';

const questionTypes: { type: QuestionType; label: string; icon: React.FC<any> }[] = [
  { type: 'short_text', label: 'Short Text', icon: Type },
  { type: 'long_text', label: 'Long Text', icon: AlignLeft },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'number', label: 'Number', icon: Hash },
  { type: 'yes_no', label: 'Yes/No', icon: ToggleLeft },
  { type: 'rating', label: 'Rating', icon: Star },
];

export const TypePicker: React.FC<{ onSelect: (type: QuestionType) => void }> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {questionTypes.map((t) => (
        <button
          key={t.type}
          onClick={() => onSelect(t.type)}
          className="flex flex-col items-center justify-center rounded-md border border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50"
        >
          <t.icon className="mb-2 h-6 w-6 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{t.label}</span>
        </button>
      ))}
    </div>
  );
};
