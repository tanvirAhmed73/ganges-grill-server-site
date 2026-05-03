export function renderVerificationEmail(params: {
  appName: string;
  recipientName: string;
  code: string;
  supportEmail?: string;
}): { subject: string; html: string; text: string } {
  const { appName, recipientName, code, supportEmail } = params;
  const subject = `Verify your email — ${appName}`;
  const text = [
    `Hi ${recipientName},`,
    '',
    `Your verification code is: ${code}`,
    '',
    `This code expires in 15 minutes. If you did not create an account with ${appName}, you can ignore this email.`,
    '',
    supportEmail ? `Questions? Reply to ${supportEmail}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ee;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2ee;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#8b4513 0%,#c45c26 100%);padding:28px 32px;">
              <p style="margin:0;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.85);">${escapeHtml(appName)}</p>
              <h1 style="margin:8px 0 0;font-size:26px;font-weight:600;color:#fff;line-height:1.25;">Confirm your email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 16px;font-size:17px;line-height:1.6;">Hi ${escapeHtml(recipientName)},</p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#444;">Use this one-time code to verify your account:</p>
              <div style="text-align:center;margin:28px 0 32px;">
                <span style="display:inline-block;padding:16px 36px;font-size:28px;font-weight:700;letter-spacing:0.25em;font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;color:#8b4513;background:#faf7f2;border-radius:10px;border:1px solid #e8dfd4;">${escapeHtml(code)}</span>
              </div>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#666;">This code expires in <strong>15 minutes</strong>. If you didn’t sign up for ${escapeHtml(appName)}, you can safely ignore this message.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px;border-top:1px solid #eee;">
              <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
                ${supportEmail ? `Need help? Contact us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#8b4513;">${escapeHtml(supportEmail)}</a>.` : ''}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:12px;color:#aaa;text-align:center;">This is an automated message — please do not reply unless a support address is shown above.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
