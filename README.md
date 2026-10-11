# 🎯 AI-Powered Mock Interview System

A full-stack MERN application that analyzes your **resume** against a **target job description** and generates a personalized interview preparation report using **Google Gemini** — including a match score, likely technical and behavioral questions, skill gaps, and a day-by-day preparation plan. It can also generate a **tailored, downloadable resume PDF** for the role.

---

## ✨ Features

- 🔐 **Secure authentication** — JWT stored in cookies, bcrypt-hashed passwords, and a token blacklist for reliable logout
- 📄 **Resume parsing** — upload a PDF resume; text is extracted server-side
- 🤖 **AI-generated interview report** — match score, technical questions, behavioral questions, skill gaps with severity, and a preparation plan
- 🧱 **Structured AI output** — Gemini responses are constrained by a Zod-derived JSON Schema, so results are always valid, parseable JSON
- 📑 **Tailored resume PDF** — Gemini generates resume HTML, Puppeteer renders it into a downloadable PDF
- 🗂️ **Report history** — every generated report is saved and can be revisited
- 🛡️ **Protected routes** — client-side route guards backed by server-side auth middleware

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, Axios, SCSS |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB, Mongoose |
| **AI** | Google Gemini (`@google/genai`), Zod, `zod-to-json-schema` |
| **Auth** | JSON Web Tokens, bcryptjs, cookie-parser |
| **File handling** | Multer (memory storage), pdf-parse |
| **PDF generation** | Puppeteer |

---

## 🏗️ Architecture

```
React (Vite)  ──HTTP + cookies──▶  Express API  ──▶  MongoDB
                                       │
                                       ├──▶  Google Gemini API  (structured JSON output)
                                       └──▶  Puppeteer          (HTML → PDF)
```

**Report generation flow**

1. User submits resume (PDF), job description, and self-description from the UI as `multipart/form-data`
2. `authUser` middleware verifies the JWT cookie and checks the token isn't blacklisted
3. `multer` loads the uploaded file into memory; `pdf-parse` extracts the resume text
4. The AI service builds a prompt and calls Gemini with a JSON Schema generated from a Zod schema
5. The structured response is saved to MongoDB and returned to the client
6. The frontend navigates to the report page and renders the results

---

## 📁 Project Structure

```
interview_ai/
├── Backend/
│   ├── server.js                  # Entry point: loads env, connects DB, starts server
│   └── src/
│       ├── app.js                 # Express app, middleware, route mounting
│       ├── config/                # Database connection
│       ├── controllers/           # Request handlers (auth, interview)
│       ├── middlewares/           # Auth check, file upload (multer)
│       ├── models/                # Mongoose schemas (user, blacklist, interviewReport)
│       ├── routes/                # Route definitions
│       └── services/              # AI logic (Gemini + Puppeteer)
└── Frontend/
    └── src/
        ├── app.routes.jsx         # Router configuration
        └── features/
            ├── auth/              # Login, Register, auth context, hooks, API, Protected route
            └── interview/         # Home, Interview report page, context, hooks, API
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Log in with email and password | Public |
| GET | `/api/auth/logout` | Clear cookie and blacklist the token | Public |
| GET | `/api/auth/get-me` | Get the current logged-in user | Private |
| POST | `/api/interview/` | Generate an interview report (resume PDF + job description + self description) | Private |
| GET | `/api/interview/` | Get all reports for the logged-in user | Private |
| GET | `/api/interview/report/:interviewId` | Get a single report by ID | Private |
| POST | `/api/interview/resume/pdf/:interviewReportId` | Generate a tailored resume PDF | Private |

---

## 🗃️ Data Models

- **User** — username, email, hashed password
- **BlacklistToken** — invalidated JWTs (supports logout on a stateless auth system)
- **InterviewReport** — job description, resume text, self description, match score, technical questions, behavioral questions, skill gaps (with severity), preparation plan, and a reference to the owning user

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or MongoDB Atlas)
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the repository

```bash
git clone https://github.com/pulkitpareek1915/AI-Powered-Mock-Interview-System.git
cd AI-Powered-Mock-Interview-System
```

### 2. Set up the backend

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

Start the server (runs on **http://localhost:3000**):

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd ../Frontend
npm install
npm run dev
```

The app runs on **http://localhost:5173**.

---

## 🔒 Security Notes

- Secrets are loaded from environment variables and never committed (`.env` is git-ignored)
- Passwords are hashed with bcrypt before storage
- Logged-out tokens are blacklisted so they can't be reused
- CORS is restricted to the frontend origin with credentials enabled

---

## 🗺️ Roadmap

- [ ] Add error handling and retries around AI calls
- [ ] Set `httpOnly`, `secure`, and `sameSite` flags on the auth cookie
- [ ] Add request validation on the backend with Zod
- [ ] Support DOCX resume uploads
- [ ] Add rate limiting on auth routes
- [ ] Move PDF generation to a background job queue
- [ ] Add unit and integration tests

---

## 👤 Author

**Pulkit Pareek**
GitHub: [@pulkitpareek1915](https://github.com/pulkitpareek1915)

---

## 📄 License

This project is licensed under the ISC License.
