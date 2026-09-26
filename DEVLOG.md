# StockSense Development Log

## Project Setup
- Initialized monorepo with frontend/ and backend/ directories
- Configured TypeScript strict mode for backend
- Added ESLint with recommended rules
- Scaffolded frontend with Vite + React + TypeScript
- Integrated TailwindCSS with custom config

## Backend Development
- Created Express server with CORS, helmet, and body-parser middleware
- Added health check endpoint
- Designed Mongoose schemas for Product, Warehouse, and Category
- Added indexing for frequently queried fields
- Implemented JWT-based auth with access and refresh tokens
- Added password hashing with bcrypt
- Created /api/auth/register and /api/auth/login routes
- Added input validation with Zod

