"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Form, Question } from '@/types';
import { getValidationSchema } from '@/lib/validation';
import { QuestionRenderer } from '@/components/questions/QuestionRenderer';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';

export default function RespondentFlow() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const data = await api.public.getForm(slug);
        setForm(data);
      } catch (error) {
        toast.error('Form not found or unavailable');
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [slug]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!started || submitted) return;
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [started, submitted, currentIndex, answers]);

  const questions = form?.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleStart = () => {
    setStarted(true);
    setStartTime(Date.now());
  };

  const validateCurrent = (): boolean => {
    if (!currentQuestion) return true;
    const schema = getValidationSchema(currentQuestion.type, currentQuestion.is_required);
    try {
      schema.parse(answers[currentQuestion.id]);
      setErrors((prev) => ({ ...prev, [currentQuestion.id]: '' }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [currentQuestion.id]: error.errors[0].message }));
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrent()) {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;
    setIsSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
      question_id: parseInt(qId),
      value: val,
    }));

    const completionTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    try {
      await api.public.submitResponse(slug, {
        answers: formattedAnswers,
        completion_time_seconds: completionTime,
      });
      setSubmitted(true);
    } catch (error) {
      toast.error('Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (val: any) => {
    if (currentQuestion) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: val }));
      // Clear error on change
      if (errors[currentQuestion.id]) {
        setErrors((prev) => ({ ...prev, [currentQuestion.id]: '' }));
      }
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50">Loading...</div>;
  if (!form) return <div className="flex h-screen items-center justify-center bg-gray-50 text-xl text-gray-500">Form not found</div>;

  if (submitted) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="mb-6 rounded-full bg-green-100 p-4">
          <Check className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Thank you!</h1>
        <p className="text-xl text-gray-600">{form.thank_you_message || 'Your response has been recorded.'}</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="mb-8 text-5xl font-bold text-gray-900">{form.title}</h1>
        <Button size="lg" onClick={handleStart} className="text-xl px-12 py-4">
          Start
        </Button>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="fixed top-0 left-0 right-0 z-10">
        <ProgressBar progress={progress} />
      </div>
      
      <main className="flex flex-1 items-center justify-center overflow-hidden p-6 sm:p-12">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-3xl"
            >
              <div className="mb-4 text-sm font-bold text-blue-600">
                {currentIndex + 1} <span className="text-gray-400">/ {questions.length}</span>
              </div>
              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={handleAnswerChange}
                error={errors[currentQuestion.id]}
              />
              
              <div className="mt-12 flex items-center space-x-4">
                <Button size="lg" onClick={handleNext} disabled={isSubmitting}>
                  {currentIndex === questions.length - 1 ? 'Submit' : 'OK'}
                  {currentIndex !== questions.length - 1 && <Check className="ml-2 h-5 w-5" />}
                </Button>
                {currentIndex < questions.length - 1 && (
                  <span className="text-sm text-gray-500">Press Ctrl+Enter ↵</span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Footer */}
      <footer className="fixed bottom-0 right-0 p-6 flex space-x-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || isSubmitting}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </footer>
    </div>
  );
}
