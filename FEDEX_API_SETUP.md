# FedEx API Setup Guide

This document explains how to set up FedEx API integration for automatic shipping cost calculation for USA destinations.

## Overview

For packages being shipped to the United States, the system now automatically calculates shipping costs using the FedEx API when the customer requests shipping. This eliminates the need for admins to manually calculate and enter shipping costs for USA destinations.

## How It Works

1. **Admin creates package (Warehouse)**: When creating a package for a USA destination, the admin can leave the "International Shipping Cost" field empty. The system will automatically calculate it when the customer requests shipping.

2. **Customer requests shipping**: When a USA customer requests shipping for their package, the system:
   - Detects the USA destination address
   - Calls the FedEx API with package weight and destination details
   - Calculates the shipping cost in USD
   - Converts to JPY (using a 150 JPY/USD rate by default)
   - Updates the package with the calculated cost
   - Charges the customer's balance

3. **Admin processes shipment**: The admin can see the automatically calculated FedEx rate in the package notes when processing the shipping request.

## FedEx API Setup

### 1. Register for FedEx Developer Account

1. Go to https://developer.fedex.com/
2. Click "Sign Up" and create a new account
3. Verify your email address
4. Complete the registration process

### 2. Create a New Project

1. Log in to your FedEx Developer account
2. Go to "My Projects" in the dashboard
3. Click "Create a Project"
4. Give your project a name (e.g., "Japrix Shipping")
5. Select the following APIs:
   - **Rates and Transit Times API** (v1) - required for shipping cost calculation
   - This API supports:
     - FedEx Express®
     - FedEx Ground®
     - FedEx Ground® Economy
     - FedEx Freight®

### 3. Get Your API Credentials

After creating your project:

1. Go to your project dashboard
2. Note down the following credentials:
   - **API Key** (also called Client ID)
   - **Secret Key** (also called Client Secret)
   - **Account Number** (your FedEx account number)

### 4. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# FedEx API Credentials
FEDEX_API_KEY=your_api_key_here
FEDEX_SECRET_KEY=your_secret_key_here
FEDEX_ACCOUNT_NUMBER=your_fedex_account_number
```

**Example:**
```env
FEDEX_API_KEY=l7xx1234567890abcdef1234567890ab
FEDEX_SECRET_KEY=1234567890abcdef1234567890abcdef
FEDEX_ACCOUNT_NUMBER=123456789
```

### 5. Test the Integration

#### Production vs Test Environment

- **Test Environment**: FedEx provides a test environment for development
- **Production Environment**: Used for actual shipping calculations

By default, the integration uses the **production** FedEx API (`https://apis.fedex.com`).

If you want to test first, you can modify `lib/fedex.ts` to use the test endpoint:
```typescript
// Test environment
const response = await fetch('https://apis-sandbox.fedex.com/rate/v1/rates/quotes', {
```

#### Testing Flow

1. **Create a test order** for a USA address
2. **Admin creates package** in warehouse without specifying shipping cost
3. **Customer requests shipping**
4. Check logs for FedEx API response
5. Verify the calculated shipping cost is reasonable

## Currency Conversion

The system currently uses a fixed exchange rate of **150 JPY = 1 USD**.

To use real-time exchange rates, you can integrate with a currency API:

```typescript
// Example: Using exchangerate-api.com
async function convertUsdToJpy(usd: number): Promise<number> {
  const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
  const data = await response.json();
  const rate = data.rates.JPY;
  return Math.round(usd * rate);
}
```

## Important Notes

### Weight Requirement

For FedEx rate calculation to work, **the package must have a weight specified**. If the admin creates a package without weight:
- For non-USA packages: Works normally, shipping cost must be entered manually
- For USA packages: Customer will get an error when requesting shipping, asking to contact support

### Package Dimensions

The system automatically estimates package dimensions based on weight:
- 0-0.5 kg: 20×15×5 cm (small box)
- 0.5-2 kg: 30×25×10 cm (medium box)
- 2-5 kg: 40×30×20 cm (large box)
- 5+ kg: 50×40×30 cm (extra large box)

You can modify these estimates in `lib/fedex.ts` → `estimatePackageDimensions()`.

### Error Handling

If FedEx API fails:
1. Customer receives an error message with the failure reason
2. Admin is notified (if Telegram notifications are enabled)
3. Customer can contact support
4. Admin can manually enter the shipping cost in the warehouse

## Troubleshooting

### Error: "Failed to authenticate with FedEx API"

**Cause**: Invalid API credentials

**Solution**:
1. Check your `.env` file has correct `FEDEX_API_KEY` and `FEDEX_SECRET_KEY`
2. Verify credentials in FedEx Developer Portal
3. Make sure there are no extra spaces in the `.env` file

### Error: "No rates available for this route"

**Cause**: FedEx doesn't serve this specific route or address is invalid

**Solution**:
1. Verify the customer's address is complete and valid
2. Check that all required fields are filled (city, state, postal code)
3. Contact FedEx support if the issue persists

### Error: "Package weight is required"

**Cause**: Package was created without weight

**Solution**:
1. Admin should always enter package weight in the warehouse
2. If package already exists, admin can update it through the admin panel

### High Shipping Costs

**Cause**: FedEx rates can be expensive for heavy packages

**Solution**:
1. Verify package weight is correct (not too high)
2. Check dimensions estimation is reasonable
3. Consider suggesting cheaper carriers for heavy items

## API Rate Limits

FedEx API has rate limits:
- **Production**: Varies by account type
- **Test**: Usually 10 requests per minute

If you exceed rate limits, requests will fail temporarily. The system will show an error to the customer.

## API Details

### Request Structure

The system sends the following to FedEx:

```json
{
  "accountNumber": {
    "value": "YOUR_ACCOUNT_NUMBER"
  },
  "requestedShipment": {
    "shipper": {
      "address": {
        "postalCode": "105-0011",
        "countryCode": "JP",
        "city": "Tokyo"
      }
    },
    "recipient": {
      "address": {
        "postalCode": "CUSTOMER_ZIP",
        "countryCode": "US",
        "city": "CUSTOMER_CITY",
        "stateOrProvinceCode": "CUSTOMER_STATE"
      }
    },
    "pickupType": "DROPOFF_AT_FEDEX_LOCATION",
    "serviceType": "INTERNATIONAL_PRIORITY",
    "rateRequestType": ["ACCOUNT", "LIST"],
    "requestedPackageLineItems": [{
      "weight": {
        "units": "LB",
        "value": 2.2
      },
      "dimensions": {
        "length": 12,
        "width": 10,
        "height": 4,
        "units": "IN"
      }
    }],
    "shipDateStamp": "2024-12-01",
    "packagingType": "YOUR_PACKAGING"
  }
}
```

### Response Structure

FedEx returns rates with:
- **Account-specific rates** (if you have a FedEx account with negotiated rates)
- **List rates** (standard FedEx published rates)
- **Transit time** (estimated delivery days)
- **Service name** (e.g., "FedEx International Priority")

The system automatically selects the cheapest rate from the response.

## Support

For FedEx API issues:
- FedEx Developer Support: https://developer.fedex.com/support
- FedEx Rates and Transit Times API Documentation: https://developer.fedex.com/api/en-us/catalog/rate/v1/docs.html
- API Reference: https://developer.fedex.com/api/en-us/catalog/rate/v1/api-ref.html

For Japrix integration issues:
- Check server logs for detailed error messages (look for 📦, 📬, ✅, ❌ emojis)
- Review `lib/fedex.ts` for API implementation
- Verify `.env` configuration
- Check that package has weight set

## Logging and Debugging

The system logs all FedEx API interactions:
- `📦 FedEx Rate Request:` - Full request sent to FedEx
- `📬 FedEx API Response Status:` - HTTP status code
- `✅ FedEx Rate Response:` - Full response from FedEx
- `💰 Calculated rate:` - Final rate in USD and JPY
- `❌ Error calculating FedEx rate:` - Any errors

Check your server logs when troubleshooting.

## Next Steps

After setting up FedEx API:

1. ✅ Test with a real USA order (create test order in admin)
2. ✅ Monitor FedEx API response times in logs
3. ✅ Adjust currency conversion if needed (currently 150 JPY/USD)
4. ✅ Fine-tune package dimension estimates in `lib/fedex.ts`
5. ✅ Set up alerts for FedEx API failures
6. ✅ Consider adding `INTERNATIONAL_ECONOMY` option for cheaper rates
