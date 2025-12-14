# 📱 Healthify Mobile App - Profile APIs Documentation

**Last Updated:** December 14, 2024  
**Version:** 1.1.0  
**Author:** Backend Team

---

## 🚨 IMPORTANT: Breaking Changes to Auth API

The authentication API responses have been updated. **You need to update your app to handle the new response structure.**

### What Changed in `/api/auth/login` and `/api/auth/register`

The `user` object in the response now includes additional fields:

```diff
{
  "message": "Login successful",
  "token": "...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "user",
+   "name": "",                    // NEW - User's display name
+   "profileCompleted": false      // NEW - Has user completed profile?
  }
}
```

### ⚡ Action Required

After login/register, check `user.profileCompleted`:
- If `false` → Navigate to Profile Completion Screen
- If `true` → Navigate to Home Screen

---

## 📋 New Profile APIs Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/profile` | Get full user profile | ✅ Bearer Token |
| `POST` | `/api/profile/complete` | Complete profile (first time) | ✅ Bearer Token |
| `PUT` | `/api/profile` | Update profile | ✅ Bearer Token |
| `PUT` | `/api/profile/image` | Update profile image only | ✅ Bearer Token |
| `GET` | `/api/profile/status` | Check if profile completed | ✅ Bearer Token |

---

## 🔐 Authentication

All profile endpoints require authentication. Include the JWT token in the header:

```
Authorization: Bearer <your_jwt_token>
```

---

## 📝 API Details

### 1. Complete Profile (Initial Setup)

**Use this after registration when `profileCompleted: false`**

```http
POST /api/profile/complete
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | User's full name |
| `age` | number | ✅ Yes | Age (1-150) |
| `gender` | string | ✅ Yes | `"male"`, `"female"`, or `"other"` |
| `weight` | number | ✅ Yes | Weight in kg |
| `height` | number | ❌ No | Height in cm (optional for future use) |

#### Example Request

```json
{
  "name": "John Doe",
  "age": 25,
  "gender": "male",
  "weight": 70,
  "height": 175
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Profile completed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "age": 25,
    "gender": "male",
    "weight": 70,
    "height": 175,
    "profileImage": "",
    "profileCompleted": true,
    "role": "user"
  }
}
```

#### Error Responses

| Status | Message |
|--------|---------|
| 400 | "Name is required" |
| 400 | "Valid age is required (1-150)" |
| 400 | "Gender is required (male, female, or other)" |
| 400 | "Valid weight is required" |
| 401 | "Not authorized" (missing/invalid token) |
| 404 | "User not found" |

---

### 2. Get Profile

**Use this to display profile page**

```http
GET /api/profile
Authorization: Bearer <token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "age": 25,
    "gender": "male",
    "weight": 70,
    "height": 175,
    "profileImage": "https://res.cloudinary.com/...",
    "profileCompleted": true,
    "role": "user",
    "createdAt": "2024-12-14T06:15:00.000Z",
    "updatedAt": "2024-12-14T06:20:00.000Z"
  }
}
```

---

### 3. Update Profile

**Use this for editing profile from profile page**

```http
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

All fields are optional - only send what you want to update:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | User's full name |
| `age` | number | Age (1-150) |
| `gender` | string | `"male"`, `"female"`, or `"other"` |
| `weight` | number | Weight in kg |
| `height` | number | Height in cm |
| `profileImage` | string | URL of profile image |

#### Example Request (Partial Update)

```json
{
  "name": "John Updated",
  "weight": 72
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Updated",
    "age": 25,
    "gender": "male",
    "weight": 72,
    "height": 175,
    "profileImage": "",
    "profileCompleted": true,
    "role": "user",
    "updatedAt": "2024-12-14T06:25:00.000Z"
  }
}
```

---

### 4. Update Profile Image

**Use this for avatar/profile picture upload**

```http
PUT /api/profile/image
Authorization: Bearer <token>
Content-Type: application/json
```

#### Request Body

```json
{
  "profileImage": "https://res.cloudinary.com/healthify/image/upload/v123/profile.jpg"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "profileImage": "https://res.cloudinary.com/healthify/image/upload/v123/profile.jpg"
  }
}
```

> **Note:** To upload an image, first use `POST /api/uploads/image` (requires admin token) or implement your own image upload to Cloudinary/storage and then update the URL here.

---

### 5. Check Profile Status

**Lightweight endpoint to check if profile is completed**

```http
GET /api/profile/status
Authorization: Bearer <token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "profileCompleted": false
  }
}
```

---

## 📱 Recommended App Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        APP START                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Has saved token? │
                    └─────────────────┘
                     │              │
                    No             Yes
                     │              │
                     ▼              ▼
              ┌───────────┐  ┌──────────────────┐
              │  Login/   │  │ GET /api/profile │
              │ Register  │  │   /status        │
              └───────────┘  └──────────────────┘
                     │              │
                     ▼              ▼
              ┌─────────────────────────────────┐
              │     profileCompleted?           │
              └─────────────────────────────────┘
                     │              │
                  false           true
                     │              │
                     ▼              ▼
        ┌────────────────────┐  ┌──────────────┐
        │ Profile Complete   │  │  Home Screen │
        │ Screen (Form)      │  │              │
        └────────────────────┘  └──────────────┘
                     │
                     ▼
        ┌────────────────────┐
        │ POST /api/profile  │
        │    /complete       │
        └────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Home Screen │
              └──────────────┘
```

---

## 🔄 Updated User Model Schema

The user object now has these fields:

```typescript
interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  
  // Profile fields (NEW)
  name: string;
  age: number | null;
  gender: "male" | "female" | "other" | "";
  weight: number | null;       // in kg
  height: number | null;       // in cm
  profileImage: string;        // URL
  profileCompleted: boolean;
  
  createdAt: string;           // ISO date
  updatedAt: string;           // ISO date
}
```

---

## 🧪 Testing Examples

### Using cURL

#### Complete Profile
```bash
curl -X POST http://localhost:4000/api/profile/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"John","age":25,"gender":"male","weight":70}'
```

#### Get Profile
```bash
curl http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Profile
```bash
curl -X PUT http://localhost:4000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weight":72}'
```

---

## ❓ Common Issues

### 1. "Not authorized" error
- Check if the token is valid and not expired
- Ensure you're sending `Authorization: Bearer <token>` (note the space after Bearer)

### 2. "User not found" error
- The user associated with the token may have been deleted
- Token might be for a different environment

### 3. Validation errors
- `name` cannot be empty
- `age` must be 1-150
- `gender` must be exactly: `male`, `female`, or `other` (lowercase)
- `weight` must be > 0

---

## 📞 Support

If you have questions about these APIs, contact the backend team.

**Base URL (Development):** `http://localhost:4000`  
**Base URL (Production):** Contact admin for production URL
