# Quick Start: Testing Subscriptions NOW

## ⚡ 5-Minute Setup

### Step 1: Run Database Migration (2 minutes)

1. Go to https://supabase.com/dashboard
2. Click your project: `rhchespvbiesrplsdkiz`
3. Click "SQL Editor" in left sidebar
4. Click "New query" button
5. Open file: `supabase_migration_subscription_system.sql`
6. Copy ALL contents (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL editor (Ctrl+V)
8. Click "Run" button (or Ctrl+Enter)

**Expected Result:** `Success. No rows returned`

### Step 2: Restart App (10 seconds)

```bash
# Stop the app (Ctrl+C in terminal)
# Start it again:
npm start
```

### Step 3: Test It! (3 minutes)

1. **Open the app** on your device/simulator
2. **Navigate** to Profile screen
3. **Triple-tap** the "Profile Screen" title text
4. **Debug Panel opens!**

Now you can:
- Click "PREMIUM" to get premium access
- Click "PRO" to get pro access
- Click "FREE" to go back to free tier
- Click "Reset" next to features to reset usage
- Test all features instantly

## 🎯 What You Can Test

### With FREE Tier
- Try tarot reading → Works 1 time
- Try tarot reading again → Shows upgrade prompt ✅
- Click "Upgrade Now" → See paywall

### With PREMIUM Tier (via Debug Panel)
1. Open Debug Panel (triple-tap)
2. Click "PREMIUM"
3. Close panel
4. Try tarot reading → Unlimited! ✅
5. Try dream interpretation → Works! ✅

### With PRO Tier
- Everything is unlimited
- All advanced features enabled

## 🐛 Troubleshooting

### "Table not found" error?
→ Run the migration (Step 1 above)

### Debug panel won't open?
→ Make sure you're in dev mode: `npm start` (not production build)
→ Try tapping slightly slower (3 taps in 0.5 seconds)

### Still getting errors?
→ Check console logs
→ Restart app after running migration

## 📱 Production Testing (Later)

When ready to test real purchases:
1. Add RevenueCat API keys to `src/services/subscriptionService.ts`
2. Use StoreKit configuration file (see SUBSCRIPTION_SYSTEM.md)
3. Use Apple sandbox test accounts

## ✅ You're Done!

You now have a fully functional subscription system with:
- ✅ Free tier with limits
- ✅ Premium tier ($9.99/mo)
- ✅ Pro tier ($19.99/mo)
- ✅ Debug panel for instant testing
- ✅ Usage tracking
- ✅ Feature gates

**Test it out and see the magic!** 🎉
