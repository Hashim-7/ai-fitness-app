# AI-Powered Fitness Platform

A full-stack fitness platform combining workout tracking, nutrition logging, and AI-powered health insights.

The platform uses AI for calorie estimation from meal images and exercise form analysis from videos.

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
- AI-powered meal analysis
- AI-powered fitness analysis
- Secure S3 image uploads using presigned URLs

## Development

### Backend

Install backend dependencies:

```bash
cd backend
npm install
```

Configure the backend environment variables:

```bash
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

Configure env:

```bash
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

## Testing

The project uses GitHub Actions for automated backend testing.

Regular pushes and pull requests run the backend test suite without calling the Gemini API.

The real AI integration test is triggered manually through GitHub Actions and validates the integration between:

Backend
↓
AI Service
↓
AWS S3
↓
Google Gemini
↓
AI Analysis Result

The AI integration test requires the appropriate GitHub Actions secrets for Gemini and AWS.

## Status

🚧 Active development

Current milestone — v0.3.0-ai-integration
✅ Backend authentication and core functionality
✅ Nutrition and macro tracking
✅ Food database and custom foods
✅ Weight tracking and fitness goals
✅ AWS S3 integration
✅ Presigned S3 uploads
✅ FastAPI AI service
✅ Google Gemini integration
✅ Backend ↔ AI service integration
✅ Real S3 → Gemini meal analysis integration
✅ Automated backend CI tests
✅ Manual AI integration testing in GitHub Actions
⏳ Frontend implementation
⏳ Frontend → S3 → Backend → AI end-to-end flow
⏳ Production deployment
