# 📱 Workout Progress API Documentation

**Last Updated:** December 14, 2024  
**For:** Mobile App Developer  
**Base URL:** `http://localhost:4000` (dev) or production URL

---

## 📋 Overview

The Workout Progress API allows users to:
1. **Start a workout session** from a program day
2. **Track each exercise** (time, reps completed, rest time)
3. **Navigate exercises** (next, skip, pause)
4. **Complete workouts** and rate them
5. **View history** for calendar and daily summary

---

## 🔐 Authentication

All endpoints require user authentication:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📱 Workout Flow (App Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                         WORKOUT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User selects Program Day                                     │
│           ↓                                                      │
│  2. POST /start → Creates session, returns first exercise       │
│           ↓                                                      │
│  3. Show exercise (video, instructions, timer)                   │
│           ↓                                                      │
│  4. User does exercise, timer tracks duration                    │
│           ↓                                                      │
│  5. User clicks "Done" or "Skip"                                 │
│           ↓                                                      │
│  6. POST /complete-exercise or /skip-exercise                    │
│     → Returns next exercise (or workout complete)                │
│           ↓                                                      │
│  7. Optional: Show rest timer between exercises                  │
│           ↓                                                      │
│  8. Repeat until all exercises done                              │
│           ↓                                                      │
│  9. Show summary, ask for rating                                 │
│           ↓                                                      │
│  10. POST /finish with notes & rating                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

### 1. Start Workout Session

Start a new workout from a program day.

```http
POST /api/workout-progress/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "programId": "675dc1234567890abcdef12",
  "day": 1
}
```

#### Response

```json
{
  "success": true,
  "message": "Workout session started",
  "data": {
    "_id": "session123",
    "user": "user123",
    "program": "675dc1234567890abcdef12",
    "programDay": 1,
    "programDayTitle": "Leg Day",
    "title": "7-Day Beginner Program - Leg Day",
    "date": "2024-12-14",
    "status": "in_progress",
    "startedAt": "2024-12-14T08:00:00.000Z",
    "currentExerciseIndex": 0,
    "totalExercises": 5,
    "completedExercises": 0,
    "exercises": [
      {
        "exercise": {
          "_id": "ex123",
          "title": "Squats",
          "slug": "squats",
          "image": "https://example.com/squats.jpg",
          "difficulty": "beginner",
          "duration": 30,
          "description": "Stand with feet shoulder-width apart...",
          "equipment": ["none"]
        },
        "targetReps": 10,
        "targetSets": 3,
        "completedReps": 0,
        "completedSets": 0,
        "duration": 0,
        "restTime": 0,
        "status": "in_progress",
        "startedAt": "2024-12-14T08:00:00.000Z",
        "order": 0
      },
      {
        "exercise": {
          "_id": "ex124",
          "title": "Lunges",
          ...
        },
        "targetReps": 15,
        "targetSets": 2,
        "status": "pending",
        "order": 1
      }
    ]
  }
}
```

---

### 2. Get Current Exercise

Get the current exercise to display with all details.

```http
GET /api/workout-progress/session/:sessionId/current-exercise
```

#### Response

```json
{
  "success": true,
  "data": {
    "isComplete": false,
    "currentIndex": 0,
    "totalExercises": 5,
    "progress": "1/5",
    "currentExercise": {
      "exercise": {
        "_id": "ex123",
        "title": "Squats",
        "image": "https://example.com/squats.jpg",
        "description": "Stand with feet shoulder-width apart...",
        "equipment": ["none"]
      },
      "targetReps": 10,
      "targetSets": 3,
      "status": "in_progress",
      "startedAt": "2024-12-14T08:00:00.000Z"
    },
    "nextExercise": {
      "exercise": {
        "_id": "ex124",
        "title": "Lunges"
      },
      "targetReps": 15,
      "targetSets": 2
    },
    "prevExercise": null
  }
}
```

---

### 3. Complete Current Exercise (Move to Next)

Mark the current exercise as complete with time tracking.

```http
POST /api/workout-progress/session/:sessionId/complete-exercise
Content-Type: application/json

{
  "completedReps": 10,
  "completedSets": 3,
  "duration": 120,
  "restTime": 30
}
```

**Notes:**
- `duration` - Time taken for this exercise in seconds (from your timer)
- `restTime` - Rest time after this exercise in seconds
- If not provided, `completedReps` defaults to `targetReps`

#### Response

```json
{
  "success": true,
  "message": "Exercise completed, moving to next",
  "data": {
    "isWorkoutComplete": false,
    "completedExercise": {
      "exercise": {...},
      "status": "completed",
      "duration": 120,
      "completedReps": 10
    },
    "nextExercise": {
      "exercise": {...},
      "targetReps": 15,
      "status": "in_progress"
    },
    "progress": "1/5",
    "currentIndex": 1
  }
}
```

**When last exercise is completed:**
```json
{
  "success": true,
  "message": "Workout completed!",
  "data": {
    "isWorkoutComplete": true,
    "completedExercise": {...},
    "nextExercise": null,
    "progress": "5/5"
  }
}
```

---

### 4. Skip Current Exercise

Skip the current exercise and move to next.

```http
POST /api/workout-progress/session/:sessionId/skip-exercise
```

---

### 5. Pause Workout

```http
POST /api/workout-progress/session/:sessionId/pause
```

---

### 6. Resume Workout

```http
POST /api/workout-progress/session/:sessionId/resume
```

---

### 7. Abandon/Cancel Workout

```http
POST /api/workout-progress/session/:sessionId/abandon
```

---

### 8. Finish Workout (with Rating)

After workout is complete, add notes and rating.

```http
POST /api/workout-progress/session/:sessionId/finish
Content-Type: application/json

{
  "notes": "Felt great today!",
  "rating": 5
}
```

---

### 9. Get Active Session

Check if user has an ongoing workout.

```http
GET /api/workout-progress/current
```

---

### 10. Get Workout History (Calendar View)

```http
GET /api/workout-progress/history?days=30
```

Or with date range:
```http
GET /api/workout-progress/history?startDate=2024-12-01&endDate=2024-12-14
```

#### Response

```json
{
  "success": true,
  "data": {
    "startDate": "2024-11-14",
    "endDate": "2024-12-14",
    "sessions": [
      {
        "_id": "session123",
        "date": "2024-12-14",
        "title": "7-Day Beginner - Day 1",
        "status": "completed",
        "totalDuration": 1200,
        "completedExercises": 5,
        "totalExercises": 5,
        "rating": 5
      }
    ],
    "byDate": {
      "2024-12-14": [...sessions for this date...],
      "2024-12-13": [...sessions for this date...]
    },
    "summary": {
      "totalSessions": 10,
      "completedSessions": 8,
      "totalDuration": 9600,
      "totalExercises": 45,
      "averageRating": 4.5
    }
  }
}
```

---

### 11. Get Today's Summary

```http
GET /api/workout-progress/today
```

#### Response

```json
{
  "success": true,
  "data": {
    "date": "2024-12-14",
    "hasActiveSession": true,
    "activeSession": {...},
    "completedToday": 1,
    "totalDurationToday": 1200,
    "totalExercisesToday": 5,
    "sessions": [...]
  }
}
```

---

### 12. Get Program Progress

See which days are completed in a program.

```http
GET /api/workout-progress/program/:programId
```

#### Response

```json
{
  "success": true,
  "data": {
    "program": {
      "_id": "program123",
      "name": "7-Day Beginner Program",
      "totalDays": 7
    },
    "totalDays": 7,
    "completedDays": 3,
    "progressPercentage": 43,
    "dayStatus": {
      "1": { "day": 1, "status": "completed", "completedAt": "...", "rating": 5 },
      "2": { "day": 2, "status": "completed", "completedAt": "..." },
      "3": { "day": 3, "status": "completed", "completedAt": "..." }
    }
  }
}
```

---

## 📱 App Implementation Guide

### Exercise Screen UI

```
┌─────────────────────────────────────────────┐
│  < Back          1/5 Exercises    ⏸ Pause  │
├─────────────────────────────────────────────┤
│                                             │
│            [Exercise Image/Video]           │
│                                             │
│              SQUATS                         │
│          Beginner | No Equipment            │
│                                             │
│         10 reps × 3 sets                    │
│                                             │
│           ⏱️ 02:15                          │
│         (Timer running)                     │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│   Stand with feet shoulder-width apart,     │
│   lower your body as if sitting back        │
│   into a chair...                           │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│      [ Skip ]           [ Done ✓ ]          │
│                                             │
│   Next: Lunges (15 × 2)                     │
└─────────────────────────────────────────────┘
```

### Timer Implementation

```javascript
// Start timer when exercise begins
const [seconds, setSeconds] = useState(0);
const [isRunning, setIsRunning] = useState(true);

useEffect(() => {
  let interval;
  if (isRunning) {
    interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  }
  return () => clearInterval(interval);
}, [isRunning]);

// On "Done" click
const completeExercise = async () => {
  await api.post(`/workout-progress/session/${sessionId}/complete-exercise`, {
    completedReps: targetReps,
    completedSets: targetSets,
    duration: seconds,  // Send timer value
    restTime: 0
  });
  
  setSeconds(0);  // Reset for next exercise
};
```

### Rest Timer (Between Exercises)

```javascript
// After completing an exercise, show rest screen
const showRestTimer = (restSeconds = 30) => {
  setRestTime(restSeconds);
  // Countdown timer...
  // When done, show next exercise
};
```

### Calendar View

```javascript
// Fetch history
const { data } = await api.get('/workout-progress/history?days=30');

// Use byDate for calendar
data.byDate['2024-12-14']  // Sessions on Dec 14

// Show dots on calendar for dates with workouts
Object.keys(data.byDate).forEach(date => {
  const sessions = data.byDate[date];
  const hasCompleted = sessions.some(s => s.status === 'completed');
  // Show green dot if completed, yellow if abandoned/in_progress
});
```

---

## 📊 Data Stored Per Exercise

| Field | Type | Description |
|-------|------|-------------|
| `exercise` | object | Full exercise details |
| `targetReps` | number | How many reps to do (from program) |
| `targetSets` | number | How many sets (from program) |
| `completedReps` | number | Actual reps done by user |
| `completedSets` | number | Actual sets done by user |
| `duration` | number | Time taken in seconds |
| `restTime` | number | Rest after this exercise |
| `status` | string | pending, in_progress, completed, skipped |
| `startedAt` | date | When exercise started |
| `completedAt` | date | When exercise finished |

---

## ❓ FAQ

### Q: What if user closes app during workout?
A: Session is saved with status `in_progress`. Use `GET /current` on app open to resume.

### Q: Can user do same day twice?
A: Yes, each creates a new session. History shows all sessions per date.

### Q: How to show exercise video?
A: Add video URL field to Exercise model, or use image with animation.

### Q: What about timed exercises (like Plank)?
A: Use the `duration` field from exercise. Show countdown instead of count-up timer.

---

## 📞 Support

Contact backend team for any questions.
