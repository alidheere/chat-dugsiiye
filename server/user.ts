

"use server";

import { headers } from "next/headers";
import { auth } from "../lib/auth";


// Signup
export async function signup(email: string, password: string) {
  const user = await auth.api.signUpEmail({
    body: {
      name: email.split("@")[0],
      email,
      password,
    },
  });

  return user;
}

// Login
export async function login(email: string, password: string) {
  return await auth.api.signInEmail({
    body: {
      email,
      password,
    },
  });
}

// Get current user
export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}
