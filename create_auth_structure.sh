#!/bin/bash

# Create root directory
mkdir -p auth-starter-kit

# Create backend structure (FastAPI)
mkdir -p auth-starter-kit/backend
touch auth-starter-kit/backend/main.py
touch auth-starter-kit/backend/auth.py
touch auth-starter-kit/backend/users.py
touch auth-starter-kit/backend/database.py
touch auth-starter-kit/backend/models.py

# Create frontend structure (Next.js)
mkdir -p auth-starter-kit/frontend/pages/auth
mkdir -p auth-starter-kit/frontend/components
mkdir -p auth-starter-kit/frontend/lib

# Create frontend files
touch auth-starter-kit/frontend/pages/index.tsx
touch auth-starter-kit/frontend/pages/dashboard.tsx
touch auth-starter-kit/frontend/pages/auth/callback.tsx
touch auth-starter-kit/frontend/components/Login.tsx
touch auth-starter-kit/frontend/lib/auth.ts

# Output success message
echo "Auth Starter Kit file structure created successfully!"