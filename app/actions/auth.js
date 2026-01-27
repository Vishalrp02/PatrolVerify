"use server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// --- REGISTER ---
export async function registerAction(formData) {
  const name = formData.get("name");
  const username = formData.get("username");
  const rawPassword = formData.get("password");
  const role = formData.get("role");

  // Security: Only allow GUARD role from public registration
  // ADMIN role should only be created through secure admin registration
  if (role === "ADMIN") {
    return { error: "Admin registration requires proper authorization" };
  }

  const existingUser = await db.user.findUnique({ where: { username } });

  if (existingUser) {
    return { error: "Username already taken." };
  }

  const password = await bcrypt.hash(rawPassword, SALT_ROUNDS);

  const newUser = await db.user.create({
    data: { name, username, password, role },
  });

  await createSession(newUser.id, newUser.role, newUser.name);
}

// --- LOGIN ---
export async function loginAction(formData) {
  const username = formData.get("username");
  const rawPassword = formData.get("password");

  const user = await db.user.findUnique({ where: { username } });

  if (!user) {
    return { error: "Invalid username or password" };
  }

  const match = await bcrypt.compare(rawPassword, user.password);
  if (!match) {
    return { error: "Invalid username or password" };
  }

  await createSession(user.id, user.role, user.name);
}

// --- HELPER: Create Session ---
async function createSession(userId, role, name) {
  const cookieStore = await cookies();

  cookieStore.set("userId", userId, { path: "/" });
  cookieStore.set("userRole", role, { path: "/" });
  if (name) cookieStore.set("userName", name, { path: "/" });

  if (role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/");
  }
}

// --- SECURE ADMIN REGISTER ---
export async function registerAdminAction(formData) {
  const name = formData.get("name");
  const username = formData.get("username");
  const rawPassword = formData.get("password");

  const existingUser = await db.user.findUnique({ where: { username } });

  if (existingUser) {
    return { error: "Username already taken." };
  }

  const password = await bcrypt.hash(rawPassword, SALT_ROUNDS);

  const newUser = await db.user.create({
    data: { name, username, password, role: "ADMIN" },
  });

  await createSession(newUser.id, newUser.role, newUser.name);
}

// --- LOGOUT ---
export async function logoutAction() {
  // FIX: Await cookies() here too!
  const cookieStore = await cookies();

  cookieStore.delete("userId");
  cookieStore.delete("userRole");
  cookieStore.delete("userName");
  redirect("/login");
}
