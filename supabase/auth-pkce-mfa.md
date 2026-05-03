# PKCE + MFA Authentication Flow

## Overview
Implementation of OAuth 2.0 with PKCE for TaniHR, with optional MFA for privileged users.

## Authentication Flow

```
[User] → [Login Page] → [Auth Code Request] → [Authorization Server]
                                                              ↓
[Callback] ← [Auth Code + Code Verifier] ← [User Consent]
                    ↓
            [Token Exchange] → [Access Token + Refresh Token]
                    ↓
              [MFA Challenge (if enabled)]
                    ↓
              [Authenticated Session]
```

## Implementation

### 1. Login Page (PKCE Initiated)
```javascript
// Generate code_verifier and code_challenge
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoaUrlSafe(Array.from(array));
};

const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoaUrlSafe(Array.from(new Uint8Array(digest)));
};
```

### 2. Authorization Request
```javascript
const authUrl = new URL('https://auth.tanihr.com/oauth/authorize');
authUrl.searchParams.set('client_id', CLIENT_ID);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('scope', 'openid profile email');
authUrl.searchParams.set('state', state);
```

### 3. Token Exchange
```javascript
const tokenResponse = await fetch('https://auth.tanihr.com/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    code: authCode,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier, // PKCE verifier
  })
});
```

### 4. MFA Challenge
```javascript
// After successful token exchange, if MFA enabled:
if (tokenResponse.mfa_required) {
  // Show MFA input
  const mfaResponse = await fetch('/api/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({
      mfa_token: tokenResponse.mfa_token,
      code: mfaCode, // TOTP or SMS
    })
  });
  // Get final tokens
}
```

## MFA Options

### TOTP (Authenticator App)
- Use Google Authenticator or similar
- 6-digit codes, 30-second refresh

### SMS OTP
- Phone-based verification
- 6-digit codes, 5-minute expiry

## Token Management

### Access Token
- Short-lived: 15 minutes
- Stored in memory only

### Refresh Token
- Long-lived: 30 days
- Stored in httpOnly cookie
- Rotated on each use

### Logout
- Invalidate refresh token
- Clear all tokens from client

## Implementation in Supabase

### Using Supabase Auth
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// Sign in with OAuth (PKCE)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google', // or 'github', etc.
  options: {
    redirectTo: 'https://app.tanihr.com/auth/callback',
    scopes: 'email profile openid',
  }
})
```

### Enabling MFA
```javascript
// Enroll MFA for user
await supabase.auth.mfa.enroll({
  factorType: 'totp',
})

// Verify MFA
await supabase.auth.mfa.verify({
  factorId: factorId,
  code: mfaCode,
})
```

## Security Considerations

1. **Code Verifier** - Generate securely, min 43 chars
2. **State Parameter** - Prevent CSRF attacks
3. **Redirect URI** - Exact match only
4. **Token Storage** - Never store in localStorage
5. **HTTPS Only** - All production traffic

## Role-Based Access

| Role | MFA Required | Notes |
|------|-------------|-------|
| Super Admin | Yes (mandatory) | Full system access |
| HR Admin | Yes (mandatory) | All employee data |
| Manager | Optional | Team data only |
| Employee | No | Self-service only |