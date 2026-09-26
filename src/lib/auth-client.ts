import { createAuthClient } from 'better-auth/client';
import { emailOTPClient } from 'better-auth/client/plugins';

// Browser side of admin sign-in (the /admin pages only). Same origin, so no baseURL.
export const authClient = createAuthClient({ plugins: [emailOTPClient()] });
