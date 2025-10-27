'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Plus, Filter, Search, Link as LinkIcon } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button, LoadingScreen } from '@/components/ui';
import { fadeInUp, transitions } from '@/lib/animations';
import { useJournal } from '@/lib/hooks/useJournal';
import { JournalEntryType } from '@/types/journal';
import { format } from 'date-fns';
import { JournalEntryModal } from '@/components/journal/JournalEntryModal';
import { cn } from '@/lib/utils';

type TabType = 'all' | JournalEntryType;

export const dynamic = 'force-dynamic';

export default function JournalPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialModalData, setInitialModalData] = useState<{
    prompt?: string;
    title?: string;
    type?: JournalEntryType;
    readingId?: string;
  }>({});

  // Handle query parameters
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    const readingId = searchParams.get('readingId');
    const type = searchParams.get('type') as JournalEntryType | null;
    const title = searchParams.get('title');

    if (prompt) {
      setInitialModalData({
        prompt: prompt,
        title: title || undefined,
        type: type || 'horoscope',
        readingId: readingId || undefined,
      });
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Memoize filters object to prevent infinite loop
  const filters = useMemo(
    () => (activeTab !== 'all' ? { entry_type: activeTab } : undefined),
    [activeTab]
  );

  const { entries, loading, error, createEntry, refetch } = useJournal(filters);

  // Filter entries by search query
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      entry.title?.toLowerCase().includes(searchLower) ||
      entry.content.toLowerCase().includes(searchLower) ||
      entry.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const tabs: { label: string; value: TabType }[] = [
    { label: 'ALL', value: 'all' },
    { label: 'JOURNAL', value: 'journal' },
    { label: 'TAROT', value: 'tarot' },
    { label: 'I CHING', value: 'iching' },
    { label: 'DREAMS', value: 'dream' },
    { label: 'HOROSCOPE', value: 'horoscope' },
  ];

  const handleCreateEntry = async (data: any) => {
    try {
      await createEntry(data);
      setIsModalOpen(false);
      await refetch();
    } catch (err) {
      console.error('Failed to create entry:', err);
    }
  };

  return (
    <MainLayout headerTitle="Journal">
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-5xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif text-primary">
                    Spiritual Journal
                  </h2>
                  <p className="text-secondary text-sm">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Entry
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-white placeholder-secondary focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-8 border-b-2 border-border mb-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'pb-3 text-sm font-normal transition-colors relative whitespace-nowrap',
                    activeTab === tab.value
                      ? 'text-white'
                      : 'text-secondary hover:text-white'
                  )}
                  style={{ letterSpacing: '0.15em' }}
                >
                  {tab.label}
                  {activeTab === tab.value && (
                    <motion.div
                      layoutId="activeJournalTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="min-h-[600px]">
              {loading ? (
                <div className="flex justify-center items-center h-[600px]">
                  <LoadingScreen context="general" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <p className="text-red-400 mb-4">Failed to load journal entries</p>
                  <Button variant="ghost" onClick={refetch}>
                    Try Again
                  </Button>
                </div>
              ) : filteredEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <BookOpen className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-xl  text-white mb-2">
                    {searchQuery ? 'No entries found' : 'No journal entries yet'}
                  </h3>
                  <p className="text-secondary mb-6">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Start documenting your spiritual journey'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsModalOpen(true)}>
                      Create Your First Entry
                    </Button>
                  )}
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary uppercase">
                              {entry.entry_type}
                            </span>
                            {entry.linked_reading_id && (
                              <span className="flex items-center gap-1 text-xs text-secondary">
                                <LinkIcon className="w-3 h-3" />
                                Linked Reading
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-secondary">
                            {format(new Date(entry.date), 'MMM d, yyyy')}
                          </span>
                        </div>

                        <h3 className="text-xl font-serif text-accent mb-2 group-hover:text-primary transition-colors">
                          {entry.title || `Journal Entry ${format(new Date(entry.date), 'MMM d')}`}
                        </h3>

                        <p className="text-secondary line-clamp-2 mb-3">
                          {entry.content}
                        </p>

                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {entry.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded text-xs bg-surface text-secondary"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {(entry.mood || entry.energy) && (
                          <div className="flex gap-4 mt-3 text-sm text-secondary">
                            {entry.mood && (
                              <span>Mood: {'⭐'.repeat(entry.mood)}</span>
                            )}
                            {entry.energy && (
                              <span>Energy: {'⚡'.repeat(entry.energy)}</span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Journal Entry Modal */}
      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setInitialModalData({});
        }}
        onSave={handleCreateEntry}
        linkedReadingId={initialModalData.readingId}
        initialPrompt={initialModalData.prompt}
        initialTitle={initialModalData.title}
        initialType={initialModalData.type}
        lockType={!!initialModalData.type}
      />
    </MainLayout>
  );
}
