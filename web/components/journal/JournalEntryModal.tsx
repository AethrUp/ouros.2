'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { CreateJournalEntryInput, JournalEntryType } from '@/types/journal';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateJournalEntryInput) => Promise<void>;
  linkedReadingId?: string;
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
}: JournalEntryModalProps) {
  const [formData, setFormData] = useState<CreateJournalEntryInput>({
    entry_type: 'journal',
    content: '',
    title: '',
    mood: undefined,
    energy: undefined,
    tags: [],
    is_private: true,
    linked_reading_id: linkedReadingId,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(formData);
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

                  {/* Entry Type */}
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

                  {/* Title */}
                  <div>
                    <label className="block text-sm  text-white mb-2">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Give your entry a title..."
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder-secondary focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm  text-white mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      placeholder="Write your thoughts, insights, and reflections..."
                      rows={8}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-white placeholder-secondary focus:outline-none focus:border-primary transition-colors resize-none"
                      required
                    />
                  </div>

                  {/* Mood & Energy */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm  text-white mb-2">
                        Mood
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                mood: formData.mood === value ? undefined : value,
                              })
                            }
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              formData.mood && formData.mood >= value
                                ? 'bg-primary text-white'
                                : 'bg-surface text-secondary hover:bg-surface/80'
                            }`}
                          >
                            ⭐
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm  text-white mb-2">
                        Energy
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                energy: formData.energy === value ? undefined : value,
                              })
                            }
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              formData.energy && formData.energy >= value
                                ? 'bg-primary text-white'
                                : 'bg-surface text-secondary hover:bg-surface/80'
                            }`}
                          >
                            ⚡
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm  text-white mb-2">
                      Tags
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add a tag..."
                          className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-white placeholder-secondary focus:outline-none focus:border-primary transition-colors"
                        />
                        <Button
                          type="button"
                          onClick={handleAddTag}
                          variant="ghost"
                          disabled={!tagInput.trim()}
                        >
                          Add
                        </Button>
                      </div>
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-full text-sm bg-primary/20 text-primary flex items-center gap-2"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Privacy */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_private"
                      checked={formData.is_private}
                      onChange={(e) =>
                        setFormData({ ...formData, is_private: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <label htmlFor="is_private" className="text-sm text-secondary">
                      Keep this entry private
                    </label>
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
