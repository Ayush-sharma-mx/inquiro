import React, { useEffect, useState, useCallback } from 'react';
import { useBuilderStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Trash2 } from 'lucide-react';
import { OptionsEditor } from './OptionsEditor';
import toast from 'react-hot-toast';

export const QuestionEditor: React.FC = () => {
  const { questions, selectedQuestionId, updateQuestion, removeQuestion } = useBuilderStore();
  const question = questions.find((q) => q.id === selectedQuestionId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Update local state when selected question changes
  useEffect(() => {
    if (question) {
      setTitle(question.title);
      setDescription(question.description || '');
    }
  }, [question?.id, question?.title, question?.description]);

  // Debounced auto-save to backend
  useEffect(() => {
    if (!question) return;
    const timeoutId = setTimeout(async () => {
      if (title !== question.title || description !== (question.description || '')) {
        updateQuestion(question.id, { title, description });
        try {
          await api.questions.update(question.id, { title, description });
        } catch {
          toast.error('Failed to save question');
        }
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [title, description, question?.id]);

  if (!question) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Select a question to edit
      </div>
    );
  }

  const handleSettingsChange = async (newSettings: any) => {
    const merged = { ...(question.settings_json || {}), ...newSettings };
    updateQuestion(question.id, { settings_json: merged });
    try {
      await api.questions.update(question.id, { settings_json: JSON.stringify(merged) } as any);
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleRequiredToggle = async () => {
    const newVal = !question.is_required;
    updateQuestion(question.id, { is_required: newVal });
    try {
      await api.questions.update(question.id, { is_required: newVal });
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    removeQuestion(question.id);
    try {
      await api.questions.delete(question.id);
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Edit Question</h2>
        <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600">
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Question Title</label>
          <input
            className="w-full rounded-md border-0 bg-transparent text-xl font-medium focus:outline-none focus:ring-0"
            placeholder="Type your question here..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description (Optional)</label>
          <textarea
            className="w-full resize-none rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Add a description..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Required</label>
          <button
            onClick={handleRequiredToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${question.is_required ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${question.is_required ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Type specific settings */}
        {(question.type === 'multiple_choice' || question.type === 'dropdown') && (
          <OptionsEditor
            options={question.settings_json?.options || ['Option 1']}
            onChange={(options) => handleSettingsChange({ options })}
          />
        )}

        {question.type === 'rating' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Max Rating</label>
            <select
              value={question.settings_json?.max || question.settings_json?.steps || 5}
              onChange={(e) => handleSettingsChange({ steps: parseInt(e.target.value), max: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value={5}>5 Stars</option>
              <option value={10}>10 Stars</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

