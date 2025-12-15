"use client";

import React from "react";

const API_DOCS = [
  {
    group: "Auth",
    base: "/api/auth",
    note: "⚠️ UPDATED: Login/Register responses now include 'profileCompleted' and 'name' in the user object. Check profileCompleted to determine if user needs to complete their profile.",
    endpoints: [
      {
        method: "POST",
        path: "/register",
        description: "Register a new user. Response includes profileCompleted: false (user needs to complete profile).",
        auth: "Public",
        body: {
          email: "string (required)",
          password: "string (required)",
        },
      },
      {
        method: "POST",
        path: "/login",
        description: "Login with email and password. Check response user.profileCompleted to decide navigation.",
        auth: "Public",
        body: {
          email: "string (required)",
          password: "string (required)",
        },
      },
      {
        method: "POST",
        path: "/register-admin",
        description: "Create an admin user (dev-only; protect/disable in production).",
        auth: "Public (should be restricted in production)",
        body: {
          email: "string (required)",
          password: "string (required)",
        },
      },
    ],
  },
  {
    group: "Admin Users",
    base: "/api/admin",
    note: "All endpoints require Authorization: Bearer <JWT> with role=admin.",
    endpoints: [
      {
        method: "GET",
        path: "/users",
        description: "List users with pagination and optional search.",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on email)",
        },
        auth: "Admin",
      },
      {
        method: "GET",
        path: "/users/:id",
        description: "Get a single user by id.",
        auth: "Admin",
      },
      {
        method: "PUT",
        path: "/users/:id",
        description: "Update user fields (email, password, role).",
        auth: "Admin",
        body: {
          email: "string (optional)",
          password: "string (optional)",
          role: "string (optional, e.g. 'user' | 'admin')",
        },
      },
      {
        method: "DELETE",
        path: "/users/:id",
        description: "Delete a user.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Admin Summary",
    base: "/api/admin/summary",
    note: "All endpoints require Authorization: Bearer <JWT> with role=admin.",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "Get counts for users, categories, exercises, workouts, meditations, nutrition, medicines, faqs.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Categories",
    base: "/api/categories",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List categories with pagination and search.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on name/slug/description)",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single category by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a category.",
        auth: "Admin",
        body: {
          name: "string (required)",
          description: "string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a category.",
        auth: "Admin",
        body: {
          name: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a category.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Exercises",
    base: "/api/exercises",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List exercises with pagination, search, category and difficulty filters.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on title/slug/description)",
          category: "string (optional category id)",
          difficulty: "string (optional, e.g. 'beginner' | 'intermediate' | 'advanced')",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single exercise by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create an exercise.",
        auth: "Admin",
        body: {
          title: "string (required)",
          category: "string (optional category id)",
          description: "string (optional)",
          difficulty: "string (optional, default 'beginner')",
          duration: "number (optional seconds/minutes depending on UI)",
          equipment: "string[] | string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update an exercise.",
        auth: "Admin",
        body: {
          title: "string (optional)",
          category: "string (optional category id or empty to clear)",
          description: "string (optional)",
          difficulty: "string (optional)",
          duration: "number (optional)",
          equipment: "string[] | string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete an exercise.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Workouts",
    base: "/api/workouts",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List workouts with pagination, search, difficulty and optional category filter.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on name/slug/description)",
          difficulty: "string (optional)",
          category: "string (optional category id; filters by workouts containing exercises in that category)",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single workout by id (including populated exercises).",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a workout.",
        auth: "Admin",
        body: {
          name: "string (required)",
          description: "string (optional)",
          difficulty: "string (optional, default 'beginner')",
          exercises: "string[] exercise ids (optional)",
          thumbnail: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a workout.",
        auth: "Admin",
        body: {
          name: "string (optional)",
          description: "string (optional)",
          difficulty: "string (optional)",
          exercises: "string[] exercise ids (optional; empty array clears)",
          thumbnail: "string URL (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a workout.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Meditations",
    base: "/api/meditations",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List meditations with pagination, search and category filter.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on title)",
          category: "string (optional category id)",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single meditation by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a meditation.",
        auth: "Admin",
        body: "See Meditation model; this route forwards body directly to Mongoose.",
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a meditation.",
        auth: "Admin",
        body: "Partial Meditation fields.",
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a meditation.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Nutrition",
    base: "/api/nutrition",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List nutrition items with pagination, search and type filter.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on title/slug/description)",
          type: "string (optional, e.g. 'Recipe')",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get a single nutrition item by id.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create a nutrition item.",
        auth: "Admin",
        body: {
          title: "string (required)",
          description: "string (optional)",
          type: "string (optional, default 'Recipe')",
          image: "string URL (optional)",
          calories: "number (optional)",
          ingredients: "string[] | string (optional)",
          instructions: "string (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a nutrition item.",
        auth: "Admin",
        body: {
          title: "string (optional)",
          description: "string (optional)",
          type: "string (optional)",
          image: "string URL (optional)",
          calories: "number (optional)",
          ingredients: "string[] | string (optional)",
          instructions: "string (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a nutrition item.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Medicines",
    base: "/api/medicines",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List medicines with pagination and search.",
        auth: "Public",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional search on name/slug/description)",
        },
      },
      {
        method: "POST",
        path: "/",
        description: "Create a medicine.",
        auth: "Admin",
        body: {
          name: "string (required)",
          dosage: "string (optional)",
          unit: "string (optional)",
          frequency: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
          user: "string user id (optional)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update a medicine.",
        auth: "Admin",
        body: {
          name: "string (optional)",
          dosage: "string (optional)",
          unit: "string (optional)",
          frequency: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
          user: "string user id (optional or empty to clear)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete a medicine.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "FAQs",
    base: "/api/faqs",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List FAQs, optionally filtered by category.",
        auth: "Public",
        query: {
          category: "string (optional, e.g. 'Account')",
        },
      },
      {
        method: "POST",
        path: "/",
        description: "Create an FAQ.",
        auth: "Admin",
        body: {
          question: "string (required)",
          answer: "string (optional)",
          category: "string (optional)",
          order: "number (optional, controls sort order)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update an FAQ.",
        auth: "Admin",
        body: {
          question: "string (optional)",
          answer: "string (optional)",
          category: "string (optional)",
          order: "number (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete an FAQ.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Uploads",
    base: "/api/uploads",
    endpoints: [
      {
        method: "POST",
        path: "/image",
        description: "Upload an image to Cloudinary.",
        auth: "Admin",
        body: "multipart/form-data with field 'file' as the image binary.",
      },
    ],
  },
  {
    group: "Profile (Mobile App)",
    base: "/api/profile",
    note: "All endpoints require Authorization: Bearer <JWT> (user token). These are for the mobile app's user profile features.",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "Get current user's full profile.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/complete",
        description: "Complete profile after registration (initial setup). Required fields: name, age, gender, weight.",
        auth: "User",
        body: {
          name: "string (required)",
          age: "number (required, 1-150)",
          gender: "string (required, 'male' | 'female' | 'other')",
          weight: "number (required, in kg)",
          height: "number (optional, in cm)",
        },
      },
      {
        method: "PUT",
        path: "/",
        description: "Update profile fields (partial update supported).",
        auth: "User",
        body: {
          name: "string (optional)",
          age: "number (optional)",
          gender: "string (optional)",
          weight: "number (optional)",
          height: "number (optional)",
          profileImage: "string URL (optional)",
        },
      },
      {
        method: "PUT",
        path: "/image",
        description: "Update profile image URL only.",
        auth: "User",
        body: {
          profileImage: "string URL (required)",
        },
      },
      {
        method: "GET",
        path: "/status",
        description: "Check if user has completed profile setup (lightweight check).",
        auth: "User",
      },
    ],
  },
  {
    group: "Water Tracking (Mobile App)",
    base: "/api/water",
    note: "All endpoints require Authorization: Bearer <JWT> (user token). Track daily water intake with goal setting and history for calendar/graph views.",
    endpoints: [
      {
        method: "GET",
        path: "/goal",
        description: "Get user's daily water goal (number of glasses).",
        auth: "User",
      },
      {
        method: "PUT",
        path: "/goal",
        description: "Set user's daily water goal. This will also update today's log goal.",
        auth: "User",
        body: {
          goal: "number (required, 1-20 glasses)",
        },
      },
      {
        method: "GET",
        path: "/today",
        description: "Get today's water intake progress. Returns count, goal, percentage, remaining glasses, and completion status.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/drink",
        description: "Add one glass of water (+1). Call this when user taps to drink water.",
        auth: "User",
      },
      {
        method: "DELETE",
        path: "/drink",
        description: "Remove one glass of water (-1). In case user made a mistake.",
        auth: "User",
      },
      {
        method: "PUT",
        path: "/today",
        description: "Set today's water count to a specific value (for manual adjustment).",
        auth: "User",
        body: {
          count: "number (required, 0 or greater)",
        },
      },
      {
        method: "GET",
        path: "/history",
        description: "Get water intake history for calendar/graph view. Returns daily data with summary stats.",
        auth: "User",
        query: {
          days: "number (optional, default 30) - Get last N days",
          startDate: "YYYY-MM-DD (optional) - Custom range start",
          endDate: "YYYY-MM-DD (optional) - Custom range end",
        },
      },
      {
        method: "GET",
        path: "/date/:date",
        description: "Get water intake for a specific date. Date format: YYYY-MM-DD",
        auth: "User",
      },
    ],
  },
  {
    group: "User Medicines (Mobile App)",
    base: "/api/user-medicines",
    note: "Personal medicine management with schedules and alarms. Users can search global catalog and add medicines to their personal list with custom reminders.",
    endpoints: [
      {
        method: "GET",
        path: "/catalog",
        description: "Search global medicine catalog. Use this for autocomplete/suggestions.",
        auth: "User",
        query: {
          q: "string (optional) - Search by name/description",
          page: "number (optional, default 1)",
          limit: "number (optional, default 20)",
        },
      },
      {
        method: "GET",
        path: "/catalog/:id",
        description: "Get single medicine from global catalog.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/catalog/suggest",
        description: "Suggest a new medicine to add to global catalog (if not found).",
        auth: "User",
        body: {
          name: "string (required)",
          dosage: "string (optional)",
          unit: "string (optional)",
          description: "string (optional)",
          image: "string URL (optional)",
        },
      },
      {
        method: "GET",
        path: "/",
        description: "Get all user's personal medicines with schedules.",
        auth: "User",
        query: {
          active: "boolean (optional) - Filter by active status",
          q: "string (optional) - Search by name",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get single medicine from user's list with full details.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/",
        description: "Add medicine to user's list with schedule and reminders.",
        auth: "User",
        body: {
          name: "string (required)",
          dosage: "string (optional, e.g. '500')",
          unit: "string (optional: mg, ml, tablets, capsules, drops, spoons, units)",
          frequency: "string (optional: daily, weekly, monthly, as_needed, custom)",
          weekDays: "string[] (for weekly: ['monday', 'wednesday', 'friday'])",
          reminderTimes: "[{ time: 'HH:MM', label: 'Morning', enabled: true }]",
          startDate: "ISO date string (required)",
          endDate: "ISO date string (optional - ongoing if not set)",
          instructions: "string (optional)",
          alarmEnabled: "boolean (default true)",
          notes: "string (optional)",
          catalogMedicineId: "string (optional - link to catalog)",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update medicine details or schedule.",
        auth: "User",
        body: {
          name: "string (optional)",
          dosage: "string (optional)",
          frequency: "string (optional)",
          reminderTimes: "array (optional - replaces all times)",
          startDate: "ISO date (optional)",
          endDate: "ISO date or null (optional)",
          isActive: "boolean (optional)",
          alarmEnabled: "boolean (optional)",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Remove medicine from user's list.",
        auth: "User",
      },
      {
        method: "PATCH",
        path: "/:id/toggle",
        description: "Toggle medicine active/inactive status.",
        auth: "User",
      },
      {
        method: "PATCH",
        path: "/:id/alarm",
        description: "Toggle or set alarm enabled status.",
        auth: "User",
        body: {
          enabled: "boolean (optional - if not provided, toggles)",
        },
      },
      {
        method: "GET",
        path: "/today/reminders",
        description: "Get today's medicine reminders for notification scheduling. Returns all active medicines with their times.",
        auth: "User",
      },
    ],
  },
  {
    group: "Exercise Bundles/Programs",
    base: "/api/exercise-bundles",
    note: "Multi-day exercise programs with daily schedules. Admin can create, mobile app can view published programs.",
    endpoints: [
      {
        method: "GET",
        path: "/",
        description: "List all exercise bundles/programs. Filter by difficulty, category, published status.",
        auth: "Public/Admin",
        query: {
          page: "number (optional, default 1)",
          limit: "number (optional, default 10)",
          q: "string (optional) - Search by name/description",
          difficulty: "string (optional) - beginner, intermediate, advanced",
          category: "string (optional) - category ID",
          published: "boolean (optional) - filter by published status",
        },
      },
      {
        method: "GET",
        path: "/:id",
        description: "Get single exercise bundle with full schedule and populated exercises.",
        auth: "Public",
      },
      {
        method: "POST",
        path: "/",
        description: "Create new exercise bundle/program.",
        auth: "Admin",
        body: {
          name: "string (required)",
          description: "string (optional)",
          thumbnail: "string URL (optional)",
          difficulty: "beginner | intermediate | advanced",
          totalDays: "number (required, 1-90)",
          category: "string category ID (optional)",
          tags: "string[] (optional)",
          isPublished: "boolean (default false)",
          schedule: "[{ day: 1, isRestDay: false, title: 'Leg Day', exercises: [{ exercise: 'exerciseId', reps: 10, sets: 3 }] }]",
        },
      },
      {
        method: "PUT",
        path: "/:id",
        description: "Update exercise bundle.",
        auth: "Admin",
        body: "Same as POST, all fields optional",
      },
      {
        method: "PUT",
        path: "/:id/day/:dayNum",
        description: "Update single day in schedule (for grid editing). Convenient for individual day updates.",
        auth: "Admin",
        body: {
          isRestDay: "boolean (optional)",
          title: "string (optional)",
          exercises: "[{ exercise: 'id', reps: 10, sets: 3, duration: 0, notes: '' }]",
        },
      },
      {
        method: "DELETE",
        path: "/:id",
        description: "Delete exercise bundle.",
        auth: "Admin",
      },
      {
        method: "PATCH",
        path: "/:id/publish",
        description: "Toggle publish/unpublish status.",
        auth: "Admin",
      },
      {
        method: "POST",
        path: "/:id/duplicate",
        description: "Create a copy of an existing bundle.",
        auth: "Admin",
      },
    ],
  },
  {
    group: "Workout Progress (Mobile App)",
    base: "/api/workout-progress",
    note: "Track user's workout sessions during exercise. Stores time taken, completed exercises, and history for calendar view.",
    endpoints: [
      {
        method: "POST",
        path: "/start",
        description: "Start a new workout session from a program day.",
        auth: "User",
        body: {
          programId: "string (required) - Exercise bundle ID",
          day: "number (required) - Day number in program",
        },
      },
      {
        method: "GET",
        path: "/current",
        description: "Get user's active/ongoing workout session, if any.",
        auth: "User",
      },
      {
        method: "GET",
        path: "/session/:id",
        description: "Get specific workout session details.",
        auth: "User",
      },
      {
        method: "GET",
        path: "/session/:id/current-exercise",
        description: "Get current exercise with details (for workout screen). Includes next/prev exercise info.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/session/:id/complete-exercise",
        description: "Mark current exercise as complete, move to next. Send time tracking data.",
        auth: "User",
        body: {
          completedReps: "number (optional, defaults to target)",
          completedSets: "number (optional)",
          duration: "number (seconds spent on exercise)",
          restTime: "number (rest time after this exercise)",
        },
      },
      {
        method: "POST",
        path: "/session/:id/skip-exercise",
        description: "Skip current exercise, move to next.",
        auth: "User",
      },
      {
        method: "PUT",
        path: "/session/:id/exercise/:exerciseIndex",
        description: "Update exercise progress during workout.",
        auth: "User",
        body: {
          completedReps: "number (optional)",
          completedSets: "number (optional)",
          duration: "number (optional)",
        },
      },
      {
        method: "POST",
        path: "/session/:id/pause",
        description: "Pause the workout session.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/session/:id/resume",
        description: "Resume a paused workout session.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/session/:id/abandon",
        description: "Cancel/abandon the workout session.",
        auth: "User",
      },
      {
        method: "POST",
        path: "/session/:id/finish",
        description: "Complete workout with optional notes and rating.",
        auth: "User",
        body: {
          notes: "string (optional)",
          rating: "number 1-5 (optional)",
        },
      },
      {
        method: "GET",
        path: "/history",
        description: "Get workout history for calendar view. Returns sessions grouped by date with summary.",
        auth: "User",
        query: {
          days: "number (optional, default 30)",
          startDate: "YYYY-MM-DD (optional)",
          endDate: "YYYY-MM-DD (optional)",
          status: "string (optional) - completed, abandoned, etc.",
        },
      },
      {
        method: "GET",
        path: "/today",
        description: "Get today's workout summary with active session check.",
        auth: "User",
      },
      {
        method: "GET",
        path: "/program/:programId",
        description: "Get user's progress in a specific program (which days completed).",
        auth: "User",
      },
    ],
  },
  {
    group: "Health Check",
    base: "",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Simple health check for the backend.",
        auth: "Public",
      },
    ],
  },
];

function JsonLike(props: { value: any }) {
  const { value } = props;
  if (!value) return null;
  if (typeof value === "string") return <span className="font-mono text-xs text-slate-800 dark:text-slate-100">{value}</span>;
  return (
    <pre className="mt-1 rounded bg-slate-950/5 p-2 text-[11px] leading-relaxed text-slate-900 dark:bg-slate-900 dark:text-slate-100 overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">API Documentation</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          This page documents the current HTTP APIs exposed by the Healthify backend. Share this URL with the
          mobile app developer. All URLs are relative to the backend base URL (e.g. <code>https://your-backend.example.com</code>).
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
          Authentication
        </h2>
        <p>
          Use <span className="font-mono">Authorization: Bearer &lt;JWT&gt;</span> for all endpoints marked as
          <span className="font-semibold"> Admin</span>. Public endpoints do not require a token.
        </p>
      </section>

      <div className="flex flex-col gap-4">
        {API_DOCS.map((group) => (
          <section
            key={group.group}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {group.group} <span className="font-mono text-xs text-slate-500">{group.base}</span>
                </h2>
                {group.note ? (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{group.note}</p>
                ) : null}
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-3">
              {group.endpoints.map((ep) => (
                <article
                  key={ep.method + ep.path}
                  className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      >
                        {ep.method}
                      </span>
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-100">
                        {group.base}
                        {ep.path}
                      </span>
                    </div>
                    {ep.auth ? (
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {ep.auth}
                      </span>
                    ) : null}
                  </div>

                  {ep.description ? (
                    <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-300">{ep.description}</p>
                  ) : null}

                  {"query" in ep && ep.query ? (
                    <div className="mt-2">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Query params
                      </h3>
                      <JsonLike value={ep.query} />
                    </div>
                  ) : null}

                  {"body" in ep && ep.body ? (
                    <div className="mt-2">
                      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Request body
                      </h3>
                      <JsonLike value={ep.body} />
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
