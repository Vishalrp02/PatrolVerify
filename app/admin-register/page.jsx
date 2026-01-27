"use client";
import { registerAdminAction } from "@/app/actions/auth";
import Link from "next/link";
import { useState } from "react";

export default function AdminRegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    setError("");

    // Verify admin access key
    const accessKey = formData.get("accessKey");
    if (accessKey !== process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY) {
      setError("Invalid admin access key");
      setLoading(false);
      return;
    }

    // Remove access key from form data before sending to registerAction
    formData.delete("accessKey");
    
    const result = await registerAdminAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="text-center mb-6">
          <div className="bg-red-600 text-white w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            A
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Registration</h1>
          <p className="text-gray-500">Create supervisor account</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Access Key
            </label>
            <input
              name="accessKey"
              type="password"
              placeholder="Enter admin access key"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="e.g. John Supervisor"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              name="username"
              type="text"
              placeholder="e.g. admin01"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-gray-900"
            />
          </div>

          <input
            name="role"
            type="hidden"
            value="ADMIN"
          />

          <button
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? "Creating Admin Account..." : "Create Admin Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Need a guard account?{" "}
          <Link
            href="/signup"
            className="text-blue-600 font-semibold hover:underline"
          >
            Register as guard
          </Link>
        </p>
      </div>
    </div>
  );
}
