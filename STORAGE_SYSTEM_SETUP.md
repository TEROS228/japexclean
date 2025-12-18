# Storage System Setup Guide

## Overview

The storage system automatically manages package storage with the following rules:
- **60 days** of free storage
- **After 60 days**: ¥30/day paid storage (unlimited if paid regularly)
- **Automatic disposal** if 10 consecutive days without payment

## Features Implemented

### 1. Database Schema
- Added storage tracking fields to `Package` model:
  - `storageDaysUsed`: DEPRECATED - kept for compatibility
  - `storageFeesPaid`: DEPRECATED - kept for compatibility
  - `storageFeesAmount`: Total amount paid for storage (cumulative)
  - `lastStorageFeeCheck`: Last check timestamp (used by cron)
  - `lastStoragePayment`: Date of last payment (null = never paid)

### 2. API Endpoints

#### `/api/user/packages` (GET)
Returns packages with `storageInfo` object containing:
- `totalDays`: Days since arrival
- `freeDaysRemaining`: Free storage days left (0-60)
- `unpaidDays`: Days without payment (0-10+)
- `daysUntilDisposal`: Days until disposal if not paid (0-10)
- `currentFee`: Current unpaid fee amount
- `isExpired`: Whether 10 days passed without payment
- `canShip`: Can request shipping (true only if unpaidDays === 0)
- `status`: 'free', 'paid', or 'expired'

#### `/api/user/packages/[id]/pay-storage` (POST)
Pays accumulated storage fees for a package.

**Request:**
```bash
curl -X POST https://your-domain.com/api/user/packages/PACKAGE_ID/pay-storage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "package": { ... },
  "paid": 150
}
```

#### `/api/user/packages/[id]/request-shipping` (POST)
Updated to check storage fees before allowing shipping request.

**Error responses:**
- If storage expired: `"Storage period expired (10 days without payment). This package has been marked for disposal."`
- If unpaid fees: `"Please pay storage fees before requesting shipping"` with `storageFee`, `unpaidDays`, `daysUntilDisposal`

#### `/api/cron/check-expired-packages` (GET)
Automated cron job endpoint that:
1. Checks all packages in warehouse
2. Disposes packages with 10+ days without payment
3. Sends warnings every 2 days for unpaid storage
4. Sends reminders when ≤5 days free storage remaining

### 3. Frontend Components

#### `StorageTimer` Component
Visual timer showing storage status:
- 🆓 Green: Free storage remaining
- ✅ Green: Paid storage - all fees paid (unlimited storage)
- 💰 Orange: Unpaid days accumulated with "Pay Now" button
- ❌ Red: Expired (10 days without payment), marked for disposal

#### `useStorage` Hook
React hook for storage operations:
```tsx
const { payStorageFees, loading, error } = useStorage();

await payStorageFees(packageId);
```

## Setup Instructions

### 1. Environment Variables

Add to `.env` or `.env.local`:
```bash
# Cron job secret key (generate random string)
CRON_SECRET=your_random_secret_key_here
```

### 2. Database Migration

Already applied via SQL:
```sql
ALTER TABLE packages ADD COLUMN "storageDaysUsed" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE packages ADD COLUMN "storageFeesPaid" BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE packages ADD COLUMN "storageFeesAmount" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE packages ADD COLUMN "lastStorageFeeCheck" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL;
```

### 3. Cron Job Setup

You need to set up a cron job to run `/api/cron/check-expired-packages` daily.

#### Option A: Using cron-job.org (Recommended for ease)

1. Go to https://cron-job.org
2. Create free account
3. Add new cron job:
   - **URL**: `https://your-domain.com/api/cron/check-expired-packages?secret=YOUR_CRON_SECRET`
   - **Schedule**: Every day at 00:00 (midnight)
   - **Title**: Check Expired Packages

#### Option B: Using server crontab

1. SSH into your server
2. Edit crontab: `crontab -e`
3. Add line:
   ```
   0 0 * * * curl "https://your-domain.com/api/cron/check-expired-packages?secret=YOUR_CRON_SECRET"
   ```

#### Option C: Using Vercel Cron (if using Vercel)

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-expired-packages?secret=YOUR_CRON_SECRET",
    "schedule": "0 0 * * *"
  }]
}
```

### 4. Testing

#### Test storage calculation:
```bash
# Get packages and check storageInfo
curl https://your-domain.com/api/user/packages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test payment:
```bash
curl -X POST https://your-domain.com/api/user/packages/PACKAGE_ID/pay-storage \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test cron job:
```bash
curl "https://your-domain.com/api/cron/check-expired-packages?secret=YOUR_CRON_SECRET"
```

## How It Works

### Timeline Example

**Day 1-60**: Free Storage
- Package shows: "🆓 Free Storage - 45 days remaining"
- User can request shipping anytime
- When ≤5 days remain, warning shown

**Day 61+**: Paid Storage (¥30/day)
- Free period ended, paid storage begins
- Each day adds ¥30 to unpaid balance
- User can pay anytime to reset counter

**Day 61-65** (5 days unpaid):
- Package shows: "💰 Unpaid Storage - ¥150 (5 days × ¥30)"
- "Pay Now" button appears
- "5 days until disposal" warning
- Cannot request shipping until paid

**User pays** (at day 65):
- Payment of ¥150 processed
- `lastStoragePayment` set to NOW
- Counter resets to 0
- Package shows: "✅ All fees paid"
- Can request shipping OR continue storing

**Day 66-75** (10 more days):
- If user pays regularly: unlimited storage continues
- If user doesn't pay for 10 days: disposal triggered

**After 10 days without payment**:
- Package automatically marked as `disposed: true`
- Shows: "❌ Storage Expired - 10 days without payment"
- User receives notification
- Admin receives Telegram alert
- Cannot ship, no refund

### User Workflow

1. Package arrives → 60-day countdown starts
2. At day 55 → Warning: "5 days of free storage remaining"
3. At day 61 → Paid storage begins at ¥30/day
4. Each day → Unpaid balance increases by ¥30
5. User can pay anytime → Resets unpaid counter to 0
6. After payment → Can ship OR continue storing (unlimited)
7. If 10 days pass without payment → Package disposed
8. User can pay multiple times → Keeps package as long as payments made within 10 days

### Admin Notifications

Telegram alerts sent for:
- Package disposal (10 days without payment)
- NOT sent for regular payments (too noisy)

## Integration with Profile Page

To integrate into your profile/packages page:

```tsx
import StorageTimer from '../components/StorageTimer';
import { useStorage } from '../hooks/useStorage';

function PackageItem({ pkg }) {
  const { payStorageFees, loading } = useStorage();

  const handlePayStorage = async () => {
    try {
      await payStorageFees(pkg.id);
      // Refresh packages
      refetchPackages();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h3>{pkg.orderItem.title}</h3>

      {/* Storage Timer */}
      <StorageTimer
        storageInfo={pkg.storageInfo}
        onPayFees={handlePayStorage}
        isPayingFees={loading}
      />

      {/* Rest of package UI */}
    </div>
  );
}
```

## Monitoring

Check cron job logs:
```bash
# View logs
tail -f /var/log/syslog | grep "Cron"

# Or check your application logs
pm2 logs your-app | grep "\[Cron\]"
```

## Troubleshooting

**Storage fees not calculating:**
- Check `arrivedAt` field is set on packages
- Verify `storageInfo` is included in API response

**Cron not running:**
- Verify CRON_SECRET matches in .env and cron URL
- Check cron-job.org execution history
- Test endpoint manually with curl

**Payment failing:**
- Check user has sufficient balance
- Verify package is in 'paid' storage status
- Check `storageFeesPaid` is false

## Notes

- All times use server timezone
- Storage fees are NON-REFUNDABLE
- Disposed packages are NOT deleted from database (just marked)
- Consolidated packages inherit earliest `arrivedAt` date
