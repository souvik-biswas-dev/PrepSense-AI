# PrepSense AI

**AI-powered interview preparation platform** — analyze any job description against your profile and get a personalized interview strategy in seconds.

---

## Screenshots

| Home | Interview Strategy |
|---|---|
| ![Home](docs/screenshots/homepage.png) | ![Interview Strategy](docs/screenshots/interview-strategy.png) |

| Login | Register |
|---|---|
| ![Login](docs/screenshots/login-page.png) | ![Register](docs/screenshots/register-page.png) |

---

## What It Does

Upload your resume and paste a job description. PrepSense uses Google Gemini to:

- **Score your match** against the role (0–100)
- **Generate tailored questions** — both technical and behavioral — with model answers and interviewer intent
- **Identify skill gaps** with severity ratings
- **Build a day-by-day prep roadmap** specific to that job
- **Generate a tailored resume PDF** optimized for ATS and the target role

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, SCSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| AI | Google Gemini (`@google/genai`) |
| Auth | JWT + HTTP-only cookies |
| PDF | Puppeteer (resume generation), pdf-parse (resume parsing) |

---

## Project Structure

```
PrepSense/
├── Backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Auth, file upload
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express routers
│   │   └── services/       # AI service (Gemini)
│   └── server.js
└── Frontend/
    └── src/
        └── features/
            ├── auth/       # Login, Register, Protected routes
            └── interview/  # Home, Interview report pages
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Google Gemini API key

### Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

```bash
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`, API at `http://localhost:3000`.

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT cookie |
| POST | `/api/auth/logout` | Logout (blacklist token) |
| POST | `/api/interview/generate` | Generate interview report (multipart) |
| GET | `/api/interview/reports` | Get all reports for current user |
| GET | `/api/interview/report/:id` | Get a single report |
| GET | `/api/interview/resume/:id` | Download tailored resume PDF |

---

## Low-Level Design

### Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String username
        +String email
        +String password
    }

    class BlacklistToken {
        +ObjectId _id
        +String token
        +Date createdAt
    }

    class InterviewReport {
        +ObjectId _id
        +String jobDescription
        +String resume
        +String selfDescription
        +Number matchScore
        +TechnicalQuestion[] technicalQuestions
        +BehavioralQuestion[] behavioralQuestions
        +SkillGap[] skillGaps
        +PreparationPlan[] preparationPlan
        +ObjectId user
        +String title
        +Date createdAt
        +Date updatedAt
    }

    class TechnicalQuestion {
        +String question
        +String intention
        +String answer
    }

    class BehavioralQuestion {
        +String question
        +String intention
        +String answer
    }

    class SkillGap {
        +String skill
        +String severity
    }

    class PreparationPlan {
        +Number day
        +String focus
        +String[] tasks
    }

    class AuthController {
        +registerUserController(req, res)
        +loginUserController(req, res)
        +logoutUserController(req, res)
        +getMeController(req, res)
    }

    class InterviewController {
        +generateInterViewReportController(req, res)
        +getInterviewReportByIdController(req, res)
        +getAllInterviewReportsController(req, res)
        +generateResumePdfController(req, res)
    }

    class AIService {
        -GoogleGenAI ai
        -ZodSchema interviewReportSchema
        +generateInterviewReport(resume, selfDescription, jobDescription) Object
        +generateResumePdf(resume, selfDescription, jobDescription) Buffer
        -generatePdfFromHtml(htmlContent) Buffer
    }

    class AuthMiddleware {
        +authUser(req, res, next)
    }

    class FileMiddleware {
        +upload Multer
    }

    class AuthContext {
        +User user
        +login(email, password)
        +register(username, email, password)
        +logout()
        +fetchUser()
    }

    class InterviewContext {
        +InterviewReport[] reports
        +InterviewReport currentReport
        +fetchReports()
        +fetchReportById(id)
        +generateReport(formData)
        +downloadResumePdf(reportId)
    }

    class AuthAPI {
        +register(username, email, password)
        +login(email, password)
        +logout()
        +getMe()
    }

    class InterviewAPI {
        +generateInterviewReport(jobDescription, selfDescription, resumeFile)
        +getInterviewReportById(interviewId)
        +getAllInterviewReports()
        +generateResumePdf(interviewReportId)
    }

    InterviewReport "many" --> "1" User : belongs to
    InterviewReport "1" *-- "many" TechnicalQuestion : contains
    InterviewReport "1" *-- "many" BehavioralQuestion : contains
    InterviewReport "1" *-- "many" SkillGap : contains
    InterviewReport "1" *-- "many" PreparationPlan : contains

    AuthController --> User : queries/creates
    AuthController --> BlacklistToken : creates/queries
    InterviewController --> InterviewReport : queries/creates
    InterviewController --> AIService : calls

    AuthMiddleware --> BlacklistToken : checks blacklist
    AuthMiddleware --> AuthController : guards routes

    AuthContext --> AuthAPI : uses
    InterviewContext --> InterviewAPI : uses
```

---

### Sequence Diagrams

#### User Registration

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Express API
    participant DB as MongoDB

    User->>FE: Fill registration form
    FE->>BE: POST /api/auth/register {username, email, password}
    BE->>DB: findOne({username} OR {email})
    DB-->>BE: null (user not found)
    BE->>BE: bcrypt.hash(password, 10)
    BE->>DB: userModel.create({username, email, hashedPassword})
    DB-->>BE: savedUser
    BE->>BE: jwt.sign({id, username}, JWT_SECRET, {expiresIn: "1d"})
    BE-->>FE: 201 {user} + Set-Cookie: token (HTTP-only)
    FE->>FE: AuthContext.setUser(user)
    FE-->>User: Redirect to Home
```

#### User Login

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Express API
    participant DB as MongoDB

    User->>FE: Fill login form
    FE->>BE: POST /api/auth/login {email, password}
    BE->>DB: userModel.findOne({email})
    DB-->>BE: user
    BE->>BE: bcrypt.compare(password, user.password)
    BE->>BE: jwt.sign({id, username}, JWT_SECRET)
    BE-->>FE: 200 {user} + Set-Cookie: token
    FE->>FE: AuthContext.setUser(user)
    FE-->>User: Redirect to Home
```

#### User Logout

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Express API
    participant DB as MongoDB

    User->>FE: Click Logout
    FE->>BE: GET /api/auth/logout (cookie: token)
    BE->>DB: blacklistTokenModel.create({token})
    DB-->>BE: saved
    BE->>BE: res.clearCookie("token")
    BE-->>FE: 200 {message}
    FE->>FE: AuthContext.setUser(null)
    FE-->>User: Redirect to Login
```

#### Generate Interview Report

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Express API
    participant MW as Auth + File Middleware
    participant AI as AIService (Gemini)
    participant DB as MongoDB

    User->>FE: Submit form (resume PDF, jobDescription, selfDescription)
    FE->>BE: POST /api/interview/ multipart/form-data
    BE->>MW: authUser() — validate JWT cookie
    MW->>DB: blacklistTokenModel.findOne({token})
    DB-->>MW: null (valid token)
    MW->>MW: jwt.verify(token) → req.user
    MW->>BE: next()
    BE->>BE: pdf-parse → extract resume text
    BE->>AI: generateInterviewReport({resume, selfDescription, jobDescription})
    AI->>AI: Build Gemini prompt + Zod schema
    AI->>AI: gemini-3-flash-preview → structured JSON
    AI-->>BE: {matchScore, technicalQuestions, behavioralQuestions, skillGaps, preparationPlan, title}
    BE->>DB: interviewReportModel.create({user, ...aiReport})
    DB-->>BE: savedReport
    BE-->>FE: 201 {interviewReport}
    FE->>FE: InterviewContext.setCurrentReport(report)
    FE-->>User: Render Interview Report page
```

#### Get All Interview Reports

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Express API
    participant MW as Auth Middleware
    participant DB as MongoDB

    User->>FE: Navigate to Home
    FE->>BE: GET /api/interview/ (cookie: token)
    BE->>MW: authUser() — validate JWT cookie
    MW-->>BE: req.user set
    BE->>DB: interviewReportModel.find({user: req.user.id}).sort({createdAt: -1}).select(summary fields)
    DB-->>BE: reports[]
    BE-->>FE: 200 {interviewReports}
    FE-->>User: Display report cards
```

#### Download Tailored Resume PDF

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend (React)
    participant BE as Express API
    participant MW as Auth Middleware
    participant AI as AIService (Gemini + Puppeteer)
    participant DB as MongoDB

    User->>FE: Click "Download Resume PDF"
    FE->>BE: POST /api/interview/resume/pdf/:reportId (cookie: token)
    BE->>MW: authUser() — validate JWT
    MW-->>BE: req.user set
    BE->>DB: interviewReportModel.findById(reportId)
    DB-->>BE: {resume, jobDescription, selfDescription}
    BE->>AI: generateResumePdf({resume, jobDescription, selfDescription})
    AI->>AI: Gemini prompt → HTML resume string
    AI->>AI: puppeteer.launch() → page.setContent(html) → page.pdf()
    AI-->>BE: pdfBuffer
    BE-->>FE: 200 application/pdf (binary blob)
    FE->>FE: Create blob URL → trigger download
    FE-->>User: resume_<id>.pdf downloaded
```

---

## License

MIT
