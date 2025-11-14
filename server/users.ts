"use server";


import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import db from "@/db/drizzle";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

import { userSchema } from "./schemas";

// Define a mapping for known English error messages to German
const errorTranslations: Record<string, string> = {
    "Password too short": "Passwort zu kurz",
    "Invalid credentials": "Ungültige Anmeldedaten",
    "User not found": "Benutzer nicht gefunden",
    // Add other known error messages from better-auth as needed
};

// Helper function to translate error messages
const translateError = (message: string): string => {
    return errorTranslations[message] || "Ein unbekannter Fehler ist aufgetreten";
};

export const getUserSession = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("User not found");
    }

    const currentUser = await db.query.user.findFirst({
        where: eq(user.id, session?.user?.id),
    });

    if (!currentUser) {
        throw new Error("User not found");
    }

    return {
        ...session,
        user: currentUser,
    };
}

export const signIn = async (_: unknown, formData: FormData): Promise<{
    errors: Record<string, string[]>;
    values: Record<string, string>;
    redirect?: string;
}> => {
    const formValues = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    }

    try {
        const signInResult = await auth.api.signInEmail({
            body: {
                email: formValues.email,
                password: formValues.password,
            },

        })

        return {
            errors: {},
            values: {
                text: "Erfolgreich angemeldet.",
            },
            redirect: "/dashboard/",
        }
    } catch (e: unknown) {
        const error = e as Error;
        const translatedMessage = translateError(error.message);
        return {
            errors: { message: [translatedMessage] },
            values: {},
        }
    }
}

export const signUp = async (_: unknown, formData: FormData): Promise<{
    errors: Record<string, string[]>;
    values: Record<string, string>;
    redirect?: string;
}> => {
    const formValues = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        name: formData.get("name") as string,
    }

    // Validate email domain
    // if (!formValues.email.endsWith("@itaurus.at")) {
    //     return {
    //         errors: { message: ["Nur E-Mail-Adressen mit der Domain @itaurus.at sind erlaubt."] },
    //         values: {},
    //     };
    // }

    try {
        const signUpResult = await auth.api.signUpEmail({
            body: {
                email: formValues.email,
                password: formValues.password,
                name: formValues.name,
                callbackURL: '/dashboard/'
            }
        })

        return {
            errors: {},
            values: {
                text: "Verifizierungslink an Ihre E-Mail-Adresse gesendet.",
            },
        }
    } catch (e) {
        const error = e as Error;
        const translatedMessage = translateError(error.message);
        return {
            errors: { message: [translatedMessage] },
            values: {},
        }
    }
}

export const getUserProfile = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user?.id) {
        throw new Error("User not found");
    }

    const currentUser = await db.query.user.findFirst({
        where: eq(user.id, session?.user?.id),
    });

    if (!currentUser) {
        throw new Error("User not found");
    }

    return {
        ...session,
        user: currentUser,
    };
}

export const updateProfile = async (data: z.infer<typeof userSchema>) => {
    const session = await getUserSession();

    try {
        await db.update(user).set(data).where(eq(user.id, session?.user?.id));

        return {
            values: {
                text: "Profil erfolgreich aktualisiert.",
            },
            redirect: "/dashboard/",
        }
    } catch (e) {
        const error = e as Error;
        const translatedMessage = translateError(error.message);
        return {
            errors: { message: [translatedMessage] },
        }
    }
}