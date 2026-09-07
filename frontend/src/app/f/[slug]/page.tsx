"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Form, Question } from '@/types';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { Button } from '@/components/ui/Button';
import { validateAnswer } from '@/lib/validation';
import { Check } from 'lucide-react';

export default function PublicFormPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const data = await api.public.getForm(slug);
        setForm(data);
        setQuestions(data.questions || []);
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [slug]);

  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = (value: any) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setErrors((prev) => ({ ...prev, [currentQuestion.id]: '' }));
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    const value = answers[currentQuestion.id];
    const error = validateAnswer(currentQuestion, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: error }));
      return;
    }

    if (currentIndex === questions.length - 1) {
      handleSubmit();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const answerPayload = Object.entries(answers).map(([question_id, value]) => ({
        question_id: parseInt(question_id, 10),
        value,
      }));
      await api.public.submitResponse(slug, { answers: answerPayload });
      setSubmitted(true);
    } catch (error: any) {
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: error?.message || 'Submission failed' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation: Enter advances, Arrow Down/Up move between questions.
  // Arrow keys are ignored while typing in a <textarea> so cursor movement between
  // lines still works as expected; Shift+Enter in a textarea inserts a newline
  // instead of advancing.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || submitted) return;
      const target = e.target as HTMLElement;
      const isTextarea = target?.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        if (isTextarea && e.shiftKey) return; // allow newline
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key === 'ArrowDown' && !isTextarea) {
        e.preventDefault();
        handleNext();
        return;
      }

      if (e.key === 'ArrowUp' && !isTextarea) {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, submitted, currentIndex, answers]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  if (notFound || !form) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form not found</h1>
          <p className="mt-2 text-gray-500">This form may be unpublished or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white text-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Thank you!</h1>
          <p className="mt-3 text-lg text-gray-500">
            {form.thank_you_message || 'Your response has been submitted.'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-white text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900">{form.title}</h1>
        <p className="mt-4 text-gray-500">{questions.length} questions</p>
        <Button size="lg" className="mt-8" onClick={() => setStarted(true)}>
          Start <Check className="ml-2 h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-white">
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <motion.div
          className="h-1 bg-blue-600"
          animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="absolute top-6 right-8 text-sm text-gray-400">
        {currentIndex + 1} / {questions.length}
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <span className="text-blue-600 font-medium">{currentIndex + 1} →</span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              {currentQuestion.title}
              {currentQuestion.is_required && <span className="text-red-500">*</span>}
            </h2>
            {currentQuestion.description && (
              <p className="mt-2 text-gray-500">{currentQuestion.description}</p>
            )}

            <div className="mt-8">
              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={handleAnswerChange}
                error={errors[currentQuestion.id]}
                autoFocus
              />

              <div className="mt-12 flex items-center space-x-4">
                <Button size="lg" onClick={handleNext} disabled={isSubmitting}>
                  {currentIndex === questions.length - 1 ? 'Submit' : 'OK'}
                  {currentIndex !== questions.length - 1 && <Check className="ml-2 h-5 w-5" />}
                </Button>
                <span className="text-sm text-gray-500">Press Enter ↵</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
