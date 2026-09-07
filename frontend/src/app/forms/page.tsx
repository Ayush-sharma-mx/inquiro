"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Form } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu } from '@/components/ui/DropdownMenu';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { Plus, FileText } from 'lucide-react';

export default function FormsDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<number | null>(null);
  const router = useRouter();

  const fetchForms = async () => {
    try {
      const data = await api.forms.list();
      setForms(data);
    } catch (error) {
      toast.error('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const handleCreate = async () => {
    try {
      const form = await api.forms.create({ title: 'Untitled Form' });
      router.push(`/forms/${form.id}/builder`);
    } catch (error) {
      toast.error('Failed to create form');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await api.forms.duplicate(id);
      toast.success('Form duplicated');
      fetchForms();
    } catch (error) {
      toast.error('Failed to duplicate form');
    }
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;
    try {
      await api.forms.delete(formToDelete);
      toast.success('Form deleted');
      setForms(forms.filter((f) => f.id !== formToDelete));
    } catch (error) {
      toast.error('Failed to delete form');
    } finally {
      setDeleteModalOpen(false);
      setFormToDelete(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Forms</h1>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Create Form
          </Button>
        </div>

        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <FileText className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">No forms yet</h3>
            <p className="mb-4 text-gray-500">Create your first form to get started</p>
            <Button onClick={handleCreate}>Create Form</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/forms/${form.id}/builder`)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                      {form.title}
                    </h3>
                  </div>
                  <DropdownMenu
                    options={[
                      { label: 'Edit', onClick: () => router.push(`/forms/${form.id}/builder`) },
                      { label: 'View Responses', onClick: () => router.push(`/forms/${form.id}/responses`) },
                      { label: 'Duplicate', onClick: () => handleDuplicate(form.id) },
                      {
                        label: 'Delete',
                        onClick: () => {
                          setFormToDelete(form.id);
                          setDeleteModalOpen(true);
                        },
                        className: 'text-red-600',
                      },
                    ]}
                  />
                </div>
                
                <div className="mt-auto flex items-center justify-between text-sm text-gray-500">
                  <Badge variant={form.status}>{form.status}</Badge>
                  <span>{form.response_count || 0} responses</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Form"
      >
        <p className="mb-6 text-gray-600">
          Are you sure you want to delete this form? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
