 Current State Analysis

  Daily Horoscope (The Blueprint ✨)

  - LLM Structure: Highly organized JSON with nested sections
    - Preview (title, summary)
    - Full reading (introduction, 3 time-based paragraphs, conclusion)
    - Time guidance (morning/afternoon/evening with energy + lists)
    - Transit analysis (primary + secondary transits)
    - Insights (5 categories: Energy, Influence, Emotion, Opportunities, Challenges)
    - Guidance (focus, explore, be mindful)
    - Spiritual (meditation, affirmation, journal prompts)
  - UI Display: Section navigation with tabs, user can jump between 10+ sections
  - Experience: Highly digestible, user controls what they read

  Synastry Forecast (Moderate Structure)

  - LLM Structure: Partially structured
    - Time-based forecasts (morning/afternoon/evening) but just strings
    - Lists for advice/activities
    - Transit analysis as one big text block
  - UI Display: 3-section dot navigation
  - Gap: Less hierarchy, transit analysis needs structure

  I Ching (Good Structure, Limited Navigation)

  - LLM Structure: Well-structured with 8 sections
    - Overview, Present, Energies, Changing Lines, Transformation, Guidance, Timing, Key Insight
  - UI Display: Linear scroll with sections but no navigation
  - Gap: No way to jump to specific sections

  Tarot (Minimal Structure)

  - LLM Structure: Single text string
  - UI Display: Just displays the text blob
  - Gap: No structure, no sections, no navigation

  ---
  High-Level Consistency Plan

  1. LLM Prompt Standardization

  Core Principle: All readings should return structured JSON with clear, navigable sections

  For Synastry:
  - Keep time-based structure (morning/afternoon/evening) but add subsections:
    - Each time period gets: energy (brief descriptor), narrative (the story), bestFor (array), avoid (array)
  - Restructure transit analysis into individual transit objects (similar to daily horoscope):
    - Primary transit with: aspect, timing, interpretation, advice
    - Secondary transits (if any)
  - Add relationship insights section (similar to horoscope insights):
    - Connection quality, communication climate, emotional tone, growth opportunities, challenges

  For Tarot:
  - Create structured sections:
    - overview: Overall reading summary
    - cardInsights: Array of objects for each card position with position, card, interpretation
    - synthesis: How the cards work together
    - guidance: Practical advice
    - timing: When to act or wait
    - keyInsight: Highlighted takeaway
    - reflectionPrompts: Journal prompts related to the reading

  For I Ching:
  - Already has good structure, just enhance it:
    - Add reflectionPrompts array for journaling
    - Consider adding practicalGuidance section with actionable bullet points

  2. UI Display Standardization

  Core Principle: All readings get section-based navigation so users can explore what interests them

  Navigation Pattern (adapt daily horoscope's approach):
  - Horizontal scrollable section tabs at top
  - Previous/Next navigation at bottom
  - Display one section at a time to reduce cognitive load

  For Synastry:
  - Sections: Overview → Morning → Afternoon → Evening → Guidance → Transit 1 → Transit 2... → Insights
  - Keep the energy badge and visual hierarchy
  - Add transit timeline visualization (like daily horoscope has)

  For Tarot:
  - Sections: Overview → Card 1 → Card 2 → Card 3... → Synthesis → Guidance → Reflections
  - Each card section shows: position meaning, card image, orientation, interpretation
  - Keep spread visualization but make it clickable to jump to card sections

  For I Ching:
  - Sections: Overview → Present → Energies → Changing Lines → Transformation → Guidance → Timing → Key Insight → Reflections
  - Add section navigation (currently just linear scroll)
  - Keep hexagram display prominent at top

  3. Visual Consistency

  Typography Hierarchy (from daily horoscope):
  - titleText: Main section headers (h1 style)
  - sectionTitle: Subsection headers (h2 style)
  - bodyText: Content paragraphs
  - listBullet: Consistent bullet style (✦)

  Layout Patterns:
  - Header with date/title/actions (save, journal, refresh)
  - Section navigation bar
  - Content area with consistent padding
  - Bottom spacer for comfortable scrolling

  Visual Elements:
  - Energy/tone badges (already in synastry, add to tarot/iching)
  - Timeline visualizations where relevant (transits)
  - Highlighted key insights/affirmations in special containers
  - Consistent icon usage (Ionicons)

  4. Content Organization Principles

  Every reading should have:
  5. Overview/Introduction: Set the stage, what's this reading about?
  6. Main Content: The bulk of the interpretation, broken into logical sections
  7. Guidance: Practical, actionable advice
  8. Timing: When to act or wait (where relevant)
  9. Key Insight: The most important takeaway, visually emphasized
  10. Reflection Prompts: Questions for journaling

  Section Sizing:
  - Each section should be 1-3 paragraphs max (or structured lists)
  - If something runs longer, break it into subsections
  - Goal: User never faces a wall of text

  5. Implementation Strategy

  Phase 1: LLM Prompts
  - Update synastry prompt to return structured sections
  - Create new tarot prompt with structured sections
  - Enhance iching prompt to add reflection prompts

  Phase 2: UI Components
  - Create reusable SectionNavigator component (from daily horoscope pattern)
  - Create reusable ReadingSection component for consistent section display
  - Create reusable section renderers for common patterns (time-based, transit, insight lists)

  Phase 3: Screen Updates
  - Refactor DailySynastryForecastScreen with new navigation
  - Refactor InterpretationScreen (tarot) with section navigation
  - Refactor InterpretationView (iching) with section navigation

  ---
  Key Benefits

  1. Consistency: User learns one navigation pattern, works everywhere
  2. Digestibility: Bite-sized sections instead of walls of text
  3. User Control: Jump to what interests them most
  4. Scannability: Clear hierarchy makes it easy to skim
  5. Reusability: Shared components reduce code duplication
  6. Extensibility: Easy to add new sections or reading types in the future