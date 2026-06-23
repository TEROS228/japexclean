import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Japrix <onboarding@resend.dev>';

function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:#16a34a;padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Japrix</div>
            <div style="font-size:13px;color:#bbf7d0;margin-top:4px;">Japan Shopping Service</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              © ${new Date().getFullYear()} Japrix · Japan Shopping Service<br>
              <a href="https://japrix.online" style="color:#16a34a;text-decoration:none;">japrix.online</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoBox(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <span style="font-size:13px;color:#6b7280;">${label}</span>
      <span style="float:right;font-size:13px;font-weight:600;color:#111827;">${value}</span>
    </td>
  </tr>`;
}

// ─── 1. Order placed ─────────────────────────────────────────────────────────
export async function sendOrderPlacedEmail(params: {
  email: string;
  name: string;
  orderId: string;
  items: Array<{ title: string; price: number; quantity: number }>;
  total: number;
}) {
  const { email, name, orderId, items, total } = params;

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">${i.title}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;white-space:nowrap;">×${i.quantity} &nbsp; ¥${(i.price * i.quantity).toLocaleString()}</td>
    </tr>`
  ).join('');

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Order Received! 🎉</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${name || 'there'}, we've received your order and it's being processed.</p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Order Details</td></tr>
        ${itemRows}
        <tr>
          <td style="padding-top:12px;font-size:15px;font-weight:700;color:#111827;">Total</td>
          <td style="padding-top:12px;font-size:15px;font-weight:700;color:#16a34a;text-align:right;">¥${total.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <tr><td style="font-size:13px;color:#6b7280;">Order ID</td><td style="font-size:13px;font-weight:600;color:#111827;text-align:right;">#${orderId.slice(-8).toUpperCase()}</td></tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      Our team will review your order shortly. You'll receive another email once it's approved and we begin purchasing your items.
    </p>

    <div style="text-align:center;">
      <a href="https://japrix.online/profile" style="display:inline-block;background:#16a34a;color:#fff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Track Your Order</a>
    </div>`;

  try {
    await resend.emails.send({ from: FROM, to: [email], subject: `Order Received – #${orderId.slice(-8).toUpperCase()}`, html: baseTemplate('Order Received', content) });
  } catch (e) {
    console.error('[Email] sendOrderPlacedEmail failed:', e);
  }
}

// ─── 2. Order approved ────────────────────────────────────────────────────────
export async function sendOrderApprovedEmail(params: {
  email: string;
  name: string;
  orderId: string;
  items: Array<{ title: string; price: number; quantity: number }>;
}) {
  const { email, name, orderId, items } = params;

  const itemList = items.map(i =>
    `<li style="margin-bottom:8px;font-size:14px;color:#374151;">✅ &nbsp;${i.title} <span style="color:#6b7280;">(×${i.quantity})</span></li>`
  ).join('');

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Order Approved! ✅</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${name || 'there'}, great news — your order has been approved and we're now purchasing your items.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;letter-spacing:.05em;">Items Being Purchased</p>
      <ul style="margin:0;padding:0 0 0 4px;list-style:none;">
        ${itemList}
      </ul>
    </div>

    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:13px;color:#6b7280;">Order ID</td><td style="font-size:13px;font-weight:600;color:#111827;text-align:right;">#${orderId.slice(-8).toUpperCase()}</td></tr>
        <tr><td style="font-size:13px;color:#6b7280;padding-top:8px;">Status</td><td style="font-size:13px;font-weight:600;color:#16a34a;text-align:right;padding-top:8px;">Purchasing</td></tr>
      </table>
    </div>

    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
      Once your items arrive at our warehouse in Japan, you'll receive another notification. This usually takes 3–7 business days.
    </p>

    <div style="text-align:center;">
      <a href="https://japrix.online/profile" style="display:inline-block;background:#16a34a;color:#fff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">View Order Status</a>
    </div>`;

  try {
    await resend.emails.send({ from: FROM, to: [email], subject: `Order Approved – #${orderId.slice(-8).toUpperCase()}`, html: baseTemplate('Order Approved', content) });
  } catch (e) {
    console.error('[Email] sendOrderApprovedEmail failed:', e);
  }
}

// ─── 3. Package arrived at warehouse ─────────────────────────────────────────
export async function sendPackageArrivedEmail(params: {
  email: string;
  name: string;
  itemTitle: string;
  weight?: number | null;
  trackingNumber?: string | null;
}) {
  const { email, name, itemTitle, weight, trackingNumber } = params;

  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Package Arrived at Warehouse! 📦</h2>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">Hi ${name || 'there'}, your item has arrived at our Japan warehouse and is ready for international shipping.</p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td colspan="2" style="padding-bottom:12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;">Package Details</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Item</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;text-align:right;max-width:260px;">${itemTitle}</td>
        </tr>
        ${weight ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;">Weight</td><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;font-weight:600;color:#111827;text-align:right;">${weight} kg</td></tr>` : ''}
        ${trackingNumber ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Tracking (JP)</td><td style="padding:8px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">${trackingNumber}</td></tr>` : ''}
      </table>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
        💡 <strong>Next step:</strong> Please go to your profile and select a shipping method & address to send the package internationally.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="https://japrix.online/profile" style="display:inline-block;background:#16a34a;color:#fff;font-weight:600;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Arrange Shipping</a>
    </div>`;

  try {
    await resend.emails.send({ from: FROM, to: [email], subject: '📦 Your package arrived at our warehouse', html: baseTemplate('Package Arrived', content) });
  } catch (e) {
    console.error('[Email] sendPackageArrivedEmail failed:', e);
  }
}
