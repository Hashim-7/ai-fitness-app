# AI-Powered Fitness Platform

A full-stack fitness platform combining workout tracking, nutrition logging, and AI-powered health insights.

The platform uses AI for calorie and nutrition estimation from meal images and exercise form analysis from workout videos.

## Tech Stack

- Next.js
- Express.js
- FastAPI
- TypeScript
- PostgreSQL
- Prisma ORM
- AWS S3
- Google Gemini API

## Features

- JWT-based user authentication
- Nutrition and macro tracking
- Food database and custom foods
- Weight tracking and fitness goals
- Workout and exercise logging
- Workout history and progress tracking
- AI-powered meal analysis
- AI-powered exercise form analysis from videos
- Secure S3 image and video uploads using presigned URLs

## Development

### Frontend

Install frontend dependencies:

```bash
cd frontend
npm install
```

Configure the frontend environment variables as required by the application, then run the development server:

```bash
npm run dev
```

### Backend

Install backend dependencies:

```bash
cd backend
npm install
```

Configure the backend environment variables:

```env
DATABASE_URL="your_postgresql_connection_string"

JWT_SECRET="your_jwt_secret"

AWS_REGION="eu-west-1"

AWS_ACCESS_KEY_ID="your_aws_access_key"

AWS_SECRET_ACCESS_KEY="your_aws_secret_key"

AWS_BUCKET_NAME="your_s3_bucket_name"
```

Generate the Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate dev
```

Seed development data:

```bash
npx prisma db seed
```

Run the development server:

```bash
npm run dev
```

### AI Service

Install AI service dependencies:

```bash
cd ai-service
pip install -r requirements.txt
```

Configure the environment:

```env
GEMINI_API_KEY="your_gemini_api_key"

AWS_REGION="eu-west-1"

AWS_ACCESS_KEY_ID="your_aws_access_key"

AWS_SECRET_ACCESS_KEY="your_aws_secret_key"

AWS_BUCKET_NAME="your_s3_bucket_name"
```

Run the AI service:

```bash
uvicorn main:app --reload --port 8001
```

The AI service currently supports:

- Meal image analysis
- Calorie and nutrition estimation
- Exercise video analysis
- Exercise form analysis
- AI-generated form feedback and insights

## Testing

The project uses GitHub Actions for automated backend testing.

Regular pushes and pull requests run the backend test suite without calling the Gemini API.

The real AI integration test can be triggered manually through GitHub Actions and validates the integration between the backend, AI service, AWS S3, and Google Gemini.

### Meal Analysis Flow

```text
Backend
   ↓
AI Service
   ↓
AWS S3
   ↓
Google Gemini
   ↓
AI Meal Analysis Result
```

### Exercise Form Analysis Flow

```text
Frontend
   ↓
S3 Presigned Upload
   ↓
Backend
   ↓
AI Service
   ↓
AWS S3
   ↓
Google Gemini
   ↓
AI Exercise Form Analysis
   ↓
Frontend
```

The AI integration tests require the appropriate GitHub Actions secrets for Gemini and AWS.

## Status

🚧 Active development

**Current milestone — v0.4.0-ai-fitness-analysis**

### Completed

- ✅ Backend authentication and core functionality
- ✅ Nutrition and macro tracking
- ✅ Food database and custom foods
- ✅ Weight tracking and fitness goals
- ✅ Workout logging
- ✅ Exercise/workout tracking in the frontend
- ✅ AWS S3 integration
- ✅ Presigned S3 uploads
- ✅ FastAPI AI service
- ✅ Google Gemini integration
- ✅ Backend ↔ AI service integration
- ✅ Real S3 → Gemini meal analysis integration
- ✅ AI-powered exercise video form analysis
- ✅ Frontend implementation
- ✅ Frontend workout logging
- ✅ Automated backend CI tests
- ✅ Manual AI integration testing in GitHub Actions

### In Progress

- ⏳ Testing and bug fixing

## Architecture

The platform is split into three main application layers:

```text
┌─────────────────────┐
│      Next.js        │
│      Frontend       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     Express.js      │
│       Backend       │
└──────┬────────┬─────┘
       │        │
       │        ▼
       │  ┌─────────────────┐
       │  │    FastAPI      │
       │  │    AI Service   │
       │  └────────┬────────┘
       │           │
       │           ▼
       │  ┌─────────────────┐
       │  │ Google Gemini   │
       │  └─────────────────┘
       │
       ▼
┌─────────────────────┐
│    PostgreSQL       │
│    + Prisma ORM     │
└─────────────────────┘

           │
           ▼
┌─────────────────────┐
│       AWS S3        │
│ Images & Videos     │
└─────────────────────┘
```

The frontend now provides the main user-facing experience for nutrition, goals, and workout tracking, while the AI service has expanded from meal analysis into exercise video and form analysis.
