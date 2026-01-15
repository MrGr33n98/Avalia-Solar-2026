import { betterAuth } from 'better-auth';
import { toNextJsHandler, nextCookies } from 'better-auth/next-js';

const auth = betterAuth({
  socialProviders: {
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID as string,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
});

export const { GET, POST, PATCH, PUT, DELETE } = toNextJsHandler(auth);
