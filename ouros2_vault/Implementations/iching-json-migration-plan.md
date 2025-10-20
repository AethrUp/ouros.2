# I Ching JSON Structure Migration Plan

## Overview
Migrate I Ching interpretations from plain text to structured JSON format for better UI presentation, consistent structure, and enhanced user experience.

---

## Proposed JSON Structure

```typescript
interface IChingInterpretation {
  interpretation: {
    overview: string;                    // 2-3 sentence summary of the main message
    present_situation: string;           // What this hexagram reveals about their current circumstances
    trigram_dynamics: string;            // How the upper and lower trigrams interact to create meaning
    changing_lines: string | null;       // Analysis of any changing lines and their significance (or null if none)
    transformation: string | null;       // If relating hexagram exists, describe the journey from present to future (or null if no relating hexagram)
    guidance: string;                    // Practical advice and actionable wisdom
    timing: string;                      // Insights about when to act, when to wait, or natural timing
    key_insight: string;                 // The most important takeaway for their situation
  };
  tone: 'warm' | 'wise' | 'encouraging' | 'cautionary';
  confidence: 'high' | 'medium' | 'low';
}
```

**Benefits of this structure**:
- Simple and flat - easy to implement and maintain
- Focused on core insights without over-complication
- Includes helpful metadata (tone, confidence)
- Flexible - can handle readings with/without changing lines
- Natural language friendly - each field is a paragraph of text

---

## Migration Steps

### Phase 1: Design & Types (Foundation)

#### Step 1.1: Define TypeScript Interfaces
**File**: `src/types/iching.ts`

- Create `IChingInterpretation` interface (as shown above)
- Create sub-interfaces for nested structures
- Update `IChingReading` interface:
  ```typescript
  interpretation: IChingInterpretation | string; // Support both during migration
  ```

#### Step 1.2: Update Related Types
**File**: `src/types/iching.ts`

- Update `IChingState` in Zustand store type
- Ensure all nested interfaces are properly exported

---

### Phase 2: Prompt Engineering

#### Step 2.1: Design New Prompt Template
**File**: `src/utils/ichingPromptTemplate.ts`

- Add JSON structure specification to prompt
- Include "IMPORTANT: Return ONLY valid JSON" instruction
- Specify exact field requirements
- Provide example structure in prompt
- Add style-specific JSON guidance

**Example prompt addition**:
```
CRITICAL REQUIREMENTS:
1. Return ONLY the JSON object, no other text before or after
2. ALL fields must be present and filled
3. Use the exact structure specified below
4. Ensure all text is specific to the hexagram and question
5. If no changing lines, omit changingLines and relatingHexagram fields

{
  "title": "...",
  "summary": "...",
  ...
}
```

#### Step 2.2: Update Style Instructions
Modify style instructions to specify how to format each JSON section according to the chosen style (traditional, psychological, spiritual, practical).

---

### Phase 3: Validation & Parsing

#### Step 3.1: Create JSON Validation Function
**File**: `src/utils/ichingPromptTemplate.ts`

```typescript
export const validateIChingInterpretationJSON = (
  response: any
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check top-level fields
  if (!response.interpretation) {
    errors.push('Missing interpretation object');
    return { valid: false, errors };
  }
  if (!response.tone) errors.push('Missing tone');
  if (!response.confidence) errors.push('Missing confidence');

  // Check interpretation fields
  const interp = response.interpretation;
  if (!interp.overview) errors.push('Missing interpretation.overview');
  if (!interp.present_situation) errors.push('Missing interpretation.present_situation');
  if (!interp.trigram_dynamics) errors.push('Missing interpretation.trigram_dynamics');
  // Note: changing_lines and transformation can be null
  if (!interp.guidance) errors.push('Missing interpretation.guidance');
  if (!interp.timing) errors.push('Missing interpretation.timing');
  if (!interp.key_insight) errors.push('Missing interpretation.key_insight');

  // Validate tone values
  const validTones = ['warm', 'wise', 'encouraging', 'cautionary'];
  if (response.tone && !validTones.includes(response.tone)) {
    errors.push(`Invalid tone: ${response.tone}`);
  }

  // Validate confidence values
  const validConfidence = ['high', 'medium', 'low'];
  if (response.confidence && !validConfidence.includes(response.confidence)) {
    errors.push(`Invalid confidence: ${response.confidence}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

#### Step 3.2: Update Response Parsing
**File**: `src/handlers/ichingReading.ts`

- Parse JSON response from Claude API
- Validate structure
- Handle parsing errors gracefully
- Add fallback to static interpretation if JSON parsing fails

---

### Phase 4: Data Storage

#### Step 4.1: Update Save Handler
**File**: `src/handlers/ichingReading.ts` - `saveIChingReading()`

**Current** (line 187):
```typescript
interpretation: data.interpretation,
```

**New**:
```typescript
interpretation: typeof data.interpretation === 'string'
  ? data.interpretation
  : JSON.stringify(data.interpretation),
```

#### Step 4.2: Update Load Handler
**File**: `src/handlers/ichingReading.ts` - `loadIChingHistory()`

**Current** (line 310):
```typescript
interpretation: record.interpretation,
```

**New**:
```typescript
interpretation: typeof record.interpretation === 'string'
  ? tryParseJSON(record.interpretation) || record.interpretation
  : record.interpretation,
```

Add helper function:
```typescript
const tryParseJSON = (str: string): IChingInterpretation | null => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};
```

---

### Phase 5: State Management

#### Step 5.1: Update Zustand Store
**File**: `src/store/slices/ichingSlice.ts`

- Update interpretation type
- Ensure setters handle both string and structured interpretation
- Update any interpretation-related selectors

---

### Phase 6: UI Components

#### Step 6.1: Create Structured Interpretation View
**File**: `src/components/iching/StructuredInterpretationView.tsx` (NEW)

Create new component to display structured interpretation:

```typescript
interface StructuredInterpretationViewProps {
  interpretationData: IChingInterpretation;
}

export const StructuredInterpretationView: React.FC<StructuredInterpretationViewProps> = ({
  interpretationData
}) => {
  const { interpretation, tone, confidence } = interpretationData;

  return (
    <View style={styles.container}>
      {/* Metadata indicators */}
      <View style={styles.metadataRow}>
        <Badge text={tone} type="tone" />
        <Badge text={`${confidence} confidence`} type="confidence" />
      </View>

      {/* Overview */}
      <Section title="Overview" icon="✨">
        <Text style={styles.bodyText}>{interpretation.overview}</Text>
      </Section>

      {/* Present Situation */}
      <Section title="Present Situation" icon="☯️">
        <Text style={styles.bodyText}>{interpretation.present_situation}</Text>
      </Section>

      {/* Trigram Dynamics */}
      <Section title="The Energies at Play" icon="⚡">
        <Text style={styles.bodyText}>{interpretation.trigram_dynamics}</Text>
      </Section>

      {/* Changing Lines (if present) */}
      {interpretation.changing_lines && (
        <Section title="Lines of Transformation" icon="🔄">
          <Text style={styles.bodyText}>{interpretation.changing_lines}</Text>
        </Section>
      )}

      {/* Transformation (if relating hexagram exists) */}
      {interpretation.transformation && (
        <Section title="The Journey Ahead" icon="🌙">
          <Text style={styles.bodyText}>{interpretation.transformation}</Text>
        </Section>
      )}

      {/* Guidance */}
      <Section title="Guidance" icon="🧭">
        <Text style={styles.bodyText}>{interpretation.guidance}</Text>
      </Section>

      {/* Timing */}
      <Section title="Timing & Rhythm" icon="⏰">
        <Text style={styles.bodyText}>{interpretation.timing}</Text>
      </Section>

      {/* Key Insight - Highlighted */}
      <Section title="Key Insight" icon="💡" highlighted={true}>
        <Text style={styles.keyInsightText}>{interpretation.key_insight}</Text>
      </Section>
    </View>
  );
};
```

#### Step 6.2: Update InterpretationView
**File**: `src/components/iching/InterpretationView.tsx`

Add type checking to determine which view to render:

```typescript
{interpretation && (
  typeof interpretation === 'string' ? (
    // Legacy plain text view
    <View style={styles.interpretationContent}>
      <Text style={styles.interpretationText}>{interpretation}</Text>
    </View>
  ) : (
    // New structured view
    <StructuredInterpretationView
      interpretation={interpretation}
      question={question}
      primaryHexagram={primaryHexagram}
      relatingHexagram={relatingHexagram}
    />
  )
)}
```

#### Step 6.3: Create Reusable Sub-Components
**Files**: Create new component files as needed

- `Section.tsx` - Section with title, optional icon, optional highlighting
- `Badge.tsx` - Small badge for tone/confidence metadata

---

### Phase 7: Fallback & Migration

#### Step 7.1: Update Static Interpretation
**File**: `src/utils/ichingPromptTemplate.ts` - `constructStaticIChingInterpretation()`

Update to return JSON structure instead of plain text:

```typescript
export const constructStaticIChingInterpretation = (
  question: string,
  primaryHexagram: CastedHexagram,
  relatingHexagram?: CastedHexagram
): IChingInterpretation => {
  const { hexagram: primary, changingLines } = primaryHexagram;
  const hasChangingLines = changingLines.length > 0;

  return {
    interpretation: {
      overview: `You have received Hexagram ${primary.number}: ${primary.englishName} (${primary.chineseName}). This hexagram speaks to themes of ${primary.keywords.slice(0, 3).join(', ')}.`,

      present_situation: `${primary.meaning}\n\nThe Judgment says: ${primary.judgment}\n\nThe Image says: ${primary.image}`,

      trigram_dynamics: `The upper trigram is ${primary.upperTrigram.englishName} (${primary.upperTrigram.attribute}), while the lower trigram is ${primary.lowerTrigram.englishName} (${primary.lowerTrigram.attribute}). The interplay of ${primary.upperTrigram.englishName} above and ${primary.lowerTrigram.englishName} below creates the energy of ${primary.englishName}.`,

      changing_lines: hasChangingLines
        ? `There ${changingLines.length === 1 ? 'is' : 'are'} ${changingLines.length} changing ${changingLines.length === 1 ? 'line' : 'lines'} in this reading, indicating transformation and movement. The changing lines suggest that your situation is in flux and evolution is at hand.`
        : null,

      transformation: relatingHexagram
        ? `The transformation leads to Hexagram ${relatingHexagram.hexagram.number}: ${relatingHexagram.hexagram.englishName}. ${relatingHexagram.hexagram.meaning} This suggests a journey from ${primary.keywords[0]} toward ${relatingHexagram.hexagram.keywords[0]}.`
        : null,

      guidance: `Reflect deeply on how this hexagram's wisdom applies to your question. Consider both the traditional texts and your intuitive understanding. The themes of ${primary.keywords.slice(0, 3).join(', ')} are particularly relevant to your situation at this time.`,

      timing: hasChangingLines
        ? 'This is a time of transition and change. The presence of changing lines indicates that movement is happening now or will soon unfold. Pay attention to the natural rhythm of events.'
        : 'This situation calls for steady presence and awareness. The absence of changing lines suggests a time to embody the qualities of this hexagram fully before seeking change.',

      key_insight: `The I Ching offers guidance for the present moment and the path ahead. ${primary.englishName} invites you to embrace ${primary.keywords[0]} in response to your question.`
    },
    tone: 'wise',
    confidence: 'medium'
  };
};
```

#### Step 7.2: Handle Legacy Readings
Existing readings in database will have plain text. The UI should gracefully handle both:

```typescript
// Type guard
const isStructuredInterpretation = (
  interp: string | IChingInterpretation
): interp is IChingInterpretation => {
  return typeof interp === 'object' && 'title' in interp;
};
```

---

### Phase 8: Testing

#### Step 8.1: Test AI Response Parsing
- Test with various questions and hexagrams
- Verify JSON structure is correct
- Test validation catches malformed responses
- Test fallback to static interpretation

#### Step 8.2: Test Data Persistence
- Create new reading and save
- Load reading from database
- Verify JSON stringification/parsing works
- Test with both new and legacy readings

#### Step 8.3: Test UI Rendering
- Test all sections render correctly
- Test with/without changing lines
- Test with/without relating hexagram
- Test collapsible sections
- Test scrolling and layout

#### Step 8.4: Test Edge Cases
- Empty fields
- Very long text
- Special characters in JSON
- Network failures during generation
- Database failures during save

---

### Phase 9: Documentation

#### Step 9.1: Update Vault Documentation
**File**: `ouros2_vault/iching-interpretation-prompt.md`

- Document new JSON structure
- Add examples of responses
- Update implementation notes
- Add migration notes

#### Step 9.2: Add Code Comments
- Document new interfaces
- Add JSDoc comments to functions
- Explain JSON parsing logic
- Note backward compatibility handling

---

## Migration Strategy

### Option A: Hard Cut-over
- Deploy all changes at once
- All new readings use JSON
- Old readings display as plain text (graceful degradation)
- **Pros**: Simpler, faster
- **Cons**: No migration of old data

### Option B: Gradual Migration with Background Job
- Deploy changes with dual support
- Background job migrates old readings using static interpretation
- **Pros**: All readings eventually structured
- **Cons**: More complex, requires migration script

**Recommendation**: Option A - simpler and old readings are rare in personal app

---

## File Changes Summary

### New Files
1. `src/components/iching/StructuredInterpretationView.tsx` - Main structured view
2. `src/components/iching/Section.tsx` - Reusable section component
3. `src/components/iching/Badge.tsx` - Small metadata badge component

### Modified Files
1. `src/types/iching.ts` - Add new interfaces
2. `src/utils/ichingPromptTemplate.ts` - Update prompt, add validation, update static fallback
3. `src/handlers/ichingReading.ts` - Update save/load handlers
4. `src/store/slices/ichingSlice.ts` - Update types
5. `src/components/iching/InterpretationView.tsx` - Add conditional rendering
6. `ouros2_vault/iching-interpretation-prompt.md` - Update documentation

---

## Rollback Plan

If issues arise:
1. Revert prompt changes (keep plain text request)
2. Revert type changes (keep `interpretation: string`)
3. Revert UI changes (keep simple text display)
4. Database data remains unchanged (already stored as text)

---

## Benefits of JSON Structure

1. **Consistent Experience**: All readings have same structure
2. **Better UI**: Can create beautiful, sectioned displays
3. **Easier Updates**: Can change UI without re-generating interpretations
4. **Selective Display**: Can show/hide sections based on user preference
5. **Enhanced Features**: Can add features like "share this section" or "save to journal"
6. **Better Comparison**: Can compare readings more easily
7. **Future AI Features**: Structured data enables better AI follow-up questions

---

## Timeline Estimate

- Phase 1-2 (Design & Prompt): 1-2 hours
- Phase 3-5 (Validation & State): 1-2 hours
- Phase 6 (UI Components): 2-3 hours (simpler structure)
- Phase 7-8 (Testing): 1-2 hours
- Phase 9 (Documentation): 30 minutes

**Total**: 5.5-9.5 hours (simplified due to cleaner JSON structure)

---

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Define TypeScript interfaces
3. Proceed through phases sequentially
4. Test thoroughly at each phase
5. Deploy when all phases complete
