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

## Features

- JWT-based user authentication
- Nutrition and macro tracking
- Food database and custom foods
- Weight tracking and fitness goals
- AI-powered fitness analysis

## Development

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
DATABASE_URL="your_postgresql_connection_string"
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
cd backend
npm run dev
```

## Status

🚧 Currently in active development.
