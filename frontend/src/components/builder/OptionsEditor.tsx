import React from 'react';
import { Button } from '../ui/Button';
import { Plus, X } from 'lucide-react';

interface OptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

export const OptionsEditor: React.FC<OptionsEditorProps> = ({ options, onChange }) => {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);
  };

  const handleAddOption = () => {
    onChange([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    onChange(newOptions);
  };

  return (
    <div className="space-y-2 mt-4">
      <label className="block text-sm font-medium text-gray-700">Options</label>
      {options.map((opt, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={opt}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button onClick={() => handleRemoveOption(index)} className="p-1 text-gray-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={handleAddOption} className="mt-2 text-blue-600">
        <Plus className="mr-1 h-4 w-4" /> Add Option
      </Button>
    </div>
  );
};
