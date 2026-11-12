import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/drizzle";
import { schema } from "../db/schema";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
   socialProviders: {
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
               accessType: "offline",           // Forces refresh token
            prompt: "select_account consent", // Forces consent screen
        }, 
    },

  plugins: [nextCookies()],
});