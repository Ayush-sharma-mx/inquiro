"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Form, FormResponse } from '@/types';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface SummaryItem {
  type: string;
  title: string;
  response_count: number;
  option_counts?: Record<string, number>;
  min?: number | null;
  max?: number | null;
  avg?: number | null;
  yes_count?: number;
  no_count?: number;
  distribution?: Record<string, number>;
}

export default function ResponsesPage() {
  const params = useParams();
  const formId = parseInt(params.formId as string, 10);
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [summary, setSummary] = useState<Record<string, SummaryItem>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'responses' | 'summary'>('responses');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formData, resData, sumData] = await Promise.all([
          api.forms.get(formId),
          api.responses.list(formId),
          api.responses.summary(formId)
        ]);
        setForm(formData);
        setResponses(resData);
        setSummary(sumData as any);
      } catch (error) {
        toast.error('Failed to load responses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [formId]);

  if (loading || !form) return <div className="p-8 text-center">Loading...</div>;

  const summaryEntries = Object.entries(summary);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center space-x-4 mb-4">
            <button onClick={() => router.push('/forms')} className="rounded-full p-2 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">{form.title} - Responses</h1>
          </div>
          
          <div className="flex space-x-6 border-b border-gray-200">
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'responses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('responses')}
            >
              Responses ({responses.length})
            </button>
            <button
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'summary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {activeTab === 'responses' ? (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {responses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">No responses yet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Submitted At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Completion Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Answers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {responses.map((res, idx) => (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {res.submitted_at ? new Date(res.submitted_at).toLocaleString() : 'Incomplete'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {res.completion_time_seconds ? `${res.completion_time_seconds}s` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {res.answer_count || 0} answers
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {summaryEntries.map(([qId, item]) => (
              <div key={qId} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-1 flex items-center space-x-2">
                  <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{item.type}</span>
                </div>
                <h3 className="mb-4 text-lg font-medium text-gray-900">{item.title}</h3>
                <p className="mb-3 text-sm text-gray-500">{item.response_count} responses</p>
                
                {/* Multiple choice / Dropdown */}
                {item.option_counts && (
                  <div className="space-y-2">
                    {Object.entries(item.option_counts).map(([option, count]) => {
                      const pct = item.response_count > 0 ? (count / item.response_count) * 100 : 0;
                      return (
                        <div key={option} className="flex items-center">
                          <div className="w-1/3 truncate text-sm font-medium text-gray-700">{option}</div>
                          <div className="w-2/3 flex items-center">
                            <div className="mr-3 h-2 w-full rounded-full bg-gray-200">
                              <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-16 text-right text-sm text-gray-600">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Yes/No */}
                {item.type === 'yes_no' && item.yes_count !== undefined && (
                  <div className="flex space-x-6">
                    <div className="flex-1 rounded-md bg-green-50 p-4 text-center">
                      <p className="text-2xl font-bold text-green-700">{item.yes_count}</p>
                      <p className="text-sm text-green-600">Yes</p>
                    </div>
                    <div className="flex-1 rounded-md bg-red-50 p-4 text-center">
                      <p className="text-2xl font-bold text-red-700">{item.no_count}</p>
                      <p className="text-sm text-red-600">No</p>
                    </div>
                  </div>
                )}

                {/* Number stats */}
                {item.type === 'number' && item.avg !== undefined && (
                  <div className="grid grid-cols-3 gap-4 rounded-md bg-gray-50 p-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Min</p>
                      <p className="text-xl font-semibold text-gray-900">{item.min ?? '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Average</p>
                      <p className="text-xl font-semibold text-gray-900">{item.avg?.toFixed(1) ?? '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Max</p>
                      <p className="text-xl font-semibold text-gray-900">{item.max ?? '-'}</p>
                    </div>
                  </div>
                )}

                {/* Rating stats */}
                {item.type === 'rating' && item.avg !== undefined && (
                  <div>
                    <div className="mb-4 rounded-md bg-yellow-50 p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-700">{item.avg?.toFixed(1) ?? '-'}</p>
                      <p className="text-sm text-yellow-600">Average Rating</p>
                    </div>
                    {item.distribution && (
                      <div className="space-y-1">
                        {Object.entries(item.distribution).sort(([a], [b]) => Number(b) - Number(a)).map(([rating, count]) => {
                          const pct = item.response_count > 0 ? (count / item.response_count) * 100 : 0;
                          return (
                            <div key={rating} className="flex items-center text-sm">
                              <span className="w-8 text-right font-medium text-gray-700">★{parseFloat(rating).toFixed(0)}</span>
                              <div className="mx-3 h-2 flex-1 rounded-full bg-gray-200">
                                <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-8 text-gray-600">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Text types */}
                {['short_text', 'long_text', 'email'].includes(item.type) && (
                  <div className="rounded-md bg-gray-50 p-4">
                    <p className="text-sm italic text-gray-500">Text responses collected. View individual responses for details.</p>
                  </div>
                )}
              </div>
            ))}
            {summaryEntries.length === 0 && (
              <div className="p-12 text-center text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
                No summary data available.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

