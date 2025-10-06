# Data Flow Implementation Summary

## Problem
User data (birth data and natal charts) was only being saved to local storage (Zustand + AsyncStorage) and never persisted to Supabase database.

## Solution
Implemented complete database persistence with proper data flow:

### 1. Birth Data Persistence
**File:** `src/store/slices/userSlice.ts`

**Method:** `updateBirthData(birthData: BirthData)`

**Flow:**
- Receives birth data from onboarding screen
- Validates user profile exists
- Inserts/updates `birth_data` table with proper structure:
  ```typescript
  {
    user_id: UUID,
    birth_date: DATE,
    birth_time: TIME,
    time_unknown: BOOLEAN,
    location_name: TEXT,
    latitude: NUMERIC,
    longitude: NUMERIC,
    location_timezone: TEXT,
    country: TEXT,
    region: TEXT
  }
  ```
- Uses `upsert()` with `onConflict: 'user_id'` for idempotent writes
- Updates local Zustand state after successful DB write
- Throws errors for proper error handling

### 2. Natal Chart Persistence
**File:** `src/store/slices/chartSlice.ts`

**Method:** `saveNatalChart(userId: string, chart: NatalChartData, houseSystem: string)`

**Flow:**
- Receives generated natal chart data
- Inserts/updates `natal_charts` table with proper structure:
  ```typescript
  {
    user_id: UUID,
    planets: JSONB,
    houses: JSONB,
    aspects: JSONB,
    angles: JSONB,
    house_system: TEXT,
    calculation_method: TEXT,
    precision: TEXT,
    data_source: TEXT,
    version: TEXT,
    calculated_at: TIMESTAMPTZ
  }
  ```
- Uses `upsert()` with `onConflict: 'user_id'`
- Updates local Zustand state after successful DB write
- Proper error handling and logging

### 3. Onboarding Screen Integration
**File:** `src/screens/BirthDateTimeScreen.tsx`

**Changes:**
- Changed from `setBirthData()` → `updateBirthData()` (DB-backed method)
- Changed from `setNatalChart()` → `saveNatalChart()` (DB-backed method)
- Added proper sequencing:
  1. Save birth data to database
  2. Generate natal chart
  3. Save natal chart to database
  4. Navigate to home
- Added error handling with user feedback
- Requires `user` from store to get userId

**Key Code:**
```typescript
// Step 1: Save birth data to database
await updateBirthData(birthData);

// Step 2: Generate natal chart
const result = await handleChartGeneration(birthData, options);

// Step 3: Save natal chart to database
await saveNatalChart(user.id, result.data.chartData, 'placidus');
```

### 4. Data Retrieval (Already Implemented)
**File:** `src/store/slices/authSlice.ts`

**Method:** `fetchUserData(userId: string)`

**Flow:**
- Fetches from `profiles` table
- Fetches from `birth_data` table
- Fetches from `natal_charts` table
- Transforms database structure to app types
- Updates respective slices (userSlice, chartSlice)
- Called on login and registration

**Correct Structure Mapping:**
- `birth_date` (DB) → `birthDate` (app)
- `birth_time` (DB) → `birthTime` (app)
- `time_unknown` (DB) → `timeUnknown` (app)
- `location_name` (DB) → `birthLocation.name` (app)
- etc.

## Data Flow Diagram

```
User Completes Onboarding
         ↓
BirthDateTimeScreen collects date/time/location
         ↓
updateBirthData(birthData)
         ↓
INSERT INTO birth_data ✅
         ↓
handleChartGeneration(birthData)
         ↓
saveNatalChart(userId, chart, houseSystem)
         ↓
INSERT INTO natal_charts ✅
         ↓
Navigate to Home
         ↓
HomeScreen checks: natalChart && profile && birthData
         ↓
All exist → Generate horoscope ✅
```

## Database Tables Used

### `birth_data`
- Primary key: `user_id` (FK to profiles.id)
- Stores: date, time, location coordinates, timezone info
- One row per user

### `natal_charts`
- Primary key: `user_id` (FK to profiles.id)
- Stores: planets, houses, aspects, angles (all JSONB)
- Metadata: house_system, precision, calculation_method, etc.
- One row per user

### `profiles`
- Primary key: `id` (FK to auth.users.id)
- Stores: email, display_name, timezone, language
- Created automatically by trigger on user signup

## Testing Checklist

- [x] Profile creation trigger working
- [ ] New user registers → birth_data created after onboarding
- [ ] New user registers → natal_charts created after onboarding
- [ ] Existing user logs in → birth_data fetched correctly
- [ ] Existing user logs in → natal_charts fetched correctly
- [ ] HomeScreen generates horoscope with all data present
- [ ] Data persists across app restarts
- [ ] Error handling works if database save fails

## Notes

1. **No Shortcuts**: All data is properly saved to Supabase with correct structure
2. **No Fallbacks**: Errors are thrown and caught properly, not silently ignored
3. **Idempotent**: Using `upsert()` ensures re-running onboarding updates data correctly
4. **Type Safety**: All database columns map to TypeScript types correctly
5. **Logging**: Console logs track the flow for debugging
