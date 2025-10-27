'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, TextArea } from '@/components/ui';
import { CreateJournalEntryInput, JournalEntryType } from '@/types/journal';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateJournalEntryInput) => Promise<void>;
  linkedReadingId?: string;
  initialContent?: string;
  initialPrompt?: string; // The prompt text to display above content
  initialTitle?: string;
  initialType?: JournalEntryType;
  lockType?: boolean; // If true, entry type is locked and hidden
}

const entryTypes: { value: JournalEntryType; label: string }[] = [
  { value: 'journal', label: 'General Journal' },
  { value: 'tarot', label: 'Tarot Reflection' },
  { value: 'iching', label: 'I Ching Insight' },
  { value: 'dream', label: 'Dream Journal' },
  { value: 'horoscope', label: 'Horoscope Notes' },
  { value: 'synastry', label: 'Synastry Reflection' },
];

export function JournalEntryModal({
  isOpen,
  onClose,
  onSave,
  linkedReadingId,
  initialContent,
  initialPrompt,
  initialTitle,
  initialType,
  lockType = false,
}: JournalEntryModalProps) {
  const [formData, setFormData] = useState<CreateJournalEntryInput>({
    entry_type: initialType || 'journal',
    content: initialContent || '',
    title: initialTitle || '',
    mood: undefined,
    energy: undefined,
    tags: [],
    is_private: true,
    linked_reading_id: linkedReadingId,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when initial values change
  useEffect(() => {
    if (isOpen) {
      setFormData({
        entry_type: initialType || 'journal',
        content: initialContent || '',
        title: initialTitle || '',
        mood: undefined,
        energy: undefined,
        tags: [],
        is_private: true,
        linked_reading_id: linkedReadingId,
      });
    }
  }, [isOpen, initialContent, initialTitle, initialType, linkedReadingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    // Prepend today's date to title in "Month date" format
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const datePrefix = `${monthNames[today.getMonth()]} ${today.getDate()}`;

    const finalTitle = formData.title
      ? `${datePrefix} - ${formData.title}`
      : datePrefix;

    try {
      setIsSaving(true);
      await onSave({
        ...formData,
        title: finalTitle,
      });
      // Reset form
      setFormData({
        entry_type: 'journal',
        content: '',
        title: '',
        mood: undefined,
        energy: undefined,
        tags: [],
        is_private: true,
        linked_reading_id: linkedReadingId,
      });
      setTagInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-2xl font-serif text-primary">New Journal Entry</h2>
                <button
                  onClick={onClose}
                  className="text-secondary hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="p-6 space-y-6">
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Entry Type - Only show if not locked */}
                  {!lockType && (
                    <div>
                      <label className="block text-sm  text-white mb-2">
                        Entry Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {entryTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, entry_type: type.value })
                            }
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                              formData.entry_type === type.value
                                ? 'bg-primary text-white'
                                : 'bg-surface text-secondary hover:text-white border border-border'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prompt Display (if provided) */}
                  {initialPrompt && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                      <p className="text-sm text-white/80 italic">"{initialPrompt}"</p>
                    </div>
                  )}

                  {/* Title */}
                  <div className="mb-6">
                    <Input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="title (optional)"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <TextArea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      label="your thoughts"
                      rows={8}
                      resize="none"
                      required
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-surface/50">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving || !formData.content.trim()}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
