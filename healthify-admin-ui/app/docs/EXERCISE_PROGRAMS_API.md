# 📱 Exercise Programs API Documentation

**Last Updated:** December 14, 2024  
**For:** Mobile App Developer  
**Base URL:** `http://localhost:4000` (dev) or production URL

---

## 📋 Overview

Exercise Programs (also called Exercise Bundles) allow admins to create multi-day workout plans. Each program has:
- **Total Days** (e.g., 7-day program, 30-day challenge)
- **Daily Schedule** - which exercises to do on each day with counts
- **Rest Days** - days with no exercises

### Example Program Structure:
```
Day 1: Leg Day
  - Squats: 10 times
  - Lunges: 15 times
  - Calf Raises: 20 times

Day 2: Rest Day

Day 3: Upper Body
  - Push-ups: 15 times
  - Plank: 60 seconds
  - Arm Curls: 12 times
```

---

## 🔐 Authentication

These endpoints are **public** (no auth required for GET requests).
The mobile app can fetch published programs without login.

---

## 📡 API Endpoints

### 1. Get All Published Programs

Fetch the list of published exercise programs for the app.

```http
GET /api/exercise-bundles?published=true
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `published` | boolean | Set to `true` for only published programs |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |
| `difficulty` | string | Filter: `beginner`, `intermediate`, `advanced` |
| `q` | string | Search by name |

#### Response

```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 5,
  "pages": 1,
  "data": [
    {
      "_id": "675dc1234567890abcdef12",
      "name": "7-Day Beginner Program",
      "slug": "7-day-beginner-program",
      "description": "Perfect for beginners starting their fitness journey",
      "thumbnail": "https://example.com/image.jpg",
      "difficulty": "beginner",
      "totalDays": 7,
      "isPublished": true,
      "totalExercises": 15,
      "restDays": 2,
      "createdAt": "2024-12-14T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Program (Full Details)

Fetch a complete program with all days and exercises.

```http
GET /api/exercise-bundles/:id
```

#### Example Request

```http
GET /api/exercise-bundles/675dc1234567890abcdef12
```

#### Response

```json
{
  "success": true,
  "data": {
    "_id": "675dc1234567890abcdef12",
    "name": "7-Day Beginner Program",
    "slug": "7-day-beginner-program",
    "description": "Perfect for beginners starting their fitness journey",
    "thumbnail": "https://example.com/image.jpg",
    "difficulty": "beginner",
    "totalDays": 7,
    "isPublished": true,
    "totalExercises": 15,
    "restDays": 2,
    
    "schedule": [
      {
        "day": 1,
        "isRestDay": false,
        "title": "Leg Day",
        "exercises": [
          {
            "exercise": {
              "_id": "ex123",
              "title": "Squats",
              "slug": "squats",
              "image": "https://example.com/squats.jpg",
              "difficulty": "beginner",
              "duration": 30,
              "description": "Stand with feet shoulder-width apart..."
            },
            "reps": 10,
            "sets": 3,
            "duration": 0,
            "notes": ""
          },
          {
            "exercise": {
              "_id": "ex124",
              "title": "Lunges",
              "slug": "lunges",
              "image": "https://example.com/lunges.jpg",
              "difficulty": "beginner"
            },
            "reps": 15,
            "sets": 2,
            "duration": 0,
            "notes": ""
          }
        ]
      },
      {
        "day": 2,
        "isRestDay": true,
        "title": "Rest & Recovery",
        "exercises": []
      },
      {
        "day": 3,
        "isRestDay": false,
        "title": "Upper Body",
        "exercises": [
          {
            "exercise": {
              "_id": "ex125",
              "title": "Push-ups",
              "slug": "push-ups",
              "image": "https://example.com/pushups.jpg",
              "difficulty": "intermediate"
            },
            "reps": 20,
            "sets": 3,
            "duration": 0,
            "notes": "Keep your back straight"
          }
        ]
      }
    ],
    
    "createdAt": "2024-12-14T10:00:00.000Z",
    "updatedAt": "2024-12-14T10:00:00.000Z"
  }
}
```

---

## 📊 Data Structure Explained

### Program Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique program ID |
| `name` | string | Program name (e.g., "7-Day Beginner Program") |
| `slug` | string | URL-friendly name |
| `description` | string | Program description |
| `thumbnail` | string | Image URL for the program |
| `difficulty` | string | `beginner`, `intermediate`, or `advanced` |
| `totalDays` | number | Total number of days in program |
| `isPublished` | boolean | Whether program is visible to users |
| `totalExercises` | number | Total exercise count across all days |
| `restDays` | number | Number of rest days |
| `schedule` | array | Array of day objects (see below) |

### Day Object (in schedule array)

| Field | Type | Description |
|-------|------|-------------|
| `day` | number | Day number (1, 2, 3, ...) |
| `isRestDay` | boolean | `true` if this is a rest day |
| `title` | string | Day title (e.g., "Leg Day", "Rest & Recovery") |
| `exercises` | array | Array of exercises for this day (empty if rest day) |

### Exercise Entry (in exercises array)

| Field | Type | Description |
|-------|------|-------------|
| `exercise` | object | Full exercise details (see below) |
| `reps` | number | **Repetitions** - How many times to do this exercise |
| `sets` | number | **Sets** - How many rounds (default: 1) |
| `duration` | number | Duration in seconds (for timed exercises like plank) |
| `notes` | string | Additional instructions |

#### Understanding Reps and Sets:
- **reps = 10, sets = 3** means: Do 10 squats, rest, do 10 more, rest, do 10 more (total 30)
- **reps = 15, sets = 1** means: Do 15 lunges (just once)
- **duration = 60, sets = 2** means: Hold plank for 60 seconds, rest, hold for 60 more seconds

### Exercise Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Exercise ID |
| `title` | string | Exercise name |
| `slug` | string | URL-friendly name |
| `image` | string | Exercise image URL |
| `difficulty` | string | Exercise difficulty |
| `duration` | number | Estimated duration in seconds |
| `description` | string | How to do the exercise |
| `equipment` | array | Required equipment list |

---

## 📱 Mobile App Implementation Guide

### 1. Program List Screen

Show all available programs:

```javascript
// Fetch published programs
const response = await fetch('API_URL/api/exercise-bundles?published=true');
const { data: programs } = await response.json();

// Display as cards with:
// - thumbnail
// - name
// - difficulty badge
// - totalDays + restDays info
// - totalExercises count
```

### 2. Program Detail Screen

Show program overview:

```javascript
const response = await fetch(`API_URL/api/exercise-bundles/${programId}`);
const { data: program } = await response.json();

// Display:
// - Program header (name, thumbnail, description)
// - Day-by-day list/timeline
// - Each day shows title and exercise count
// - Rest days shown differently (grayed out or with rest icon)
```

### 3. Day Detail Screen

When user taps on a day:

```javascript
const day = program.schedule.find(d => d.day === selectedDay);

if (day.isRestDay) {
  // Show rest day message
  return <RestDayScreen title={day.title} />;
}

// Show exercise list for that day
day.exercises.map(ex => (
  <ExerciseCard
    image={ex.exercise.image}
    title={ex.exercise.title}
    reps={ex.reps}
    sets={ex.sets}
    duration={ex.duration}
    notes={ex.notes}
  />
));
```

### 4. Display Logic for Reps/Duration

```javascript
function getExerciseInfo(exercise) {
  if (exercise.duration > 0) {
    // Timed exercise (like Plank)
    return `${exercise.duration} seconds × ${exercise.sets} sets`;
  } else {
    // Rep-based exercise
    if (exercise.sets > 1) {
      return `${exercise.reps} reps × ${exercise.sets} sets`;
    } else {
      return `${exercise.reps} times`;
    }
  }
}

// Examples:
// { reps: 10, sets: 3, duration: 0 } → "10 reps × 3 sets"
// { reps: 15, sets: 1, duration: 0 } → "15 times"
// { reps: 0, sets: 2, duration: 60 } → "60 seconds × 2 sets"
```

---

## 🗓️ User Progress Tracking (Future Feature)

Currently, the API provides program data. User progress tracking (which day they're on, completed exercises) would need to be stored locally in the app or in a future user progress API.

**Suggested local storage structure:**
```javascript
{
  "programId": "675dc1234567890abcdef12",
  "startedAt": "2024-12-14",
  "currentDay": 3,
  "completedDays": [1, 2],
  "completedExercises": {
    "1": ["ex123", "ex124"],  // Day 1 completed exercises
    "3": ["ex125"]            // Day 3 partial
  }
}
```

---

## 🧪 Testing

### Sample cURL Commands

#### List Programs
```bash
curl "http://localhost:4000/api/exercise-bundles?published=true&limit=5"
```

#### Get Single Program
```bash
curl "http://localhost:4000/api/exercise-bundles/PROGRAM_ID"
```

---

## ❓ FAQ

### Q: What if reps is 0 and duration is also 0?
A: This shouldn't happen. The admin UI validates input. If it does occur, treat it as "1 rep".

### Q: How do I know if an exercise is a timed one (like Plank)?
A: Check if `duration > 0`. If yes, it's timed. If `reps > 0`, it's rep-based.

### Q: Can a program have 0 total days?
A: No, minimum is 1 day.

### Q: What's the maximum program length?
A: 90 days.

---

## 📞 Support

Contact backend team for any questions about this API.
