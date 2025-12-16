# Email Templates Configuration

This document contains custom email templates for the Massawa Time Tracking System.

## 📧 How to Apply Templates in Supabase

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Email Templates**
3. Select the template you want to customize (e.g., "Confirm signup")
4. Copy the template from below
5. Paste it into the Supabase editor
6. Click **Save**

## ✅ Confirmation Email Template

Use this template for the "Confirm signup" email:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestig je account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Massawa
              </h1>
              <p style="margin: 8px 0 0; color: #a0a0a0; font-size: 14px;">
                Urenregistratie Systeem
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1f; font-size: 24px; font-weight: 600;">
                Bevestig je account
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Welkom bij Massawa! Klik op de onderstaande knop om je e-mailadres te bevestigen en je account te activeren.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(26, 26, 31, 0.2); transition: transform 0.2s;">
                  Bevestig je e-mail
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                Of kopieer en plak deze link in je browser:
              </p>
              <p style="margin: 10px 0 0; color: #1a1a1f; font-size: 12px; word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.6;">
                  <strong>Let op:</strong> Deze link is 24 uur geldig. Als je deze e-mail niet hebt aangevraagd, kun je deze negeren.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 13px;">
                © 2024 Massawa Restaurant. Alle rechten voorbehouden.
              </p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                Deze e-mail is automatisch gegenereerd. Reageer hier niet op.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 🔄 Password Reset Email Template

Use this template for the "Reset password" email:

```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wachtwoord resetten</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Massawa
              </h1>
              <p style="margin: 8px 0 0; color: #a0a0a0; font-size: 14px;">
                Urenregistratie Systeem
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1f; font-size: 24px; font-weight: 600;">
                Wachtwoord resetten
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Je hebt een verzoek gedaan om je wachtwoord te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(26, 26, 31, 0.2);">
                  Reset wachtwoord
                </a>
              </div>
              
              <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                Of kopieer en plak deze link in je browser:
              </p>
              <p style="margin: 10px 0 0; color: #1a1a1f; font-size: 12px; word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 6px; font-family: 'Courier New', monospace;">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.6;">
                  <strong>Let op:</strong> Deze link is 1 uur geldig. Als je deze e-mail niet hebt aangevraagd, kun je deze negeren. Je wachtwoord blijft ongewijzigd.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 13px;">
                © 2024 Massawa Restaurant. Alle rechten voorbehouden.
              </p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                Deze e-mail is automatisch gegenereerd. Reageer hier niet op.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## 📝 Available Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL

## 🎨 Customization Tips

1. **Colors**: Update the gradient colors to match your brand
2. **Logo**: Add an image tag with your logo URL in the header
3. **Language**: Change all text to match your preferred language
4. **Styling**: Adjust padding, margins, and font sizes as needed

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl
- **Email Templates**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/auth/templates
- **Project Settings**: https://supabase.com/dashboard/project/ltqrnbehaultyndnmjcl/settings/auth

## ✅ Testing

After updating the template:

1. Go to **Authentication** → **Users** in Supabase
2. Create a test user or use an existing one
3. Trigger a confirmation email
4. Check your email to verify the template looks correct

---

**Note**: Email templates are configured in Supabase Dashboard, not in the codebase. This file serves as documentation and reference.

