# V2 Field Mapping Reference

## Database Table: `daily_synastry_forecasts`

### Preview Fields (Both V1 & V2)
| Database Column | LLM Response Field | Type | Required |
|----------------|-------------------|------|----------|
| `title` | `topTheme` | TEXT | YES |
| `top_theme` | `topTheme` | TEXT | YES |
| `summary` | `summary` | TEXT | YES |
| `energy_rating` | `energyRating` | TEXT | YES |

### Format Tracking
| Database Column | Value | Type | Required |
|----------------|-------|------|----------|
| `format_version` | 'v2' | TEXT | YES |

### V2 Content (Stored in JSONB)
| Database Column | LLM Response Fields | Type |
|----------------|-------------------|------|
| `full_content_v2` | Entire structured object ↓ | JSONB |

```javascript
full_content_v2: {
  introduction: forecastData.introduction,
  timeBasedForecasts: forecastData.timeBasedForecasts,
  transitAnalysis: forecastData.transitAnalysis,
  relationshipInsights: forecastData.relationshipInsights,
  guidance: forecastData.guidance,
  connectionPractice: forecastData.connectionPractice,
  conclusion: forecastData.conclusion
}
```

### V1 Fields (NULL for V2 Forecasts)
| Database Column | V2 Value | Type |
|----------------|---------|------|
| `morning_forecast` | null | TEXT |
| `afternoon_forecast` | null | TEXT |
| `evening_forecast` | null | TEXT |
| `advice` | null | JSONB |
| `activities_suggested` | null | JSONB |
| `activities_to_avoid` | null | JSONB |
| `transit_analysis` | null | TEXT |

## LLM Response Structure (V2)

The LLM returns this exact JSON structure:

```json
{
  "topTheme": "Compelling theme/title (4-8 words)",
  "summary": "2-3 sentence overview",
  "energyRating": "harmonious|intense|challenging|transformative",

  "introduction": "Opening paragraph (3-4 sentences)",

  "timeBasedForecasts": {
    "morning": {
      "energy": "Single word",
      "narrative": "4-6 sentences",
      "bestFor": ["activity1", "activity2", "activity3"],
      "avoid": ["thing1", "thing2"]
    },
    "afternoon": {
      "energy": "Single word",
      "narrative": "4-6 sentences",
      "bestFor": ["activity1", "activity2", "activity3"],
      "avoid": ["thing1", "thing2"]
    },
    "evening": {
      "energy": "Single word",
      "narrative": "4-6 sentences",
      "bestFor": ["activity1", "activity2", "activity3"],
      "avoid": ["thing1", "thing2"]
    }
  },

  "transitAnalysis": {
    "primary": {
      "aspect": "Primary aspect description",
      "interpretation": "4-6 sentences",
      "timing": "When most potent",
      "advice": "2-3 sentences"
    },
    "secondary": [
      {
        "aspect": "Secondary aspect",
        "interpretation": "3-4 sentences",
        "timing": "When noticeable",
        "advice": "1-2 sentences"
      }
    ]
  },

  "relationshipInsights": [
    "Insight about connection quality (2-3 sentences)",
    "Insight about communication climate (2-3 sentences)",
    "Insight about emotional tone (2-3 sentences)",
    "Insight about growth opportunities (2-3 sentences)",
    "Insight about potential challenges (2-3 sentences)"
  ],

  "guidance": {
    "focusOn": "2-3 sentences",
    "exploreTogether": ["area1", "area2", "area3", "area4"],
    "beMindfulOf": ["thing1", "thing2", "thing3"]
  },

  "connectionPractice": {
    "exercise": "2-3 sentences",
    "affirmation": "One sentence affirmation (8-15 words)",
    "reflectionPrompts": ["prompt1?", "prompt2?", "prompt3?"]
  },

  "conclusion": "Closing paragraph (2-3 sentences)"
}
```

## Handler Processing Flow

### Save (Generate New Forecast)
1. LLM generates V2 JSON response
2. Parse and validate response
3. Create forecast object with `fullContent` = V2 structure
4. Save to database:
   - Preview fields from top-level V2 fields
   - `format_version` = 'v2'
   - `full_content_v2` = structured V2 object
   - V1 fields = null

### Load (From Cache)
1. Check `format_version` column
2. If 'v2': Use `full_content_v2` as `fullContent`
3. If 'v1': Construct `fullContent` from V1 flat fields
4. Return forecast object

## UI Detection

The UI uses type guards to detect format:

```typescript
import { isSynastryV2Format } from '../utils/readingTypeGuards';

const isV2 = forecast ? isSynastryV2Format(forecast.fullContent) : false;

if (isV2) {
  // Render V2 sections
  const morning = forecast.fullContent.timeBasedForecasts.morning;
  const transitPrimary = forecast.fullContent.transitAnalysis.primary;
  // etc.
} else {
  // Render V1 sections
  const morningText = forecast.fullContent.morningForecast;
  // etc.
}
```

## Summary

✅ **Preview fields** use simple mapping: `topTheme` → `title` and `top_theme`
✅ **V2 content** stored as single JSONB object in `full_content_v2`
✅ **V1 fields** set to null for V2 forecasts
✅ **Format detection** via `format_version` column
✅ **No data loss** - complete V2 structure preserved
✅ **UI compatible** - already has detection and rendering logic
