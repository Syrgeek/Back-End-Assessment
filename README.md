# Notes API

## Overview
This is a secure and scalable RESTful API built using Express and MongoDB that allows users to create, read, update, and delete notes. Users can also share their notes with others and search for notes using keywords with text indexing.

## Technologies Used

- **Framework**: Express.js - A lightweight and fast web framework for Node.js
- **Database**: MongoDB - A NoSQL database used for storing notes and users
- **Authentication**: JSON Web Token (JWT) - Ensures secure access
- **Security**:
  - **Helmet**: Protects against common web vulnerabilities
  - **CORS**: Enables cross-origin requests
  - **bcryptjs**: Hashes passwords securely
- **Rate Limiting**: `express-rate-limit` - Prevents abuse and excessive API calls
- **Validation**: `express-validator` - Validates user input
- **Search Optimization**: MongoDB Text Indexing - Allows efficient keyword-based searches

## Setup Instructions

### Prerequisites
Ensure you have the following installed:
- Node.js (>=14.x)
- MongoDB (local or cloud instance, e.g., MongoDB Atlas)
- A `.env` file with the following environment variables:
  ```
  PORT=5005
  MONGO_URI=mongodb://localhost:27017/notesdb
  JWT_SECRET=your_jwt_secret
  ```

### Installation & Running Locally

1. Clone the repository:
   ```sh
   git clone https://github.com/Syrgeek/Back-End-Assessment.git
   cd notes-api
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Start the server:
   ```sh
   node NotesApi.js
   ```
   The server will run at `http://localhost:5005`.

## API Endpoints

### Authentication
- **POST /api/auth/signup** - Create a new user account
- **POST /api/auth/login** - Log in and receive an access token

### Notes
- **GET /api/notes** - Get all notes of the authenticated user
- **GET /api/notes/:id** - Get a specific note by ID
- **POST /api/notes** - Create a new note
- **PUT /api/notes/:id** - Update an existing note
- **DELETE /api/notes/:id** - Delete a note
- **POST /api/notes/:id/share** - Share a note with another user
- **GET /api/search?q=** - Search notes using keywords

