import React, { useState } from 'react';
import { useBuilderStore } from '@/lib/store';
import { QuestionRenderer } from '../questions/QuestionRenderer';

export const QuestionPreview: React.FC = () => {
  const { questions, selectedQuestionId } = useBuilderStore();
  const question = questions.find((q) => q.id === selectedQuestionId);
  const [value, setValue] = useState<any>('');

  // Reset value when question changes
  React.useEffect(() => {
    setValue('');
  }, [question?.id]);

  if (!question) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400">
        Live preview will appear here
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-sm font-medium text-gray-500">Live Preview</h3>
      </div>
      <div className="flex flex-1 items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-xl scale-90 transform rounded-lg bg-white p-12 shadow-sm transition-all sm:scale-100">
          <QuestionRenderer
            question={question}
            value={value}
            onChange={setValue}
          />
        </div>
      </div>
    </div>
  );
};
