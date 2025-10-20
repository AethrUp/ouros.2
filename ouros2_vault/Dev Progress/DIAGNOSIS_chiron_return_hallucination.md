# Diagnosis: Daily Horoscope "Chiron Return" Hallucination

**Date:** 2025-10-10
**Issue:** User (age 35, born 1990) receiving horoscope readings mentioning "Chiron return at age 50" for 3 consecutive days
**Severity:** Critical - LLM is inventing astrological events that won't occur for 15 years

---

## Investigation Summary

### User Report
- Getting similar daily horoscope readings for Oct 8, 9, 10
- Readings mention "Chiron return" which only happens at age 50-51
- User is 35 years old (born 1990)
- Questioning if daily transits are being calculated/stored properly

### Initial Hypothesis (INCORRECT)
❌ Thought Chiron wasn't being calculated
❌ Thought AI was hallucinating Chiron entirely
❌ Thought cache was broken and returning same reading

### Actual Findings

#### ✅ What's Working Correctly
1. **Transit calculations are accurate**
   - Swiss Ephemeris API calculates real-time positions
   - `getNatalTransits()` gets current transits vs natal chart
   - `getTropicalTransits()` gets current planetary positions
   - Data includes Chiron in both natal and current positions

2. **Caching works correctly**
   - New forecast generated each day
   - Different `generated_at` timestamps
   - Different titles and content
   - Properly invalidates after 24 hours

3. **Data storage is correct**
   - Transits stored in database with proper timestamps
   - JSONB fields contain accurate astronomical data
   - No corruption in natal or current position data

#### ❌ What's Broken

**Root Cause: Ambiguous Prompt + No Temperature Setting**

The LLM is seeing:
```
NATAL CHART POSITIONS:
- Natal Chiron: Cancer 10.5° (House 3)

CURRENT PLANETARY POSITIONS:
- Chiron: Aries 0.0°

CURRENT TRANSITS (50 aspects total):
- Mars Trine natal Chiron (1.9° orb, 75% strength)
- Chiron Trine natal Sun (0.5° orb, 94% strength)
[NO "Chiron to natal Chiron" aspect listed]
```

And doing this:
1. Calculates aspect between natal Chiron (Cancer 10°) and current Chiron (Aries 0°) = ~90° square
2. Recognizes this as a Chiron-to-Chiron aspect
3. Draws on general astrological knowledge that "Chiron returns are significant at age 50"
4. **Incorrectly identifies the square as a "return"** (which requires conjunction)

---

## Why It Happens 3 Days in a Row

### Slow-Moving Chiron
- Chiron moves only ~0.067° per day (4 arc-minutes)
- A square aspect with 8° orb stays active for **months**
- Oct 8, 9, 10 all have essentially the same Chiron position

### Temperature 1.0 (Default)
- No temperature set in `horoscopeGeneration.ts`
- Defaults to 1.0 = maximum creativity
- Allows interpretive leaps and pattern matching
- LLM consistently makes same "Chiron return" interpretation

### Pattern Reinforcement
Once LLM identifies "Chiron square natal Chiron" as significant:
- It repeatedly emphasizes this theme
- With temp 1.0, creative interpretation is encouraged
- No constraints prevent this misinterpretation

---

## Technical Details

### The Missing Aspect

The Swiss Ephemeris API `/api/transits` endpoint:
- ✅ Calculates: Sun to natal Chiron, Mars to natal Chiron, etc.
- ✅ Calculates: Chiron to natal Sun, Chiron to natal Moon, etc.
- ❌ Does NOT calculate: Chiron to natal Chiron

**Why?** The API likely filters out same-planet aspects or they're excluded from the top 8 strongest transits sent to LLM.

**Result:** LLM never sees "Chiron Square natal Chiron" in the CURRENT TRANSITS list, but calculates it from seeing both positions.

### Prompt Structure Issues

#### Issue 1: No Purpose Statements
The prompt labels sections but doesn't explain their purpose:
```
CONTEXT:
NATAL CHART POSITIONS:
[data]

CURRENT PLANETARY POSITIONS:
[data]

CURRENT TRANSITS:
[data]
```

**Missing:**
- What each section is FOR
- Which data to interpret vs which is just context
- Constraints on aspect calculation

#### Issue 2: Ambiguous Naming
"CURRENT PLANETARY POSITIONS" sounds like it's for calculating transits when it's really just cosmic weather context.

#### Issue 3: No Explicit Constraints
Nothing says:
- "ONLY interpret aspects listed in CURRENT TRANSITS"
- "Do NOT calculate aspects yourself"
- "If aspect isn't in the list, don't discuss it"

#### Issue 4: No Temperature Control
- Code at `horoscopeGeneration.ts:115-124` doesn't set temperature
- Defaults to 1.0 (max creativity)
- Should be 0.3-0.5 for factual interpretation

---

## The Chiron Return vs Square Confusion

### What's Actually Happening
- User's natal Chiron: ~Cancer 10° (born 1990)
- Current Chiron: Aries 0° (Oct 2025)
- Angular separation: ~90° = **SQUARE** aspect
- This is a regular Chiron transit, happens every ~12 years

### What LLM Claims
- "Chiron return"
- "Age 50 milestone"
- "Once-in-a-lifetime event"

### Why LLM Makes This Error
1. Sees both Chiron positions
2. Calculates ~90° separation
3. **Either:**
   - Misidentifies 90° as 0° (conjunction error), OR
   - Correctly identifies it as square but incorrectly calls it "return"
4. Applies general knowledge: "Chiron returns = age 50 = significant"
5. With no constraints, includes this interpretation

### What Would Be Correct
- "Chiron square natal Chiron" (if discussed at all)
- Happens ~4 times per Chiron orbit (not once)
- Quarter-life/mid-life challenge, not a "return"
- User's actual Chiron return: ~2040-2041 (when they're 50)

---

## Evidence

### Test Results

**Test 1: API Calculation Check**
```bash
node test-chiron-full.js

Result:
Total transits: 50
Chiron-related: 8
- Sun Square natal Chiron
- Mercury Trine natal Chiron
- Mars Trine natal Chiron
- Chiron Trine natal Sun
- Chiron Trine natal Moon
- Chiron Square natal Uranus

✗ NO "Chiron to natal Chiron" transit found
```

**Conclusion:** API doesn't calculate Chiron-to-Chiron aspect, but LLM can infer it.

### Database Evidence

Query:
```sql
SELECT date, generated_at, title,
       substring(morning_forecast, 1, 200) as preview
FROM daily_horoscopes
ORDER BY date DESC LIMIT 5;
```

Results:
```
| date       | generated_at           | title                                    |
|------------|------------------------|------------------------------------------|
| 2025-10-10 | 2025-10-10 15:54:22... | Healing Hearts Connect Through Transform |
| 2025-10-09 | 2025-10-09 20:50:34... | Healing Hearts Through Honest Communic.. |
```

**Conclusion:**
- Different timestamps (cache working)
- Different titles (new generations)
- But both mention Chiron return theme

---

## Solution

### Required Changes

#### 1. Add Temperature (CRITICAL)
**File:** `src/handlers/horoscopeGeneration.ts` line 115-124

```typescript
const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 12000,
  temperature: 0.4,  // ADD THIS - lower temp = more literal
  messages: [
    {
      role: 'user',
      content: prompt,
    },
  ],
});
```

#### 2. Add Data Section Explanations (CRITICAL)
**File:** `src/utils/aiPromptTemplates.ts` line 176

Add BEFORE `CONTEXT:`:

```typescript
HOW TO USE THIS DATA:

1. NATAL CHART POSITIONS = User's birth chart (fixed reference points)
   - Shows where planets were at birth
   - Use this to understand what's being activated by transits

2. CURRENT PLANETARY POSITIONS = Today's sky (general background context)
   - Use ONLY for cosmic weather descriptions (e.g., "Moon in Pisces today")
   - DO NOT calculate aspects from this data yourself
   - This is environmental context, not interpretation data

3. CURRENT TRANSITS = Pre-calculated aspects (YOUR PRIMARY DATA)
   - These are the ONLY aspects you should interpret for the reading
   - Each aspect has been professionally calculated with proper orbs and strength
   - If an aspect is not explicitly listed here, DO NOT discuss it
   - Do not infer or calculate additional aspects from positions

CRITICAL CONSTRAINT: Only interpret transit aspects explicitly listed in the CURRENT TRANSITS section. Do not calculate aspects between current and natal positions yourself, even if both positions are provided. The CURRENT PLANETARY POSITIONS are for context only.

CONTEXT:
```

#### 3. Strengthen Requirements (IMPORTANT)
**File:** `src/utils/aiPromptTemplates.ts` line 286

Add to CRITICAL REQUIREMENTS:

```
11. ONLY interpret transit aspects explicitly listed in CURRENT TRANSITS
12. DO NOT calculate or infer aspects from NATAL and CURRENT POSITIONS yourself
13. If an aspect is not in the CURRENT TRANSITS list, do not mention it in the reading
14. All transit interpretations must be based on the provided aspect list only
15. CURRENT PLANETARY POSITIONS are for general cosmic weather only, not for aspect calculation
```

#### 4. Optional: Rename Section (NICE TO HAVE)
Change "CURRENT PLANETARY POSITIONS" to "TODAY'S COSMIC WEATHER" to make purpose clearer.

---

## Expected Outcome After Fix

### Before Fix
User sees:
```
"The morning hours bring tender, healing energy as both of you are
experiencing exact Chiron returns - a rare synchronicity that creates
profound emotional attunement..."
```

### After Fix
User sees:
```
"With Mars trine your natal Chiron today (75% strength), healing
conversations come more naturally. This is a good day for addressing
old wounds or having vulnerable discussions..."
```

**Changes:**
- ✅ No mention of "Chiron return" (not in transit list)
- ✅ Focuses on actual calculated aspects (Mars trine Chiron)
- ✅ Age-appropriate interpretation
- ✅ Uses provided strength ratings
- ✅ More literal, less creative interpretation

---

## Testing Plan

### 1. Immediate Test
After implementing fixes:
1. Force regenerate today's horoscope
2. Check if "Chiron return" still appears
3. Verify it only discusses aspects from CURRENT TRANSITS

### 2. Multi-Day Test
1. Monitor Oct 11, 12, 13 forecasts
2. Confirm no repeated "Chiron return" theme
3. Verify readings focus on different daily transits

### 3. Edge Case Test
Test with a user who IS experiencing a Chiron return:
- Born ~1974-1975
- Should legitimately see Chiron conjunction natal Chiron
- Verify it appears in CURRENT TRANSITS list
- Verify LLM correctly identifies it as a return

---

## Lessons Learned

### What Went Wrong
1. ❌ Assumed LLM would only use transit aspects list
2. ❌ Didn't anticipate LLM calculating aspects from raw positions
3. ❌ Forgot to set temperature (defaulted to max creativity)
4. ❌ Prompt lacked explicit constraints on data usage

### Best Practices for LLM Prompts
1. ✅ **Always set temperature** - Don't rely on defaults
2. ✅ **Explain data purpose** - Tell LLM what each section is FOR
3. ✅ **Add explicit constraints** - "Only use X, don't use Y"
4. ✅ **Test edge cases** - Slow-moving planets create persistent patterns
5. ✅ **Name sections clearly** - "Data for calculation" vs "context only"

### Why User Was Right to Question
The user correctly identified:
1. Similar readings 3 days in a row (Chiron barely moves)
2. Age-inappropriate content (Chiron return at 35)
3. Suspected data flow issue (was prompt issue)

Their deep thinking led to the real problem: **prompt clarity, not data accuracy**.

---

## Status

- [x] Issue identified
- [x] Root cause confirmed
- [x] Solution designed
- [ ] **Fixes to be implemented**
- [ ] Testing required
- [ ] Deployment pending

---

## Related Files

- **Prompt template:** `src/utils/aiPromptTemplates.ts`
- **Handler:** `src/handlers/horoscopeGeneration.ts`
- **Transit calc:** `src/utils/transitCalculation.ts`
- **API client:** `src/utils/swisseph/client.ts`
- **Documentation:** `ouros2_vault/daily_horoscope_prompt_template.md`
