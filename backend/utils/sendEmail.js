const nodemailer = require('nodemailer');

/**
 * Send an HTML order confirmation email to the user.
 * Silently skips if EMAIL_USER / EMAIL_PASS are not configured.
 *
 * @param {Object} options
 * @param {string} options.to         - Recipient email address
 * @param {Object} options.order      - Saved Mongoose order document
 * @param {string} options.userName   - Display name of the user
 */
const sendOrderConfirmationEmail = async ({ to, order, userName }) => {
  // Gracefully skip if credentials not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] Skipped — EMAIL_USER / EMAIL_PASS not set in .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const shortId = order._id.toString().slice(-6).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build item rows for the email table
  const itemRows = (order.items || [])
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">
            ${item.productId?.name || 'Product'}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
            ${item.size}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">
            $${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>`
    )
    .join('');

  const { fullName, address, city, state, postalCode, country, phoneNumber } =
    order.shippingDetails || {};

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  </head>
  <body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#f7f7f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:#111111;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:2px;font-weight:800;">FITSY</h1>
                <p style="margin:8px 0 0;color:#aaaaaa;font-size:13px;letter-spacing:1px;">ORDER CONFIRMED</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 24px;font-size:16px;color:#333;">Hi <strong>${userName}</strong>,</p>
                <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                  Thank you for your purchase! Your order has been placed successfully and is now being processed. 
                  Here's a summary of what you ordered.
                </p>

                <!-- Order Info -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                  <tr>
                    <td style="padding:12px 16px;background:#f9f9f9;border-radius:8px;">
                      <table width="100%">
                        <tr>
                          <td style="font-size:13px;color:#888;">Order ID</td>
                          <td style="font-size:13px;color:#111;font-weight:700;text-align:right;">#${shortId}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:#888;padding-top:6px;">Order Date</td>
                          <td style="font-size:13px;color:#111;text-align:right;padding-top:6px;">${orderDate}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:#888;padding-top:6px;">Payment Method</td>
                          <td style="font-size:13px;color:#111;text-align:right;padding-top:6px;">${order.paymentMethod}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:#888;padding-top:6px;">Status</td>
                          <td style="font-size:13px;font-weight:700;color:#b45309;text-align:right;padding-top:6px;">${order.status}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Items Table -->
                <h3 style="margin:0 0 12px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#888;">Items Ordered</h3>
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:8px;overflow:hidden;margin-bottom:32px;">
                  <thead>
                    <tr style="background:#f9f9f9;">
                      <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">PRODUCT</th>
                      <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">SIZE</th>
                      <th style="padding:10px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">QTY</th>
                      <th style="padding:10px 12px;text-align:right;font-size:12px;color:#888;font-weight:600;">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemRows}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3" style="padding:14px 12px;font-weight:700;font-size:15px;">Grand Total</td>
                      <td style="padding:14px 12px;font-weight:700;font-size:15px;text-align:right;color:#111;">$${order.totalPrice.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>

                <!-- Shipping Address -->
                <h3 style="margin:0 0 12px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#888;">Shipping To</h3>
                <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:32px;font-size:14px;color:#444;line-height:1.7;">
                  <strong style="color:#111;">${fullName}</strong><br/>
                  ${address}, ${city}${state ? `, ${state}` : ''} ${postalCode}<br/>
                  ${country}
                  ${phoneNumber ? `<br/>📞 ${phoneNumber}` : ''}
                </div>

                <p style="font-size:14px;color:#555;line-height:1.6;margin:0;">
                  We'll notify you once your order ships. If you have any questions, reply to this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
                <p style="margin:0;font-size:12px;color:#aaa;">© ${new Date().getFullYear()} Fitsy. All rights reserved.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  try {
    await transporter.sendMail({
      from: `"Fitsy Store" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Order Confirmed — #${shortId} | Fitsy`,
      html,
    });
    console.log(`[Email] Order confirmation sent to ${to}`);
  } catch (err) {
    // Silent failure — do not crash the order
    console.error('[Email] Failed to send confirmation email:', err.message);
  }
};

module.exports = { sendOrderConfirmationEmail };
