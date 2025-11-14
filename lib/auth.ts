import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import db from "@/db/drizzle";
import * as schema from "@/db/schema";

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    socialProviders: {
        microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID!,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
            tenantId: process.env.MICROSOFT_TENANT_ID!,
            scope: ["openid", "profile", "email"],
        },
    },
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user: schema.user,
            account: schema.account,
            session: schema.session,
            verification: schema.verification,
        },
    }),
    plugins: [nextCookies()],
    logger: {
        level: "error", // Only show errors, not debug info
    },
});