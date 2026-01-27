# Supabase Edge Functions - Email System

## 📋 Pregled

Ove Edge Functions omogućavaju slanje i primanje email-ova preko SMTP/IMAP protokola.

## 🚀 Deployment

### Preduslov

1. Instalirajte Supabase CLI:
```bash
npm install -g supabase
```

2. Login u Supabase:
```bash
supabase login
```

3. Link projekat:
```bash
supabase link --project-ref your-project-ref
```

### Deploy Functions

Deploy sve funkcije odjednom:
```bash
supabase functions deploy send-email
supabase functions deploy fetch-emails
supabase functions deploy test-email-connection
```

Ili deploy pojedinačno:
```bash
# Deploy send-email
supabase functions deploy send-email

# Deploy fetch-emails
supabase functions deploy fetch-emails

# Deploy test-email-connection
supabase functions deploy test-email-connection
```

## 📝 Funkcije

### 1. send-email

**Endpoint**: `https://your-project.supabase.co/functions/v1/send-email`

**Opis**: Šalje email preko SMTP servera

**Request Body**:
```json
{
  "config": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "your-email@gmail.com",
    "smtp_password": "your-app-password",
    "use_ssl": true
  },
  "email": {
    "from": "your-email@gmail.com",
    "to": ["recipient@example.com"],
    "cc": ["cc@example.com"],
    "bcc": ["bcc@example.com"],
    "subject": "Test Email",
    "text": "Plain text content",
    "html": "<p>HTML content</p>",
    "attachments": [
      {
        "filename": "document.pdf",
        "content": "base64-encoded-content",
        "contentType": "application/pdf"
      }
    ]
  }
}
```

**Response**:
```json
{
  "success": true,
  "messageId": "1234567890.abc123@olympichub",
  "message": "Email sent successfully"
}
```

### 2. fetch-emails

**Endpoint**: `https://your-project.supabase.co/functions/v1/fetch-emails`

**Opis**: Preuzima email-ove sa IMAP servera

**Request Body**:
```json
{
  "config": {
    "imap_host": "imap.gmail.com",
    "imap_port": 993,
    "imap_user": "your-email@gmail.com",
    "imap_password": "your-app-password",
    "use_ssl": true
  },
  "folder": "INBOX",
  "limit": 50
}
```

**Response**:
```json
{
  "success": true,
  "emails": [
    {
      "messageId": "unique-message-id",
      "from": "sender@example.com",
      "to": ["your-email@gmail.com"],
      "subject": "Email Subject",
      "text": "Plain text content",
      "html": "<p>HTML content</p>",
      "date": "2025-12-30T18:00:00Z",
      "flags": ["\\Seen"],
      "attachments": []
    }
  ]
}
```

**Napomena**: Trenutna implementacija vraća mock podatke. Za production, potrebno je implementirati pravu IMAP integraciju koristeći `node-imap` biblioteku.

### 3. test-email-connection

**Endpoint**: `https://your-project.supabase.co/functions/v1/test-email-connection`

**Opis**: Testira SMTP i IMAP konekcije

**Request Body**:
```json
{
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "user": "your-email@gmail.com",
    "password": "your-app-password",
    "use_ssl": true
  },
  "imap": {
    "host": "imap.gmail.com",
    "port": 993,
    "user": "your-email@gmail.com",
    "password": "your-app-password",
    "use_ssl": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "smtp": {
    "success": true,
    "error": ""
  },
  "imap": {
    "success": true,
    "error": ""
  },
  "message": "Both SMTP and IMAP connections successful"
}
```

## 🔧 Lokalno Testiranje

Pokrenite funkcije lokalno:

```bash
# Start Supabase local development
supabase start

# Serve functions locally
supabase functions serve send-email --env-file ./supabase/.env.local
```

Test sa curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "config": {
      "smtp_host": "smtp.gmail.com",
      "smtp_port": 587,
      "smtp_user": "test@gmail.com",
      "smtp_password": "app-password",
      "use_ssl": true
    },
    "email": {
      "from": "test@gmail.com",
      "to": ["recipient@example.com"],
      "subject": "Test",
      "text": "Hello World"
    }
  }'
```

## 📊 Monitoring

Pratite logove:
```bash
supabase functions logs send-email
supabase functions logs fetch-emails
supabase functions logs test-email-connection
```

## 🔐 Sigurnost

- Edge Functions izvršavaju se na Supabase serveru, ne u browseru
- Email lozinke se ne čuvaju u frontend kodu
- Koristite Row Level Security (RLS) za zaštitu email konfiguracija
- Preporučuje se korišćenje App Passwords umesto običnih lozinki

## ⚠️ Važne Napomene

### IMAP Implementacija

Trenutna `fetch-emails` funkcija vraća mock podatke. Za production:

1. **Opcija 1**: Koristite `node-imap` biblioteku
   ```typescript
   import Imap from 'npm:imap@0.8.19';
   import { simpleParser } from 'npm:mailparser@3.6.5';
   ```

2. **Opcija 2**: Koristite Gmail API ili Outlook Graph API
   - Gmail API: https://developers.google.com/gmail/api
   - Outlook API: https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview

3. **Opcija 3**: Koristite third-party servis (SendGrid, Mailgun, etc.)

### Rate Limiting

Dodajte rate limiting za production:
```typescript
// U Edge Function
const rateLimiter = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;
```

## 🐛 Troubleshooting

**Problem**: "Module not found: denomailer"
- **Rešenje**: Proverite da li je URL ispravan u import statement-u

**Problem**: "Connection timeout"
- **Rešenje**: Proverite firewall pravila i SMTP/IMAP portove

**Problem**: "Authentication failed"
- **Rešenje**: Koristite App Password za Gmail, ne običnu lozinku

## 📚 Dodatni Resursi

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [SMTP Protocol](https://www.rfc-editor.org/rfc/rfc5321)
- [IMAP Protocol](https://www.rfc-editor.org/rfc/rfc3501)
