# Auth Starter Kit

A full-stack authentication starter kit with FastAPI backend and Next.js frontend. Implements secure authentication flows including email/password and Google OAuth.

## Features

- 🔒 **Secure Authentication**

  - Email/password authentication with bcrypt
  - Google OAuth integration
  - JWT with secure HTTP-only cookies
  - Refresh token rotation
  - Role-based access control

- 🚀 **Backend (FastAPI)**

  - RESTful API design
  - PostgreSQL database with SQLAlchemy ORM
  - Dependency injection for maintainability
  - Rate limiting and security measures
  - Comprehensive endpoint documentation

- 💻 **Frontend (Next.js)**
  - Modern React with App Router
  - Beautiful UI with Shadcn UI components
  - Type-safe with TypeScript
  - Form validation with Zod
  - State management with Zustand
  - Data fetching with React Query
  - Smooth animations with Framer Motion

## Tech Stack

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Authlib (OAuth)
- PostgreSQL
- JWT (with jose)
- Docker

### Frontend

- Next.js
- TypeScript
- React Hook Form
- Zod
- Zustand
- React Query
- Axios
- Framer Motion
- Tailwind CSS
- Shadcn UI

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+
- Docker and Docker Compose (optional, for containerized setup)

### Backend Setup

1. Navigate to the backend directory:

   ```
   cd auth-starter-kit/backend
   ```

2. Create a virtual environment:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables by copying `.env.example` to `.env`:

   ```
   cp .env.example .env  # Then edit with your own values
   ```

5. Run the server:

   ```
   uvicorn main:app --reload
   ```

   Or use Docker Compose:

   ```
   docker-compose up -d
   ```

6. The backend will be running at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:

   ```
   cd auth-starter-kit/frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables by copying `.env.example` to `.env.local`:

   ```
   cp .env.example .env.local  # Then edit with your own values
   ```

4. Run the development server:

   ```
   npm run dev
   ```

5. The frontend will be running at http://localhost:3000

## Project Structure

### Backend

```
backend/
├── __pycache__/
├── auth.py          # Authentication logic and routes
├── database.py      # Database connection and session
├── docker-compose.yml # Docker configuration
├── Dockerfile       # Docker build instructions
├── .env             # Environment variables
├── main.py          # FastAPI app and main entry point
├── models.py        # SQLAlchemy models
├── requirements.txt # Python dependencies
├── test.db          # SQLite database for development
└── users.py         # User management routes
```

### Frontend

```
frontend/
├── app/             # Next.js pages and app router
├── components/      # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configuration
├── public/          # Static assets
├── .env.local       # Environment variables
├── package.json     # Node.js dependencies
└── tailwind.config.js # Tailwind CSS configuration
```

## API Documentation

Once the backend is running, you can access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Authentication Flow

1. User registers with email/password or logs in via Google OAuth
2. Server authenticates and issues JWT access token and refresh token
3. Access token is stored in an HttpOnly cookie
4. Protected routes require the access token
5. When the access token expires, the client uses the refresh token to get a new one
6. Tokens can be revoked by the server

## License

MIT

## Acknowledgements

This project uses the following open-source libraries and tools:

- [FastAPI](https://fastapi.tiangolo.com/)
- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query/latest)
- [Framer Motion](https://www.framer.com/motion/)
