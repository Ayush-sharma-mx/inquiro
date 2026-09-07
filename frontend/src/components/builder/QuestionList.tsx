import React, { useState } from 'react';
import { useBuilderStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TypePicker } from './TypePicker';
import { QuestionType } from '@/types';
import { Plus, GripVertical, Type, AlignLeft, CheckSquare, ChevronDown, Mail, Hash, ToggleLeft, Star } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

const getIcon = (type: QuestionType) => {
  switch (type) {
    case 'short_text': return Type;
    case 'long_text': return AlignLeft;
    case 'multiple_choice': return CheckSquare;
    case 'dropdown': return ChevronDown;
    case 'email': return Mail;
    case 'number': return Hash;
    case 'yes_no': return ToggleLeft;
    case 'rating': return Star;
    default: return Type;
  }
};

const SortableItem = ({ id, question, index }: any) => {
  const { setSelectedQuestion, selectedQuestionId } = useBuilderStore();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = { transform: CSS.Transform.toString(transform), transition };
  const isSelected = selectedQuestionId === id;
  const Icon = getIcon(question.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex cursor-pointer items-center rounded-md border p-3 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
      onClick={() => setSelectedQuestion(id)}
    >
      <div {...attributes} {...listeners} className="mr-3 cursor-grab text-gray-400">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-xs font-medium text-gray-600">
        {index + 1}
      </div>
      <div className="ml-3 flex flex-1 items-center space-x-3 overflow-hidden">
        <Icon className="h-4 w-4 text-gray-500" />
        <span className="truncate text-sm font-medium text-gray-800">
          {question.title || 'Untitled Question'}
        </span>
      </div>
    </div>
  );
};

export const QuestionList: React.FC = () => {
  const { questions, addQuestion, reorderQuestions, setSelectedQuestion, currentForm } = useBuilderStore();
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    reorderQuestions(oldIndex, newIndex);
    
    // Persist reorder to backend
    if (currentForm) {
      const reordered = [...questions];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      try {
        await api.questions.reorder(currentForm.id, reordered.map(q => q.id));
      } catch {
        toast.error('Failed to save question order');
      }
    }
  };

  const handleAddQuestion = async (type: QuestionType) => {
    if (!currentForm) return;
    setIsTypePickerOpen(false);

    const defaultSettings: Record<string, any> = {};
    if (type === 'multiple_choice' || type === 'dropdown') {
      defaultSettings.options = ['Option 1', 'Option 2'];
    } else if (type === 'rating') {
      defaultSettings.steps = 5;
    }

    try {
      const newQuestion = await api.questions.create(currentForm.id, {
        type,
        title: `Untitled ${type.replace('_', ' ')} question`,
        is_required: false,
        settings_json: Object.keys(defaultSettings).length > 0 ? JSON.stringify(defaultSettings) : undefined,
      } as any);
      addQuestion(newQuestion);
      setSelectedQuestion(newQuestion.id);
      toast.success('Question added');
    } catch {
      toast.error('Failed to add question');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {questions.map((q, index) => (
                <SortableItem key={q.id} id={q.id} question={q} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <Button className="w-full" onClick={() => setIsTypePickerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </div>

      <Modal isOpen={isTypePickerOpen} onClose={() => setIsTypePickerOpen(false)} title="Choose Question Type">
        <TypePicker onSelect={handleAddQuestion} />
      </Modal>
    </div>
  );
};

