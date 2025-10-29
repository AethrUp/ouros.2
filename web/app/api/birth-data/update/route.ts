import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BIRTH_DATA_MODIFICATION_LIMITS } from '@/types/subscription';
import type { SubscriptionTier } from '@/types/subscription';
import type { BirthData, LocationData } from '@/types/user';

interface UpdateBirthDataRequest {
  birthDate: string;
  birthTime: string;
  birthLocation: LocationData;
  confirmations: {
    deletesHoroscopes: boolean;
    dataCorrect: boolean;
  };
}

interface BirthDataRecord {
  user_id: string;
  birth_date: string;
  birth_time: string;
  location_name: string;
  latitude: string;
  longitude: string;
  location_timezone: string;
  country: string;
  region: string;
  modification_count: number;
  last_modified_at: string | null;
  can_modify_at: string | null;
}

/**
 * POST /api/birth-data/update
 *
 * Updates user's birth data with proper rate limiting and validation.
 * This triggers regeneration of natal chart and daily horoscope.
 *
 * Rate Limits (enforced server-side):
 * - Free: 2 total changes, 30-day cooldown
 * - Premium: 5 total changes, 14-day cooldown
 * - Pro: Unlimited changes, 7-day cooldown
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: UpdateBirthDataRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { birthDate, birthTime, birthLocation, confirmations } = body;

    // 3. Validate confirmations
    if (!confirmations?.deletesHoroscopes || !confirmations?.dataCorrect) {
      return NextResponse.json(
        {
          success: false,
          error: 'User must confirm they understand the consequences of changing birth data',
        },
        { status: 400 }
      );
    }

    // 4. Validate birth data
    const validationError = validateBirthData(birthDate, birthTime, birthLocation);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // 5. Get user's subscription tier
    const { data: subscriptionData, error: subError } = await supabase
      .from('subscription_state')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json(
        { success: false, error: 'Failed to check subscription status' },
        { status: 500 }
      );
    }

    const tier: SubscriptionTier = subscriptionData?.tier || 'free';
    const limits = BIRTH_DATA_MODIFICATION_LIMITS[tier];

    // 6. Check rate limiting using database function
    const { data: checkResult, error: checkError } = await supabase
      .rpc('check_birth_data_modification_allowed', { p_user_id: user.id });

    if (checkError) {
      console.error('Error checking modification permission:', checkError);
      return NextResponse.json(
        { success: false, error: 'Failed to check modification permission' },
        { status: 500 }
      );
    }

    const permissionCheck = checkResult?.[0];
    if (!permissionCheck?.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          reason: permissionCheck?.reason || 'Cooldown period not expired',
          daysRemaining: permissionCheck?.days_remaining || 0,
          tier,
          limits,
        },
        { status: 429 }
      );
    }

    // 7. Get current birth data to check modification count
    const { data: currentBirthData, error: fetchError } = await supabase
      .from('birth_data')
      .select('modification_count')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching current birth data:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch current birth data' },
        { status: 500 }
      );
    }

    // 8. Check total modification count against tier limit
    const currentCount = currentBirthData?.modification_count || 0;
    if (limits.totalChanges !== 'unlimited' && currentCount >= limits.totalChanges) {
      return NextResponse.json(
        {
          success: false,
          error: 'Modification limit reached',
          reason: `You have reached the maximum of ${limits.totalChanges} changes for the ${tier} tier`,
          modificationCount: currentCount,
          tier,
          limits,
        },
        { status: 429 }
      );
    }

    // 9. Begin transaction: Update birth data, delete horoscopes, trigger regeneration
    console.log('🔄 Starting birth data update transaction for user:', user.id);

    // 9a. Update birth data
    const { error: updateError } = await supabase
      .from('birth_data')
      .update({
        birth_date: birthDate,
        birth_time: birthTime,
        time_unknown: false,
        location_name: birthLocation.name,
        latitude: birthLocation.latitude,
        longitude: birthLocation.longitude,
        location_timezone: birthLocation.timezone,
        country: birthLocation.country || '',
        region: birthLocation.region || '',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ Error updating birth data:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update birth data' },
        { status: 500 }
      );
    }

    console.log('✅ Birth data updated');

    // 9b. Update modification tracking using database function
    const { error: trackingError } = await supabase
      .rpc('update_birth_data_modification_tracking', {
        p_user_id: user.id,
        p_cooldown_days: limits.cooldownDays,
      });

    if (trackingError) {
      console.error('❌ Error updating modification tracking:', trackingError);
      // Non-fatal - continue with the process
    } else {
      console.log('✅ Modification tracking updated');
    }

    // 9c. Delete old daily horoscopes (they're now invalid)
    const { error: deleteError } = await supabase
      .from('daily_horoscopes')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Error deleting old horoscopes:', deleteError);
      // Non-fatal - old horoscopes will just be stale
    } else {
      console.log('✅ Old horoscopes deleted');
    }

    // 9d. Delete/invalidate natal chart (will be regenerated)
    const { error: deleteChartError } = await supabase
      .from('natal_charts')
      .delete()
      .eq('user_id', user.id);

    if (deleteChartError) {
      console.error('❌ Error deleting natal chart:', deleteChartError);
      // Non-fatal - chart will be overwritten
    } else {
      console.log('✅ Natal chart deleted');
    }

    // 10. Generate new natal chart
    console.log('🌟 Generating new natal chart...');
    const chartResponse = await fetch(`${request.nextUrl.origin}/api/chart/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        birthDate,
        birthTime,
        birthLocation,
      }),
    });

    if (!chartResponse.ok) {
      const chartError = await chartResponse.json();
      console.error('❌ Failed to generate natal chart:', chartError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate natal chart',
          details: chartError.error,
        },
        { status: 500 }
      );
    }

    const chartData = await chartResponse.json();
    if (!chartData.success) {
      console.error('❌ Chart generation failed:', chartData.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate natal chart',
          details: chartData.error,
        },
        { status: 500 }
      );
    }

    console.log('✅ Natal chart generated');

    // 11. Save natal chart to database
    const natalChart = chartData.data;
    const { error: saveChartError } = await supabase
      .from('natal_charts')
      .upsert({
        user_id: user.id,
        planets: natalChart.planets,
        houses: natalChart.houses,
        aspects: natalChart.aspects || [],
        angles: natalChart.angles,
        house_system: 'placidus',
        calculation_method: 'swiss_ephemeris',
        precision: 'professional',
        data_source: 'swiss_ephemeris',
        version: '1.0',
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (saveChartError) {
      console.error('❌ Error saving natal chart:', saveChartError);
      // Non-fatal - chart is generated, just not saved to DB
    } else {
      console.log('✅ Natal chart saved to database');
    }

    // 12. Get user profile for horoscope generation
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 13. Generate today's horoscope
    console.log('🔮 Generating daily horoscope...');
    const horoscopeResponse = await fetch(`${request.nextUrl.origin}/api/horoscope/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        natalChart: chartData.data,
        userProfile: {
          id: user.id,
          birthDate,
          birthTime,
          birthLocation,
        },
        options: {},
      }),
    });

    if (!horoscopeResponse.ok) {
      const horoscopeError = await horoscopeResponse.json();
      console.error('❌ Failed to generate horoscope:', horoscopeError);
      // Non-fatal - user can generate later
    } else {
      const horoscopeData = await horoscopeResponse.json();
      if (horoscopeData.success) {
        console.log('✅ Daily horoscope generated');
      } else {
        console.error('❌ Horoscope generation failed:', horoscopeData.error);
      }
    }

    // 14. Return success
    console.log('🎉 Birth data update completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Birth data updated successfully',
      data: {
        birthData: {
          birthDate,
          birthTime,
          birthLocation,
          timezone: birthLocation.timezone,
          timeUnknown: false,
        },
        natalChart: chartData.data,
        modificationCount: currentCount + 1,
        tier,
        limits,
      },
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in birth data update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Validate birth data fields
 */
function validateBirthData(
  birthDate: string,
  birthTime: string,
  birthLocation: LocationData
): string | null {
  // Validate birth date
  if (!birthDate) {
    return 'Birth date is required';
  }

  const date = new Date(birthDate);
  if (isNaN(date.getTime())) {
    return 'Invalid birth date format';
  }

  // Birth date must be in the past
  if (date > new Date()) {
    return 'Birth date cannot be in the future';
  }

  // Birth date must be reasonable (after 1900)
  const minDate = new Date('1900-01-01');
  if (date < minDate) {
    return 'Birth date must be after January 1, 1900';
  }

  // Validate birth time
  if (!birthTime) {
    return 'Birth time is required';
  }

  // Birth time must be in HH:MM format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(birthTime)) {
    return 'Birth time must be in HH:MM format (e.g., 14:30)';
  }

  // Validate birth location
  if (!birthLocation) {
    return 'Birth location is required';
  }

  if (!birthLocation.name || birthLocation.name.trim().length === 0) {
    return 'Location name is required';
  }

  if (typeof birthLocation.latitude !== 'number' || birthLocation.latitude < -90 || birthLocation.latitude > 90) {
    return 'Invalid latitude (must be between -90 and 90)';
  }

  if (typeof birthLocation.longitude !== 'number' || birthLocation.longitude < -180 || birthLocation.longitude > 180) {
    return 'Invalid longitude (must be between -180 and 180)';
  }

  if (!birthLocation.timezone || birthLocation.timezone.trim().length === 0) {
    return 'Location timezone is required';
  }

  if (!birthLocation.country) {
    return 'Location country is required';
  }

  return null; // Valid
}
