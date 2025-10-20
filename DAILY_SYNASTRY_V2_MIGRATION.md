# Daily Synastry Forecast V2 Migration Guide

## Overview
This migration transitions the daily synastry forecast system from a flat V1 format to a structured V2 format that better matches the LLM output and provides richer relationship insights.

## What Changed

### Database Schema
**New Columns:**
- `format_version` (TEXT, NOT NULL, default 'v1') - Tracks which format the forecast uses
- `full_content_v2` (JSONB) - Stores the complete V2 structured content

**Modified Columns:**
- `morning_forecast` - Now nullable (was NOT NULL)
- `afternoon_forecast` - Now nullable (was NOT NULL)
- `evening_forecast` - Now nullable (was NOT NULL)

**Unchanged Columns (Preview Fields):**
- `title` - Still NOT NULL, populated from `topTheme`
- `summary` - Still NOT NULL
- `energy_rating` - Still NOT NULL
- `top_theme` - Still NOT NULL

### V1 Format (Legacy)
```javascript
fullContent: {
  morningForecast: "Text...",
  afternoonForecast: "Text...",
  eveningForecast: "Text...",
  advice: ["advice1", "advice2"],
  activitiesSuggested: ["activity1", "activity2"],
  activitiesToAvoid: ["avoid1", "avoid2"],
  transitAnalysis: "Text..."
}
```

### V2 Format (New)
```javascript
fullContent: {
  introduction: "Opening paragraph...",
  timeBasedForecasts: {
    morning: {
      energy: "Connected",
      narrative: "4-6 sentences...",
      bestFor: ["activity1", "activity2", "activity3"],
      avoid: ["avoid1", "avoid2"]
    },
    afternoon: { ... },
    evening: { ... }
  },
  transitAnalysis: {
    primary: {
      aspect: "Venus trine Mars",
      interpretation: "4-6 sentences...",
      timing: "Most active during morning",
      advice: "2-3 sentences..."
    },
    secondary: [
      { aspect: "...", interpretation: "...", timing: "...", advice: "..." }
    ]
  },
  relationshipInsights: [
    "Insight 1 (connection quality)",
    "Insight 2 (communication climate)",
    "Insight 3 (emotional tone)",
    "Insight 4 (growth opportunities)",
    "Insight 5 (challenges)"
  ],
  guidance: {
    focusOn: "2-3 sentences...",
    exploreTogether: ["area1", "area2", "area3", "area4"],
    beMindfulOf: ["thing1", "thing2", "thing3"]
  },
  connectionPractice: {
    exercise: "2-3 sentences...",
    affirmation: "Powerful affirmation",
    reflectionPrompts: ["prompt1?", "prompt2?", "prompt3?"]
  },
  conclusion: "Closing paragraph..."
}
```

## Migration Steps

### 1. Run Database Migration
Execute the SQL migration file to add V2 support:

```bash
# Using Supabase CLI
supabase db push migrate_daily_synastry_v2.sql

# Or manually in Supabase SQL Editor
# Copy and paste contents of migrate_daily_synastry_v2.sql
```

### 2. Verify Migration
After running the migration:
- Check that `format_version` column exists with default 'v1'
- Check that `full_content_v2` column exists (nullable)
- Check that V1 fields are now nullable
- Verify existing forecasts have `format_version='v1'`

### 3. Deploy Handler Changes
The handler (`src/handlers/dailySynastryForecast.ts`) has been updated to:
- Save V2 format with `format_version='v2'` and `full_content_v2` populated
- Load both V1 and V2 formats correctly based on `format_version`
- Set `PROMPT_VERSION = '2.0'` for new forecasts

### 4. Test
1. Generate a new forecast - it should be saved as V2
2. Verify in Supabase that:
   - `format_version='v2'`
   - `full_content_v2` contains structured data
   - V1 fields (morning_forecast, etc.) are NULL
3. Load the forecast and verify UI displays correctly
4. Test with an old V1 forecast (if any exist) to ensure backward compatibility

## Backward Compatibility

### During Transition
- **Old V1 forecasts** continue to work - handler detects `format_version='v1'` and loads V1 fields
- **New V2 forecasts** use structured format - handler detects `format_version='v2'` and loads `full_content_v2`
- **UI already supports both** - `isSynastryV2Format()` type guard detects format

### Data Retention
- Existing V1 forecasts in database remain valid and displayable
- They will naturally age out (forecasts are daily)
- No manual migration of old data needed

## Benefits of V2

### 1. Richer Content
- Separate sections for introduction and conclusion
- Time-specific energy labels ("Connected", "Tender", etc.)
- Structured transit analysis with timing information
- Dedicated relationship insights (5 categories)
- Connection practices and reflection prompts

### 2. Better Data Structure
- Semantic grouping of related content
- Queryable JSONB (can search/analyze specific fields)
- No information loss from flattening
- Extensible without schema changes

### 3. Improved UI
- More dynamic display options
- Better section navigation
- Clearer content hierarchy
- Professional presentation

### 4. Future-Proof
- Easy to add new V2 fields without migration
- Analytics-friendly structure
- Better for AI training/improvement

## Rollback Plan

If issues arise, you can temporarily switch back to V1:

1. **Change prompt to V1 format** (ask LLM for flat fields)
2. **Update handler to save V1** (populate V1 fields instead of V2)
3. **Keep format_version='v1'** in saved records

Existing V2 forecasts will remain in database but won't be generated until you switch back.

## Monitoring

After deployment, monitor:
- Forecast generation success rate
- Database save errors (check for null constraint violations)
- UI rendering (ensure V2 sections display correctly)
- Cache loading (verify both V1 and V2 load properly)

## Support

The UI has built-in format detection via `isSynastryV2Format()`:
```typescript
const isV2 = forecast ? isSynastryV2Format(forecast.fullContent) : false;
```

This ensures graceful handling of both formats throughout the application.

## Summary

✅ Database schema updated with V2 support
✅ Handler saves V2 format to `full_content_v2`
✅ Handler loads both V1 and V2 correctly
✅ UI already supports both formats
✅ Backward compatible with existing V1 forecasts
✅ No data loss during transition
✅ Ready for production deployment

---

**Migration Date:** 2025-10-16
**Version:** V2.0
**Status:** Ready to deploy
