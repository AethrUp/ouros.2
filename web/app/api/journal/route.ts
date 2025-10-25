import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  JournalEntry,
  CreateJournalEntryInput,
  JournalEntryFilters,
} from '@/types/journal';

/**
 * GET /api/journal - Get all journal entries for the current user
 * Supports query parameters for filtering:
 * - entry_type: Filter by entry type
 * - start_date: Filter by start date
 * - end_date: Filter by end date
 * - has_linked_reading: Filter by whether entry has a linked reading
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: JournalEntryFilters = {};

    if (searchParams.has('entry_type')) {
      filters.entry_type = searchParams.get('entry_type') as any;
    }
    if (searchParams.has('start_date')) {
      filters.start_date = searchParams.get('start_date')!;
    }
    if (searchParams.has('end_date')) {
      filters.end_date = searchParams.get('end_date')!;
    }
    if (searchParams.has('has_linked_reading')) {
      filters.has_linked_reading = searchParams.get('has_linked_reading') === 'true';
    }

    // Build query
    let query = supabase
      .from('journal_entries')
      .select(`
        *,
        linked_reading:readings(
          id,
          reading_type,
          timestamp,
          interpretation,
          intention,
          metadata
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Apply filters
    if (filters.entry_type) {
      query = query.eq('entry_type', filters.entry_type);
    }

    if (filters.start_date) {
      query = query.gte('date', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('date', filters.end_date);
    }

    if (filters.has_linked_reading !== undefined) {
      if (filters.has_linked_reading) {
        query = query.not('linked_reading_id', 'is', null);
      } else {
        query = query.is('linked_reading_id', null);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch journal entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch journal entries' },
        { status: 500 }
      );
    }

    // Transform the data to match our type
    const entries: JournalEntry[] = (data || []).map((entry: any) => ({
      ...entry,
      linked_reading: entry.linked_reading
        ? {
            id: entry.linked_reading.id,
            reading_type: entry.linked_reading.reading_type,
            title: entry.linked_reading.metadata?.title,
            timestamp: entry.linked_reading.timestamp,
            interpretation: entry.linked_reading.interpretation,
            intention: entry.linked_reading.intention,
            metadata: entry.linked_reading.metadata,
          }
        : undefined,
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error in GET /api/journal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/journal - Create a new journal entry
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const input: CreateJournalEntryInput = await request.json();

    // Validate required fields
    if (!input.entry_type || !input.content) {
      return NextResponse.json(
        { error: 'Missing required fields: entry_type and content are required' },
        { status: 400 }
      );
    }

    // Generate default title if not provided
    const date = input.date ? new Date(input.date) : new Date();
    const defaultTitle = `Journal Entry ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`;

    const entryData = {
      user_id: user.id,
      title: input.title || defaultTitle,
      date: input.date || new Date().toISOString(),
      entry_type: input.entry_type,
      content: input.content,
      mood: input.mood,
      energy: input.energy,
      tags: input.tags || [],
      linked_reading_id: input.linked_reading_id,
      is_private: input.is_private ?? true,
    };

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create journal entry:', error);
      return NextResponse.json(
        { error: 'Failed to create journal entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/journal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
