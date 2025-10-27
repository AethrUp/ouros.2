/**
 * Stripe Setup Verification Script
 *
 * This script verifies that all Stripe configuration is correct.
 * Run with: npx ts-node scripts/verify-stripe-setup.ts
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

interface VerificationResult {
  success: boolean;
  message: string;
  details?: any;
}

const results: { [key: string]: VerificationResult } = {};

async function verifyEnvironmentVariables(): Promise<VerificationResult> {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_PREMIUM_MONTHLY',
    'STRIPE_PRICE_PREMIUM_YEARLY',
    'STRIPE_PRICE_PRO_MONTHLY',
    'STRIPE_PRICE_PRO_YEARLY',
    'NEXT_PUBLIC_BASE_URL',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing environment variables: ${missing.join(', ')}`,
    };
  }

  // Verify secret key format
  const secretKey = process.env.STRIPE_SECRET_KEY!;
  if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
    return {
      success: false,
      message: 'STRIPE_SECRET_KEY has invalid format. Should start with sk_test_ or sk_live_',
    };
  }

  // Verify publishable key format
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
  if (!pubKey.startsWith('pk_test_') && !pubKey.startsWith('pk_live_')) {
    return {
      success: false,
      message: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY has invalid format. Should start with pk_test_ or pk_live_',
    };
  }

  // Verify webhook secret format
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!webhookSecret.startsWith('whsec_')) {
    return {
      success: false,
      message: 'STRIPE_WEBHOOK_SECRET has invalid format. Should start with whsec_',
    };
  }

  return {
    success: true,
    message: 'All required environment variables are present and properly formatted',
    details: {
      mode: secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    },
  };
}

async function verifyStripeConnection(): Promise<VerificationResult> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });

    // Test connection by retrieving account details
    const account = await stripe.accounts.retrieve();

    return {
      success: true,
      message: 'Successfully connected to Stripe API',
      details: {
        accountId: account.id,
        email: account.email || 'Not available',
        country: account.country,
        businessName: account.business_profile?.name || 'Not set',
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to connect to Stripe: ${error.message}`,
    };
  }
}

async function verifyPrices(): Promise<VerificationResult> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });

    const priceIds = [
      { name: 'Premium Monthly', id: process.env.STRIPE_PRICE_PREMIUM_MONTHLY! },
      { name: 'Premium Yearly', id: process.env.STRIPE_PRICE_PREMIUM_YEARLY! },
      { name: 'Pro Monthly', id: process.env.STRIPE_PRICE_PRO_MONTHLY! },
      { name: 'Pro Yearly', id: process.env.STRIPE_PRICE_PRO_YEARLY! },
    ];

    const priceDetails: any[] = [];

    for (const { name, id } of priceIds) {
      try {
        const price = await stripe.prices.retrieve(id, {
          expand: ['product'],
        });

        const product = price.product as Stripe.Product;

        priceDetails.push({
          name,
          priceId: id,
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency.toUpperCase(),
          interval: price.recurring?.interval || 'N/A',
          product: product.name,
          active: price.active,
        });
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to retrieve price ${name} (${id}): ${error.message}`,
        };
      }
    }

    // Check if all prices are active
    const inactive = priceDetails.filter(p => !p.active);
    if (inactive.length > 0) {
      return {
        success: false,
        message: `Some prices are inactive: ${inactive.map(p => p.name).join(', ')}`,
        details: priceDetails,
      };
    }

    return {
      success: true,
      message: 'All price IDs are valid and active',
      details: priceDetails,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to verify prices: ${error.message}`,
    };
  }
}

async function verifyWebhookEndpoint(): Promise<VerificationResult> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });

    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 });
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const expectedUrl = `${baseUrl}/api/webhooks/stripe`;

    const matchingWebhook = webhooks.data.find(wh => wh.url === expectedUrl);

    if (!matchingWebhook) {
      return {
        success: false,
        message: `No webhook endpoint found for ${expectedUrl}. You need to create it in Stripe Dashboard or use Stripe CLI.`,
        details: {
          expectedUrl,
          existingWebhooks: webhooks.data.map(wh => ({
            url: wh.url,
            status: wh.status,
            enabled_events: wh.enabled_events,
          })),
        },
      };
    }

    const requiredEvents = [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.trial_will_end',
    ];

    const missingEvents = requiredEvents.filter(
      event => !matchingWebhook.enabled_events.includes(event)
    );

    if (missingEvents.length > 0) {
      return {
        success: false,
        message: `Webhook is missing required events: ${missingEvents.join(', ')}`,
        details: {
          url: matchingWebhook.url,
          status: matchingWebhook.status,
          enabled_events: matchingWebhook.enabled_events,
          missing_events: missingEvents,
        },
      };
    }

    return {
      success: true,
      message: 'Webhook endpoint is properly configured',
      details: {
        url: matchingWebhook.url,
        status: matchingWebhook.status,
        enabled_events: matchingWebhook.enabled_events,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to verify webhook endpoint: ${error.message}`,
    };
  }
}

async function verifyCustomerPortal(): Promise<VerificationResult> {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    });

    const configuration = await stripe.billingPortal.configurations.list({ limit: 1 });

    if (configuration.data.length === 0) {
      return {
        success: false,
        message: 'No Customer Portal configuration found. Create one in Stripe Dashboard at Settings > Billing > Customer Portal',
      };
    }

    const config = configuration.data[0];

    return {
      success: true,
      message: 'Customer Portal is configured',
      details: {
        active: config.active,
        default_return_url: config.default_return_url,
        features: {
          customer_update: config.features.customer_update.enabled,
          invoice_history: config.features.invoice_history.enabled,
          payment_method_update: config.features.payment_method_update.enabled,
          subscription_cancel: config.features.subscription_cancel.enabled,
          subscription_update: config.features.subscription_update.enabled,
        },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to verify Customer Portal: ${error.message}`,
    };
  }
}

async function main() {
  console.log('🔍 Verifying Stripe Setup...\n');
  console.log('═'.repeat(80));

  // Run all verifications
  console.log('\n1️⃣  Checking Environment Variables...');
  results.env = await verifyEnvironmentVariables();
  printResult(results.env);

  if (!results.env.success) {
    console.log('\n❌ Cannot proceed without valid environment variables.');
    process.exit(1);
  }

  console.log('\n2️⃣  Verifying Stripe API Connection...');
  results.connection = await verifyStripeConnection();
  printResult(results.connection);

  if (!results.connection.success) {
    console.log('\n❌ Cannot proceed without valid Stripe connection.');
    process.exit(1);
  }

  console.log('\n3️⃣  Verifying Price IDs...');
  results.prices = await verifyPrices();
  printResult(results.prices);

  console.log('\n4️⃣  Verifying Webhook Endpoint...');
  results.webhook = await verifyWebhookEndpoint();
  printResult(results.webhook);

  console.log('\n5️⃣  Verifying Customer Portal Configuration...');
  results.portal = await verifyCustomerPortal();
  printResult(results.portal);

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 VERIFICATION SUMMARY\n');

  const allPassed = Object.values(results).every(r => r.success);

  Object.entries(results).forEach(([key, result]) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${key.toUpperCase()}: ${result.message}`);
  });

  console.log('\n' + '═'.repeat(80));

  if (allPassed) {
    console.log('\n✨ All checks passed! Your Stripe integration is ready.\n');
    console.log('Next steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Test the checkout flow at http://localhost:3000/pricing');
    console.log('3. Use test card: 4242 4242 4242 4242, any future date, any CVC');
    console.log('4. For local webhook testing, run: stripe listen --forward-to localhost:3000/api/webhooks/stripe\n');
  } else {
    console.log('\n⚠️  Some checks failed. Please fix the issues above before proceeding.\n');
    process.exit(1);
  }
}

function printResult(result: VerificationResult) {
  if (result.success) {
    console.log(`✅ ${result.message}`);
    if (result.details) {
      console.log('   Details:', JSON.stringify(result.details, null, 2).split('\n').join('\n   '));
    }
  } else {
    console.log(`❌ ${result.message}`);
    if (result.details) {
      console.log('   Details:', JSON.stringify(result.details, null, 2).split('\n').join('\n   '));
    }
  }
}

main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
