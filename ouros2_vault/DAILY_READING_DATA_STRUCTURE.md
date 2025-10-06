# Daily Reading Data Structure

## Overview
The daily reading system fetches astronomical data from multiple sources, sends it to Claude AI (Anthropic), and receives a structured JSON response containing horoscope content.

## Data Flow

### 1. Input Data Collection

#### User Profile Data
```javascript
{
  birthDate: "YYYY-MM-DD",
  birthTime: "HH:MM",
  birthLocation: {
    lat: number,
    lng: number,
    city: string,
    country: string
  },
  timezone: number,
  natalChart: object, // Stored from onboarding
  selectedCategories: ["love", "career", "health", etc.],
  preferences: object
}
```

#### Astronomical Data Sources

**Natal Chart** (from user's birth data):
```javascript
{
  planets: {
    sun: { sign: "Aries", degree: 15.5, house: 10 },
    moon: { sign: "Cancer", degree: 22.3, house: 1 },
    mercury: { sign: "Pisces", degree: 8.7, house: 9 },
    venus: { sign: "Taurus", degree: 12.4, house: 11 },
    mars: { sign: "Leo", degree: 28.9, house: 2 },
    // ... other planets
  },
  houses: { /* house cusps */ },
  aspects: [ /* natal aspects */ ]
}
```

**Current Planetary Positions**:
```javascript
{
  sun: { sign: "Sagittarius", degree: 10.5, isRetrograde: false },
  moon: { sign: "Gemini", degree: 18.2, isRetrograde: false },
  mercury: { sign: "Sagittarius", degree: 5.3, isRetrograde: true },
  venus: { sign: "Capricorn", degree: 22.7, isRetrograde: false },
  mars: { sign: "Scorpio", degree: 14.8, isRetrograde: false },
  // ... other planets
}
```

**Transit Data** (current planets aspecting natal positions):
```javascript
{
  aspects: [
    {
      transitPlanet: "Jupiter",
      aspect: "Trine",
      natalPlanet: "Sun",
      orb: 2.3,
      strength: 85,
      transitInfo: { isRetrograde: false }
    },
    // ... more aspects
  ],
  summary: {
    totalAspects: 15,
    majorAspects: 5,
    activeAspects: 8,
    strongestAspect: { /* aspect details */ }
  },
  ascendant: "Libra"
}
```

### 2. LLM Prompt Structure

The prompt sent to Claude AI includes:

```javascript
`IMPORTANT: Return ONLY valid JSON, no explanatory text before or after.

You are a professional astrologer writing a comprehensive daily horoscope for ${date}.

CONTEXT:
NATAL CHART POSITIONS:
- Natal Sun: Aries 15° (House 10)
- Natal Moon: Cancer 22° (House 1)
- Natal Mercury: Pisces 8° (House 9)
- Natal Venus: Taurus 12° (House 11)
- Natal Mars: Leo 28° (House 2)

CURRENT TRANSITS (15 aspects total):
- Jupiter Trine natal Sun (2.3° orb, 85% strength)
- Saturn Square natal Moon (1.5° orb, 90% strength)
- Mercury Conjunction natal Mercury (0.8° orb, 95% strength) [Retrograde]
[... more transits]

TRANSIT SUMMARY:
- Total aspects: 15
- Major aspects: 5
- Active aspects: 8
- Strongest aspect: Jupiter Trine Sun

ASCENDANT: Libra
TODAY'S DATE: ${date}

Create a DETAILED reading with this exact JSON structure:
[... JSON template follows]`
```

### 3. Expected LLM Output

The Claude AI response must be valid JSON with this structure:

```json
{
  "title": "Cosmic Harmony Awakens Today",
  "summary": "Jupiter's trine to your Sun brings expansive opportunities. Mercury retrograde in your communication sector suggests careful review of important decisions.",

  "fullReading": {
    "introduction": "Today's celestial symphony begins with Jupiter's harmonious trine to your natal Sun, opening doors to personal growth and professional advancement. The cosmic energies are particularly supportive of bold initiatives, though Mercury's retrograde motion advises thorough preparation before taking action. This is a day where your natural leadership qualities shine brightest, attracting both opportunities and admirers to your sphere of influence.",
    "bodyParagraphs": [
      "Morning hours carry the fresh energy of the Moon in Gemini, stimulating your curiosity and desire for meaningful connections. This lunar placement in your partnership sector suggests engaging conversations and potential breakthroughs in understanding. The early hours are ideal for networking, brainstorming, and exploring new ideas that have been percolating in your subconscious.",
      "As the sun reaches its zenith, Mars in Scorpio activates your financial sector with intense focus and determination. This is your power hour for tackling challenging projects and making strategic decisions about resources. The afternoon's energy supports deep work and transformation, particularly in areas where you've felt stuck or stagnant.",
      "Evening brings a gentle shift as Venus in Capricorn encourages grounding and practical expressions of affection. This is an excellent time for solidifying relationships and making concrete plans for the future. The day's lessons integrate beautifully under the evening stars, offering clarity about your next steps forward."
    ],
    "conclusion": "Today's cosmic arrangement reminds you that growth comes through balanced action and thoughtful reflection. Trust in the expansive energy while honoring the need for careful consideration."
  },

  "transitAnalysis": {
    "primary": {
      "aspect": "Jupiter Trine Sun",
      "interpretation": "This powerful aspect brings a wave of optimism and opportunity to your core identity and life path. Jupiter's expansive nature harmonizes beautifully with your Sun, suggesting that doors are opening in career and personal development. This is an excellent time for taking calculated risks, pursuing education, or expanding your professional network. The trine's flowing energy makes success feel almost effortless, though maintaining humility will ensure lasting benefits.",
      "timing": "Most potent during midday hours",
      "advice": "Embrace opportunities for growth but avoid overcommitting. This aspect supports sustainable expansion rather than quick gains."
    },
    "secondary": [
      {
        "aspect": "Mercury Retrograde Conjunction natal Mercury",
        "interpretation": "With Mercury retrograde meeting your natal Mercury, expect profound insights about past communication patterns and thought processes. This is less about delays and more about deep review and understanding.",
        "timing": "Throughout the day, peaks in early morning",
        "advice": "Review important documents, reconnect with old contacts, and reconsider previous ideas that deserve a second look."
      }
    ]
  },

  "timeGuidance": {
    "morning": {
      "energy": "curious",
      "bestFor": ["networking", "brainstorming", "learning"],
      "avoid": ["major decisions", "confrontations"]
    },
    "afternoon": {
      "energy": "intense",
      "bestFor": ["focused work", "financial planning", "transformation"],
      "avoid": ["superficial tasks", "distractions"]
    },
    "evening": {
      "energy": "grounding",
      "bestFor": ["relationship building", "planning", "self-care"],
      "avoid": ["risk-taking", "impulsive actions"]
    }
  },

  "spiritualGuidance": {
    "meditation": "Focus on expanding your energy field while maintaining your center. Visualize golden light emanating from your solar plexus, reaching out to touch your dreams while keeping you rooted in present awareness.",
    "affirmation": "I embrace growth with wisdom and expand with grace",
    "journalPrompts": [
      "What opportunities am I ready to embrace?",
      "How can I communicate more authentically?",
      "Where is expansion needed in my life?"
    ],
    "ritualSuggestion": "Light a yellow or gold candle to honor Jupiter's influence. Write three intentions for growth and place them under the candle, allowing the flame to activate your aspirations."
  },

  "transitInsights": [
    "Jupiter's trine creates a window of opportunity that will remain open for the next two weeks",
    "Mercury retrograde asks you to revisit and refine rather than initiate",
    "The Moon in Gemini heightens mental activity and social connections",
    "Mars in Scorpio intensifies focus on shared resources and transformation",
    "Venus in Capricorn grounds romantic and creative energies in practical reality"
  ],

  "dailyFocus": "Balanced expansion through thoughtful action",

  "advice": "Today's cosmic weather supports growth through careful consideration. Take advantage of Jupiter's beneficial influence while respecting Mercury retrograde's call for review.",

  "explore": ["networking opportunities", "educational pursuits", "creative revision"],

  "limit": ["hasty decisions", "overcommitment", "ignoring details"],

  "weather": {
    "moon": "Gemini Moon brings mental agility and social grace, perfect for meaningful conversations",
    "venus": "Venus in Capricorn adds mature, grounded energy to relationships and creative pursuits",
    "mercury": "Mercury retrograde in Sagittarius prompts philosophical review and reconsidering beliefs"
  },

  "categoryAdvice": {
    "love": {
      "title": "Love & Relationships",
      "content": "Venus in Capricorn encourages building solid foundations in relationships. Express affection through practical support and long-term commitment. Singles may reconnect with past interests under Mercury retrograde's influence."
    },
    "career": {
      "title": "Career & Ambition",
      "content": "Jupiter trine Sun opens professional doors. Present your ideas confidently but wait until Mercury goes direct for contract signing. Focus on relationship building and strategic planning rather than launching new initiatives."
    },
    "health": {
      "title": "Health & Wellness",
      "content": "Mars in Scorpio supports deep healing and transformation. This is an excellent day for therapeutic practices, detox routines, or addressing underlying health patterns. Gemini Moon may create mental restlessness - balance with grounding exercises."
    },
    "finance": {
      "title": "Finance & Resources",
      "content": "Mars activating your financial sector brings focus to shared resources and investments. Review financial agreements carefully under Mercury retrograde. Jupiter's influence suggests potential for increased income through existing channels."
    },
    "creativity": {
      "title": "Creativity & Expression",
      "content": "Mercury retrograde is perfect for revisiting and refining creative projects. Venus in Capricorn adds discipline to artistic pursuits. Focus on perfecting existing work rather than starting new ventures."
    },
    "spirituality": {
      "title": "Spirituality & Growth",
      "content": "Jupiter trine Sun expands spiritual awareness and philosophical understanding. This aspect supports meditation, study of wisdom traditions, and connecting with spiritual teachers or communities."
    },
    "family": {
      "title": "Family & Home",
      "content": "Gemini Moon in your partnership sector may bring important family conversations. Mercury retrograde could resurface old family patterns for healing. Evening's grounding energy supports family bonding."
    },
    "social": {
      "title": "Social & Community",
      "content": "Morning's Gemini Moon is perfect for social connections and community involvement. Jupiter's influence expands your social circle. Reconnect with old friends under Mercury retrograde."
    },
    "personal": {
      "title": "Personal Development",
      "content": "This is a powerful day for personal growth with Jupiter supporting expansion of consciousness. Use Mercury retrograde for inner reflection and understanding past patterns that shape your present."
    }
  }
}
```

### 4. Data Storage Structure

The processed data is stored in Redux state with this structure:

```javascript
{
  dailyHoroscope: {
    date: "YYYY-MM-DD",

    // Lightweight preview for home screen
    preview: {
      title: string,
      summary: string,
      weather: {
        moon: string,
        venus: string,
        mercury: string
      },
      categoryAdvice: {
        [category]: {
          title: string,
          content: string
        }
      }
    },

    // Full content loaded on demand
    fullContent: {
      fullReading: {
        introduction: string,
        bodyParagraphs: [string, string, string],
        conclusion: string
      },
      transitAnalysis: object,
      timeGuidance: object,
      spiritualGuidance: object,
      transitInsights: array,
      astronomicalData: object,
      explore: array,
      limit: array,
      dailyFocus: string,
      advice: string
    },

    // Combined for backward compatibility
    content: object,

    hasFullReading: boolean,
    lastUpdated: "ISO timestamp"
  },

  cosmicWeather: {
    date: "YYYY-MM-DD",
    moon: { title: string, description: string, symbol: "☽" },
    venus: { title: string, description: string, symbol: "♀" },
    mercury: { title: string, description: string, symbol: "☿" },
    lastUpdated: "ISO timestamp"
  }
}
```

### 5. API Response Metadata

Each response includes metadata about the generation:

```javascript
{
  source: "anthropic_ai",
  model: "claude-3-haiku-20240307",
  timestamp: "ISO timestamp",
  usage: {
    inputTokens: number,
    outputTokens: number,
    totalTokens: number
  },
  dataQuality: {
    astrologyApiUsed: boolean,
    transitCount: number,
    significantTransits: number,
    confidence: "low" | "medium" | "high" | "very_high",
    hasExpandedContent: boolean
  }
}
```

## Key Features

1. **Real Astronomical Data**: Fetches actual planetary positions and transits
2. **AI-Generated Content**: Uses Claude AI for personalized interpretations
3. **Category-Specific Advice**: Generates advice for 9 life categories
4. **Expanded Readings**: Includes detailed analysis, time guidance, and spiritual content
5. **Data Validation**: Strict JSON structure validation ensures consistency
6. **Performance Optimization**: Split preview/full content for faster loading
7. **Caching**: Stores readings to avoid unnecessary API calls
8. **Fallback Handling**: Continues with partial data if some API calls fail

## Error Handling

- Missing required fields trigger validation errors
- API failures are logged but don't break the entire flow
- Category advice is required and validated
- Expanded content fields are optional for backward compatibility