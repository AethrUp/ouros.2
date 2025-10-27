# Stripe Setup Quick Reference

**Quick answers to prevent mismatches**

---

## Products to Create in Stripe

Create exactly **2 products** with exactly **4 prices total**:

### Product 1: Ouros2 Premium
- **Name**: `Ouros2 Premium` (exact, case-sensitive)
- **Price 1**: $9.99/month (recurring monthly)
- **Price 2**: $99.00/year (recurring yearly)
- **Metadata**: `tier=premium`, `app=ouros2`

### Product 2: Ouros2 Pro
- **Name**: `Ouros2 Pro` (exact, case-sensitive)
- **Price 1**: $19.99/month (recurring monthly)
- **Price 2**: $199.00/year (recurring yearly)
- **Metadata**: `tier=pro`, `app=ouros2`

---

## Naming Convention

### ✅ Correct Names

| What | Exact Name | Where |
|------|------------|-------|
| Product 1 | `Ouros2 Premium` | Stripe Dashboard |
| Product 2 | `Ouros2 Pro` | Stripe Dashboard |
| Tier in code | `'premium'` or `'pro'` | Application (lowercase) |
| Interval in code | `'monthly'` or `'yearly'` | Application (lowercase) |

### ❌ Wrong Names (Don't Use)

- ❌ "Premium" (missing "Ouros2")
- ❌ "Ouros Premium" (missing "2")
- ❌ "ouros2-premium" (wrong format)
- ❌ "OUROS2 PREMIUM" (wrong case)

---

## How to Prevent Mismatches

### 1. Use Exact Product Names
Copy/paste these into Stripe Dashboard:
- `Ouros2 Premium`
- `Ouros2 Pro`

### 2. Add Metadata to Products
For Premium:
```
tier: premium
app: ouros2
```

For Pro:
```
tier: pro
app: ouros2
```

### 3. Add Metadata to Each Price
For monthly prices:
```
interval: monthly
tier: premium (or pro)
app: ouros2
```

For yearly prices:
```
interval: yearly
tier: premium (or pro)
app: ouros2
```

### 4. Copy Price IDs Correctly
Each price will have a unique ID like `price_1ABC123xyz`

Copy them to `web/.env.local`:
```bash
STRIPE_PRICE_PREMIUM_MONTHLY=price_1ABC123xyz
STRIPE_PRICE_PREMIUM_YEARLY=price_1ABC456xyz
STRIPE_PRICE_PRO_MONTHLY=price_1ABC789xyz
STRIPE_PRICE_PRO_YEARLY=price_1ABC012xyz
```

### 5. Run Verification
```bash
node verify-stripe-setup.js
```

This checks:
- ✅ All environment variables are set
- ✅ Price IDs have correct format
- ✅ Keys match (test vs live)
- ✅ All files exist

---

## Environment Variables Template

```bash
# Stripe API Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Stripe Webhook Secret (get after setting up webhook)
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (copy from each price in products page)
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx
STRIPE_PRICE_PREMIUM_YEARLY=price_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Price Amounts (Double Check These!)

| Tier | Interval | Amount | Stripe Dashboard |
|------|----------|--------|------------------|
| Premium | Monthly | **$9.99** | Set to $9.99 USD |
| Premium | Yearly | **$99.00** | Set to $99.00 USD |
| Pro | Monthly | **$19.99** | Set to $19.99 USD |
| Pro | Yearly | **$199.00** | Set to $199.00 USD |

All prices must be:
- ✅ Recurring (not one-time)
- ✅ In USD
- ✅ With correct billing period (Monthly or Yearly)

---

## Complete Setup Checklist

### In Stripe Dashboard

1. [ ] Go to https://dashboard.stripe.com/products
2. [ ] Switch to **Test Mode** (toggle in top right)
3. [ ] Create product "Ouros2 Premium"
   - [ ] Add monthly price: $9.99
   - [ ] Add yearly price: $99.00
   - [ ] Add product metadata: tier=premium, app=ouros2
   - [ ] Add price metadata for each
4. [ ] Create product "Ouros2 Pro"
   - [ ] Add monthly price: $19.99
   - [ ] Add yearly price: $199.00
   - [ ] Add product metadata: tier=pro, app=ouros2
   - [ ] Add price metadata for each
5. [ ] Copy all 4 Price IDs

### In Your Project

6. [ ] Open `web/.env.local`
7. [ ] Add all 8 environment variables (see template above)
8. [ ] Save the file
9. [ ] Run `node verify-stripe-setup.js`
10. [ ] Fix any errors reported
11. [ ] Restart dev server: `cd web && npm run dev`

---

## Mapping Reference

```
Application Code         Stripe Dashboard
─────────────────────────────────────────────────────
'premium'           →    "Ouros2 Premium" product
'pro'               →    "Ouros2 Pro" product
'monthly'           →    Monthly billing period
'yearly'            →    Yearly billing period

Environment Variable              What It Maps To
─────────────────────────────────────────────────────
STRIPE_PRICE_PREMIUM_MONTHLY  →  Ouros2 Premium → Monthly price
STRIPE_PRICE_PREMIUM_YEARLY   →  Ouros2 Premium → Yearly price
STRIPE_PRICE_PRO_MONTHLY      →  Ouros2 Pro → Monthly price
STRIPE_PRICE_PRO_YEARLY       →  Ouros2 Pro → Yearly price
```

---

## Testing

After setup, test with:

```bash
# Verify setup
node verify-stripe-setup.js

# Should show all ✅ checks

# Start dev server
cd web
npm run dev

# Should start without Stripe errors
```

**Test card**: `4242 4242 4242 4242` (any future date, any CVC)

---

## Related Documentation

- **Detailed Guide**: `STRIPE_PRODUCT_SETUP_GUIDE.md`
- **Environment Setup**: `STRIPE_ENV_SETUP.md`
- **Implementation Plan**: `STRIPE_IMPLEMENTATION_PLAN.md`
- **Database Migration**: `STRIPE_DATABASE_MIGRATION.md`

---

## Common Questions

**Q: Can I change the product names later?**
A: Yes, but keep them as "Ouros2 Premium" and "Ouros2 Pro" for consistency.

**Q: Can I change the prices later?**
A: Yes, but you'll need to create new Price IDs and update environment variables.

**Q: What if I already have products with different names?**
A: Create new products with the correct names, or add metadata to existing ones.

**Q: Do I need different products for test and live mode?**
A: Yes, create products in both test mode (for development) and live mode (for production).

**Q: What happens if names don't match?**
A: The webhook handler uses metadata (not names) to determine the tier, so as long as metadata is correct, it will work. But consistent naming helps debugging.

---

**Status**: ✅ Ready to set up Stripe products
**Next**: Run `node verify-stripe-setup.js` after creating products
