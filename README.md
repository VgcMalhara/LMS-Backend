# LMS Backend

An Express and MongoDB backend for a learning management system. The API supports user registration and authentication, instructor-managed courses, student enrollments, role-based access control, and AI-powered course recommendations backed by OpenAI.

This repository currently contains the backend service only. No React application or other frontend components are included in the current project tree.

## Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Current Scope and Notes](#current-scope-and-notes)

## Overview

The service exposes a JSON REST API under three route groups:

- `/api/auth` for account registration and login
- `/api/courses` for course management and enrollment workflows
- `/api/ai` for student-only course recommendations and usage statistics

MongoDB stores users, courses, enrollments, and the global OpenAI request counter. JWTs are issued at registration and login and are used to protect authenticated endpoints.

## Tech Stack

### Runtime and framework

- Node.js
- Express 5
- CommonJS modules
- Nodemon for development reloads

### Data and authentication

- MongoDB with Mongoose 9
- JSON Web Tokens with `jsonwebtoken`
- Password hashing with `bcryptjs`

### Middleware and integrations

- `dotenv` for environment configuration
- `cors` for cross-origin requests
- `helmet` for security headers
- `morgan` for development request logging
- OpenAI API through the `openai` package

## Features

- Register users as students or instructors
- Log in with email and password
- Issue 30-day JWT access tokens
- Hash passwords before persistence
- Enforce student and instructor role permissions
- Create, read, update, and delete courses
- List courses owned by the authenticated instructor
- Enroll students in courses while preventing duplicate enrollments
- List a student's enrolled courses with course and instructor details
- Allow instructors to view enrolled students for their own courses
- Generate AI course recommendations from the current course catalog
- Track a global AI request limit of 250 requests
- Return JSON responses for unknown routes and application errors
- Apply Helmet, CORS, JSON parsing, and development-only HTTP logging

## Project Structure

```text
.
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── aiController.js        # OpenAI recommendations and usage
│   ├── authController.js      # Registration and login
│   └── courseController.js    # Course and enrollment operations
├── middleware/
│   ├── authMiddleware.js      # JWT protection and role authorization
│   └── errorMiddleware.js     # 404 and JSON error handling
├── models/
│   ├── ApiUsage.js            # Global AI request counter
│   ├── Course.js
│   ├── Enrollment.js
│   └── User.js
├── routes/
│   ├── aiRoutes.js
│   ├── authRoutes.js
│   └── courseRoutes.js
├── server.js                  # Application bootstrap and route registration
├── .env.example               # Environment variable template
├── package.json
└── package-lock.json
```

## Prerequisites

- Node.js and npm
- A running MongoDB instance, either local or MongoDB Atlas
- An OpenAI API key for the AI recommendation endpoints

The repository does not declare a Node.js engine version. Use a current Node.js LTS release compatible with the installed dependencies.

## Local Setup

1. Clone the repository and enter the project directory.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Update `.env` with a valid MongoDB connection string, JWT secret, and OpenAI API key.

5. Start the development server:

   ```bash
   npm run dev
   ```

   Or start it without Nodemon:

   ```bash
   npm start
   ```

The API listens on `http://localhost:5000` by default. A successful request to `/` returns `LMS API is running...`.

## Environment Variables

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `PORT` | No | HTTP port. Defaults to `5000` when omitted. | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string used by Mongoose. | `mongodb://127.0.0.1:27017/lms` |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs. Use a long, private value. | `replace-with-a-secure-secret` |
| `OPENAI_API_KEY` | Yes for AI features | OpenAI credential used by the recommendation controller. | `sk-...` |
| `NODE_ENV` | No | Controls the startup message and enables Morgan logging when set to `development`. | `development` |

Do not commit `.env` or expose `JWT_SECRET` and `OPENAI_API_KEY` to client-side code.

## Running the Server

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Start with Nodemon |
| `npm start` | Start with Node.js |
| `npm test` | Placeholder script; no automated tests are configured currently |

The server connects to MongoDB during startup. If the connection fails, the process logs the error and exits. Development request logging is enabled only when `NODE_ENV=development`.

## Authentication

Successful registration and login responses include a JWT in the `token` field. Send that token on protected requests using the `Authorization` header:

```http
Authorization: Bearer <token>
```

The `protect` middleware verifies the token with `JWT_SECRET`, loads the user without the password, and attaches the user to `req.user`. The `authorize` middleware then restricts routes to the permitted roles:

- `student`
- `instructor`

## API Reference

The examples below assume the server is running at `http://localhost:5000`.

### Health check

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | None | Returns the service status text. |

### Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | None | Creates a user and returns user details plus a JWT. |
| `POST` | `/api/auth/login` | None | Verifies credentials and returns user details plus a JWT. |

#### Register request body

```json
{
  "username": "alex",
  "email": "alex@example.com",
  "password": "strong-password",
  "role": "student"
}
```

`role` may be `student` or `instructor`; when omitted, the model defaults it to `student`.

#### Login request body

```json
{
  "email": "alex@example.com",
  "password": "strong-password"
}
```

### Courses and enrollment

All course routes use the `/api/courses` prefix. Although the controller description calls the course list public, the current route registration applies `protect`, so a valid JWT is required.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | Authenticated | Lists all courses and populates instructor username and email. |
| `POST` | `/api/courses` | Instructor | Creates a course owned by the authenticated instructor. |
| `GET` | `/api/courses/my-courses` | Instructor | Lists courses created by the authenticated instructor. |
| `GET` | `/api/courses/my-enrollments` | Student | Lists the student's enrollments with course and instructor details. |
| `GET` | `/api/courses/:id` | Authenticated | Returns one course and its instructor details. |
| `PUT` | `/api/courses/:id` | Instructor owner | Updates a course when the authenticated instructor owns it. |
| `DELETE` | `/api/courses/:id` | Instructor owner | Deletes a course when the authenticated instructor owns it. |
| `POST` | `/api/courses/:id/enroll` | Student | Enrolls the student if the course exists and they are not already enrolled. |
| `GET` | `/api/courses/:id/students` | Instructor owner | Lists enrollments for a course with student username and email. |

#### Course creation body

```json
{
  "title": "Introduction to JavaScript",
  "description": "Core JavaScript concepts for beginners.",
  "content": "Course content goes here",
  "category": "Programming"
}
```

The four fields above are required when creating a course. Course updates pass the request body directly to Mongoose with validation enabled.

### AI recommendations and usage

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/ai/recommendations` | Student | Sends a prompt to OpenAI using the current course catalog as context. |
| `GET` | `/api/ai/usage` | Student | Returns global AI request usage and remaining quota. |

#### Recommendation request body

```json
{
  "prompt": "Which programming course should I take first?"
}
```

The recommendation controller uses the `gpt-4o-mini` model and instructs the model to include the exact course title and course ID in `(ID: <course_id>)` format. A global `ApiUsage` document tracks requests against a default maximum of 250. Once the limit is reached, the endpoint returns HTTP `429`.

#### Recommendation response shape

```json
{
  "recommendation": "...",
  "requestsRemaining": 249,
  "totalUsed": 1
}
```

## Data Models

### User

- `username`: required and unique
- `email`: required and unique
- `password`: required; registration stores a bcrypt hash
- `role`: `student` or `instructor`, defaulting to `student`
- `createdAt` and `updatedAt`: managed by Mongoose timestamps

### Course

- `title`, `description`, `content`, and `category`: required strings
- `instructor`: required reference to `User`
- `createdAt` and `updatedAt`: managed by Mongoose timestamps

### Enrollment

- `student`: required reference to `User`
- `course`: required reference to `Course`
- `status`: `active`, `completed`, or `dropped`; defaults to `active`
- `createdAt` and `updatedAt`: managed by Mongoose timestamps

### ApiUsage

- `totalRequests`: global request counter, defaulting to `0`
- `maxLimit`: global request limit, defaulting to `250`

## Error Handling

Unknown routes are converted into a JSON 404 response. The global error handler returns JSON containing a `message`. The error stack is included outside production and hidden when `NODE_ENV=production`.

Common status codes include:

- `201`: user, course, or enrollment created
- `400`: invalid input, duplicate account, or duplicate enrollment
- `401`: missing or invalid JWT, or invalid login credentials
- `403`: authenticated user lacks the required role or resource ownership
- `404`: resource or route not found
- `429`: global AI request limit reached
- `500`: server, database, or integration error

## Current Scope and Notes

- The current checkout contains the backend API only; a frontend must be provided separately and configured to call this service.
- No automated test suite is configured yet; `npm test` is currently a placeholder command.
- Course listing requires authentication because `protect` is applied to `GET /api/courses`.
- The AI request counter is global to the database rather than per user, and its default limit is 250.
- The server configures public DNS resolvers (`8.8.8.8` and `8.8.4.4`) before connecting to MongoDB to work around MongoDB Atlas DNS resolution issues.
- CORS is enabled for all origins by the current server configuration. Restrict allowed origins before deploying to production.
- The server registers `/api/auth` twice; Express reaches the same authentication router through both registrations, but the duplicate registration is unnecessary.

## License

The package metadata currently declares the `ISC` license. Review and update the package metadata if the project will be distributed under different terms.