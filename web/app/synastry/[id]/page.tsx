'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout';
import { Button, LoadingScreen } from '@/components/ui';
import { CompatibilityMeterGroup, SynastryReading } from '@/components/synastry';
import { fadeInUp, transitions } from '@/lib/animations';
import { useAppStore } from '@/store';
import { synastryAPI } from '@/handlers/synastryAPI';
import { SynastryChart, SynastryReading as SynastryReadingType } from '@/types/synastry';
import { savedChartsAPI } from '@/handlers/savedChartsAPI';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export default function SynastryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = params.id as string;
  const type = searchParams.get('type') as 'connection' | 'saved' | null;

  const {
    profile,
    natalChart,
    connections,
    savedCharts,
    loadConnections,
    loadSavedCharts,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [synastryChart, setSynastryChart] = useState<SynastryChart | null>(null);
  const [reading, setReading] = useState<SynastryReadingType | null>(null);
  const [partnerName, setPartnerName] = useState<string>('');
  const [relationshipLabel, setRelationshipLabel] = useState<string | undefined>();

  useEffect(() => {
    loadSynastryData();
  }, [id, type]);

  const loadSynastryData = async () => {
    if (!id || !type) {
      setError('Invalid synastry request');
      setIsLoading(false);
      return;
    }

    if (!profile || !natalChart) {
      setError('User profile or natal chart not loaded');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (type === 'connection') {
        await loadConnectionSynastry(id);
      } else if (type === 'saved') {
        await loadSavedChartSynastry(id);
      } else {
        throw new Error('Invalid synastry type');
      }
    } catch (err: any) {
      console.error('Error loading synastry data:', err);
      setError(err.message || 'Failed to load synastry data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnectionSynastry = async (connectionId: string) => {
    // Ensure connections are loaded
    if (connections.length === 0) {
      await loadConnections();
    }

    // Find the connection
    const connection = connections.find((c) => c.connectionId === connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    setPartnerName(connection.friendDisplayName);
    setRelationshipLabel(connection.relationshipLabel);

    // Check if friend has shared their chart
    if (!connection.friendSharesChart) {
      throw new Error('This friend has not shared their birth chart yet');
    }

    // Fetch friend's profile with natal chart data from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: friendProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar, birth_data, natal_chart_data')
      .eq('id', connection.friendId)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch friend\'s profile');
    }

    if (!friendProfile?.natal_chart_data) {
      throw new Error('Friend\'s natal chart data is not available');
    }

    const friendChart = friendProfile.natal_chart_data;

    // Load or calculate synastry chart (profile and natalChart are guaranteed non-null from earlier check)
    const chart = await synastryAPI.loadSynastryChart(
      profile!.id,
      connection.friendId,
      natalChart!,
      friendChart,
      false
    );

    if (!chart) {
      throw new Error('Failed to calculate synastry chart');
    }

    setSynastryChart(chart);

    // Load existing reading or generate new one
    const existingReadings = await synastryAPI.loadSynastryReadings(connectionId);

    if (existingReadings.length > 0) {
      setReading(existingReadings[0]);
    } else {
      // Generate new reading via API route
      const response = await fetch('/api/synastry/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          synastryChart: chart,
          person1Chart: natalChart!,
          person2Chart: friendChart,
          person1Name: profile!.displayName,
          person2Name: connection.friendDisplayName,
          connectionId,
          relationshipContext: connection.relationshipLabel,
          detailLevel: 'detailed',
        }),
      });

      const result = await response.json();

      if (!result.success || !result.reading) {
        throw new Error(result.error || 'Failed to generate reading');
      }

      // Save the reading to database
      const savedReading = await synastryAPI.saveSynastryReading(result.reading);
      setReading(savedReading);
    }
  };

  const loadSavedChartSynastry = async (savedChartId: string) => {
    // Ensure saved charts are loaded
    if (savedCharts.length === 0) {
      await loadSavedCharts();
    }

    // Find the saved chart
    const savedChart = savedCharts.find((c) => c.id === savedChartId);
    if (!savedChart) {
      // Try fetching it directly
      const fetchedChart = await savedChartsAPI.getSavedChart(savedChartId);
      if (!fetchedChart) {
        throw new Error('Saved chart not found');
      }

      setPartnerName(fetchedChart.name);
      setRelationshipLabel(fetchedChart.relationship);

      // Load or calculate synastry chart
      const chart = await synastryAPI.loadSynastryChartWithSaved(
        profile!.id,
        savedChartId,
        natalChart!,
        fetchedChart.natalChart,
        false
      );

      if (!chart) {
        throw new Error('Failed to calculate synastry chart');
      }

      setSynastryChart(chart);

      // Load existing reading or generate new one
      const existingReadings = await synastryAPI.loadSynastryReadingsForSavedChart(savedChartId);

      if (existingReadings.length > 0) {
        setReading(existingReadings[0]);
      } else {
        // Generate new reading via API route
        const response = await fetch('/api/synastry/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            synastryChart: chart,
            person1Chart: natalChart!,
            person2Chart: fetchedChart.natalChart,
            person1Name: profile!.displayName,
            person2Name: fetchedChart.name,
            savedChartId,
            relationshipContext: fetchedChart.relationship,
            detailLevel: 'detailed',
          }),
        });

        const result = await response.json();

        if (!result.success || !result.reading) {
          throw new Error(result.error || 'Failed to generate reading');
        }

        // Save the reading to database
        const savedReading = await synastryAPI.saveSynastryReading(result.reading);
        setReading(savedReading);
      }
    } else {
      setPartnerName(savedChart.name);
      setRelationshipLabel(savedChart.relationship);

      // Load or calculate synastry chart
      const chart = await synastryAPI.loadSynastryChartWithSaved(
        profile!.id,
        savedChartId,
        natalChart!,
        savedChart.natalChart,
        false
      );

      if (!chart) {
        throw new Error('Failed to calculate synastry chart');
      }

      setSynastryChart(chart);

      // Load existing reading or generate new one
      const existingReadings = await synastryAPI.loadSynastryReadingsForSavedChart(savedChartId);

      if (existingReadings.length > 0) {
        setReading(existingReadings[0]);
      } else {
        // Generate new reading via API route
        const response = await fetch('/api/synastry/reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            synastryChart: chart,
            person1Chart: natalChart!,
            person2Chart: savedChart.natalChart,
            person1Name: profile!.displayName,
            person2Name: savedChart.name,
            savedChartId,
            relationshipContext: savedChart.relationship,
            detailLevel: 'detailed',
          }),
        });

        const result = await response.json();

        if (!result.success || !result.reading) {
          throw new Error(result.error || 'Failed to generate reading');
        }

        // Save the reading to database
        const savedReading = await synastryAPI.saveSynastryReading(result.reading);
        setReading(savedReading);
      }
    }
  };

  if (isLoading) {
    return <LoadingScreen messages={['Calculating synastry...', 'Analyzing compatibility...', 'Generating reading...']} />;
  }

  if (error) {
    return (
      <MainLayout headerTitle="Synastry">
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-md w-full text-center"
          >
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-serif text-white mb-3">Unable to Load Synastry</h2>
              <p className="text-secondary mb-6">{error}</p>
              <Button onClick={() => router.push('/friends')} variant="primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Friends
              </Button>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  if (!synastryChart || !reading) {
    return (
      <MainLayout headerTitle="Synastry">
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-md w-full text-center"
          >
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💫</span>
              </div>
              <h2 className="text-2xl font-serif text-white mb-3">No Synastry Data Available</h2>
              <p className="text-secondary mb-6">Unable to load compatibility reading</p>
              <Button onClick={() => router.push('/friends')} variant="primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Friends
              </Button>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout headerTitle="Synastry">
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={transitions.spring}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <Button
                onClick={() => router.push('/friends')}
                variant="ghost"
                size="small"
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Friends
              </Button>

              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-serif text-xl">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-serif text-primary">{partnerName}</h1>
                  <p className="text-sm text-secondary uppercase tracking-wider">Synastry Reading</p>
                </div>
              </div>

              {relationshipLabel && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary uppercase tracking-wide">
                    {relationshipLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Compatibility Meters */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <CompatibilityMeterGroup
                overall={synastryChart.compatibilityScore || 0}
                fire={synastryChart.elementCompatibility?.fire}
                earth={synastryChart.elementCompatibility?.earth}
                air={synastryChart.elementCompatibility?.air}
                water={synastryChart.elementCompatibility?.water}
                cardinal={synastryChart.modalityCompatibility?.cardinal}
                fixed={synastryChart.modalityCompatibility?.fixed}
                mutable={synastryChart.modalityCompatibility?.mutable}
              />
            </div>

            {/* Synastry Reading */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <SynastryReading interpretation={reading.interpretation} synastryChart={synastryChart} />
            </div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center text-xs text-secondary"
            >
              <p>Reading generated {new Date(reading.createdAt).toLocaleDateString()}</p>
              {reading.model && <p className="mt-1">Powered by {reading.model}</p>}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
