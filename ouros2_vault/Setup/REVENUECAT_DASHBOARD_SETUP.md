# RevenueCat Dashboard Setup Guide

This guide walks you through configuring RevenueCat Dashboard to enable in-app purchases and subscription tracking for Ouros2.

**Prerequisites:**
- RevenueCat account created
- Project created in RevenueCat Dashboard
- API Key obtained and added to `.env` file
- Products created in App Store Connect (see next section)

---

## Step 1: Configure App Store Connect Integration

RevenueCat needs access to your App Store Connect account to validate purchases and sync subscription data.

### 1.1 Generate App Store Connect API Key

1. **Go to App Store Connect**
   - Navigate to: https://appstoreconnect.apple.com/
   - Sign in with your Apple Developer account

2. **Access API Keys Section**
   - Click on **Users and Access** (in the top navigation)
   - Click on **Keys** tab
   - Under "In-App Purchase", click the **+** button (or "Generate API Key")

3. **Create New Key**
   - **Name:** "RevenueCat Integration" (or similar descriptive name)
   - **Access:** Select **In-App Purchase** (this is the minimum required permission)
   - Click **Generate**

4. **Download and Save Key Information**
   - **Download the `.p8` file** - Save this securely! You can only download it once
   - **Copy the Key ID** - You'll need this (format: `ABCD1234EF`)
   - **Copy the Issuer ID** - Found at the top of the Keys page (format: `12345678-1234-1234-1234-123456789012`)

### 1.2 Add API Key to RevenueCat

1. **Open RevenueCat Dashboard**
   - Navigate to: https://app.revenuecat.com/
   - Select your Ouros2 project

2. **Go to App Settings**
   - Click on **Project Settings** (gear icon) in the left sidebar
   - Click on **Apps** → Select your iOS app
   - Or navigate directly to the iOS app configuration

3. **Configure App Store Connect**
   - Scroll to **App Store Connect Integration** section
   - Click **Add In-App Purchase Key**
   - Fill in the form:
     - **Key ID:** Paste the Key ID from App Store Connect
     - **Issuer ID:** Paste the Issuer ID from App Store Connect
     - **Key File:** Upload the `.p8` file you downloaded
   - Click **Save**

4. **Verify Connection**
   - RevenueCat will test the connection
   - You should see a green checkmark or "Connected" status
   - If there's an error, verify all three pieces of information are correct

---

## Step 2: Create Products in RevenueCat

Products in RevenueCat correspond to the in-app purchase products you create in App Store Connect. You must create them in App Store Connect FIRST, then add them to RevenueCat.

### 2.1 Required Products for Ouros2

You need to create 4 subscription products with these exact IDs:

| Product ID | Description | Price |
|------------|-------------|-------|
| `com.ouros2.premium.monthly` | Premium Monthly | $9.99/month |
| `com.ouros2.premium.yearly` | Premium Yearly | $79.99/year |
| `com.ouros2.pro.monthly` | Pro Monthly | $19.99/month |
| `com.ouros2.pro.yearly` | Pro Yearly | $159.99/year |

### 2.2 Create Products in App Store Connect

**Before adding products to RevenueCat, create them in App Store Connect:**

1. **Go to App Store Connect**
   - Navigate to **My Apps** → Select your app
   - Click on **Subscriptions** (in the left sidebar)

2. **Create Subscription Group**
   - If you don't have one yet, click **Create Subscription Group**
   - **Reference Name:** "Ouros Premium Subscriptions"
   - Click **Create**

3. **Add Subscriptions to Group**
   - Click the **+** button next to your subscription group
   - Create each of the 4 products above with:
     - **Product ID:** Exact ID from table above
     - **Subscription Duration:** Monthly or Yearly
     - **Price:** As specified in table
   - Add subscription name, description, and promotional text
   - **Optional but recommended:** Add a 1-week free trial
   - Click **Save**

4. **Repeat for all 4 products**

5. **Submit for Review**
   - Once all products are configured, submit for review
   - Note: Products must be approved before they work in production

### 2.3 Add Products to RevenueCat

1. **Open RevenueCat Dashboard**
   - Go to **Products** (in the left sidebar)

2. **Import from App Store Connect** (Easiest Method)
   - Click **Import from App Store Connect**
   - RevenueCat will automatically fetch all available products
   - Select the 4 Ouros2 products
   - Click **Import**

3. **OR Add Products Manually**
   - Click **+ New**
   - For each product:
     - **Identifier:** Enter the product ID (e.g., `com.ouros2.premium.monthly`)
     - **Type:** Auto-renewable subscription
     - **App:** Select your iOS app
     - Click **Save**
   - Repeat for all 4 products

4. **Verify Products**
   - You should see all 4 products listed
   - Each should show "iOS" as the store
   - Status should be "Active" or "Approved"

---

## Step 3: Create Entitlements

Entitlements are the features or access levels that users get when they subscribe. For Ouros2, you need two entitlements: `premium` and `pro`.

### 3.1 Understanding Entitlements

- **Entitlements** = What the user gets access to
- **Products** = What the user purchases
- Multiple products can grant the same entitlement
- Your app checks entitlements, NOT product IDs

### 3.2 Create Premium Entitlement

1. **Go to Entitlements**
   - Click **Entitlements** in the left sidebar
   - Click **+ New**

2. **Configure Premium Entitlement**
   - **Identifier:** `premium` (must match code exactly!)
   - **Description:** "Premium tier access - unlimited readings, dream interpretation, enhanced features"
   - Click **Save**

3. **Attach Products to Premium**
   - Click on the `premium` entitlement
   - Under **Products**, click **Add Products**
   - Select:
     - ☑️ `com.ouros2.premium.monthly`
     - ☑️ `com.ouros2.premium.yearly`
   - Click **Add**

### 3.3 Create Pro Entitlement

1. **Create New Entitlement**
   - Click **+ New** again

2. **Configure Pro Entitlement**
   - **Identifier:** `pro` (must match code exactly!)
   - **Description:** "Pro tier access - everything in Premium plus unlimited synastry, advanced features, priority processing"
   - Click **Save**

3. **Attach Products to Pro**
   - Click on the `pro` entitlement
   - Under **Products**, click **Add Products**
   - Select:
     - ☑️ `com.ouros2.pro.monthly`
     - ☑️ `com.ouros2.pro.yearly`
   - Click **Add**

### 3.4 Verify Entitlement Mapping

Your final setup should look like this:

```
Entitlement: premium
├── com.ouros2.premium.monthly
└── com.ouros2.premium.yearly

Entitlement: pro
├── com.ouros2.pro.monthly
└── com.ouros2.pro.yearly
```

---

## Step 4: Create Offerings

Offerings are how you present subscription options to users. They group packages together for display in your app.

### 4.1 Understanding Offerings

- **Offerings** = Collections of packages shown to users
- **Packages** = Individual products within an offering
- The "current" offering is what's shown by default
- You can create multiple offerings for A/B testing

### 4.2 Create Current Offering

1. **Go to Offerings**
   - Click **Offerings** in the left sidebar
   - You might see a default "current" offering already - if so, click to edit it
   - If not, click **+ New Offering**

2. **Configure Offering**
   - **Identifier:** `default` (or leave as `current`)
   - **Description:** "Standard subscription options"
   - Click **Save**

3. **Set as Current Offering**
   - If not already set, toggle **Make Current Offering**
   - The app will automatically fetch the current offering

### 4.3 Add Packages to Offering

For Ouros2, we'll create 4 packages - one for each product.

#### Package 1: Premium Monthly

1. Click **Add Package** (or **+ New Package**)
2. Configure:
   - **Identifier:** `premium_monthly` (or use the preset "$rc_monthly")
   - **Product:** Select `com.ouros2.premium.monthly`
   - **Package Type:** Monthly (optional, for RevenueCat analytics)
3. Click **Save**

#### Package 2: Premium Yearly

1. Click **Add Package**
2. Configure:
   - **Identifier:** `premium_yearly` (or use the preset "$rc_annual")
   - **Product:** Select `com.ouros2.premium.yearly`
   - **Package Type:** Annual
3. Click **Save**

#### Package 3: Pro Monthly

1. Click **Add Package**
2. Configure:
   - **Identifier:** `pro_monthly`
   - **Product:** Select `com.ouros2.pro.monthly`
   - **Package Type:** Monthly
3. Click **Save**

#### Package 4: Pro Yearly

1. Click **Add Package**
2. Configure:
   - **Identifier:** `pro_yearly`
   - **Product:** Select `com.ouros2.pro.yearly`
   - **Package Type:** Annual
3. Click **Save**

### 4.4 Verify Offering Setup

Your current offering should show:
```
Current Offering: default
├── Package: premium_monthly → com.ouros2.premium.monthly
├── Package: premium_yearly → com.ouros2.premium.yearly
├── Package: pro_monthly → com.ouros2.pro.monthly
└── Package: pro_yearly → com.ouros2.pro.yearly
```

---

## Step 5: Testing Your Configuration

### 5.1 Verify in RevenueCat Dashboard

1. **Check Products Tab**
   - All 4 products should be listed
   - All should be "Active"

2. **Check Entitlements Tab**
   - Both `premium` and `pro` should exist
   - Each should have 2 products attached

3. **Check Offerings Tab**
   - "current" offering should exist
   - Should contain all 4 packages

### 5.2 Test in Your App

1. **Using Debug Panel** (Fastest)
   ```
   1. Run app in dev mode
   2. Go to Profile screen
   3. Triple-tap on "Profile Screen" title
   4. Debug panel should show correct tier/entitlements
   ```

2. **Using Sandbox Testing**
   ```
   1. Create sandbox test account in App Store Connect
   2. Sign in on device: Settings > App Store > Sandbox Account
   3. Open app → Go to Subscription screen
   4. Tap purchase button
   5. Should show test products with correct prices
   6. Complete test purchase (free with sandbox account)
   7. Verify subscription activates
   ```

3. **Check RevenueCat Dashboard**
   - Go to **Customers** tab
   - Search for your test user (by App User ID)
   - Verify entitlements show up after purchase

---

## Troubleshooting

### Products Not Appearing in App

**Problem:** `getAvailablePackages()` returns empty array

**Solutions:**
- Verify products exist in RevenueCat Products tab
- Check products are added to current offering
- Ensure App Store Connect integration is configured
- Wait 15 minutes for RevenueCat to sync with Apple
- Try calling `Purchases.invalidateCustomerInfoCache()` in debug panel

### Entitlements Not Activating After Purchase

**Problem:** Purchase succeeds but user doesn't get access

**Solutions:**
- Check entitlement identifiers match EXACTLY:
  - RevenueCat: `premium` and `pro`
  - Code: `ENTITLEMENTS.PREMIUM` and `ENTITLEMENTS.PRO` in `src/types/subscription.ts`
- Verify products are correctly attached to entitlements
- Check RevenueCat Customers tab to see if purchase was recorded
- Try calling "Sync Subscription" in the app

### App Store Connect Integration Failed

**Problem:** Red X or error when configuring integration

**Solutions:**
- Verify Key ID is correct (check for extra spaces)
- Verify Issuer ID is correct
- Re-download .p8 file and try again
- Ensure the key has "In-App Purchase" permission
- Wait a few minutes and try again (Apple servers can be slow)

### "No Offerings Available" Error

**Problem:** App shows no subscription options

**Solutions:**
- Verify "current" offering is set (toggle in Offerings tab)
- Check offering contains packages
- Verify API key is correct in `.env` file
- Check console logs for RevenueCat initialization errors
- Try in sandbox mode first before testing production

---

## Verification Checklist

Before moving to production, verify:

- [ ] App Store Connect API key configured in RevenueCat
- [ ] All 4 products created in App Store Connect
- [ ] All 4 products imported into RevenueCat
- [ ] Both entitlements created (`premium` and `pro`)
- [ ] Products correctly attached to entitlements
- [ ] Current offering created with all 4 packages
- [ ] Sandbox test purchase completed successfully
- [ ] Entitlements activate after test purchase
- [ ] RevenueCat dashboard shows test customer
- [ ] App correctly displays subscription status

---

## Next Steps

After completing this setup:

1. **Configure Supabase** (see `SUBSCRIPTION_SYSTEM.md`)
2. **Test with Debug Panel** (see `SUBSCRIPTION_SYSTEM.md`)
3. **Test with StoreKit Config** for local development
4. **Test with Sandbox Account** on device
5. **Submit app for review** with subscriptions
6. **Monitor RevenueCat Dashboard** after launch

---

## Additional Resources

- **RevenueCat Documentation:** https://docs.revenuecat.com/docs
- **App Store Connect Help:** https://developer.apple.com/help/app-store-connect/
- **Ouros2 Subscription System Docs:** `SUBSCRIPTION_SYSTEM.md`
- **RevenueCat Dashboard:** https://app.revenuecat.com/

---

## Support

If you encounter issues:
1. Check RevenueCat documentation
2. Review console logs in app
3. Check RevenueCat Dashboard → Customers tab
4. Use debug panel to inspect state
5. Contact RevenueCat support (very responsive!)
