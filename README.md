# CleanAir AI — Madurai For Nation

**AI-Powered Hyperlocal Pollution Detection & Municipal Response Platform**

A full-stack application that enables citizens to report pollution incidents with AI-powered photo analysis, and provides municipal officers with tools to manage, track, and respond to environmental issues in real-time.

## Problem Statement

City-level air quality apps often miss hyper-local events such as garbage dump fires, industrial clusters, and smog traps at busy junctions because local authorities cannot monitor every street in real time. These small but intense pollution pockets often go unnoticed while directly affecting nearby residents.

## Solution Overview

Madurai For Nation addresses this gap by combining citizen-uploaded pollution photos, location-based air quality data, AI analysis, hotspot detection, and predictive insights into a neighborhood-level pollution map. The system helps municipal teams identify hidden hotspots early, forecast air quality spikes over the next 24 hours, and deploy targeted interventions such as cleanup crews, water-mist cannons, and inspections exactly where they are needed.

---

## Architecture

```
Madurai_For_Nation/
├── Frontend/          # React 19 + Vite + TypeScript + Tailwind v4
├── backend/           # Express + MongoDB + Mongoose + Gemini AI
├── api/               # Vercel serverless entry (re-exports backend)
├── data/              # Local MongoDB data / logs
├── pic/               # Sample pollution images for testing
└── vercel.json        # Vercel deployment config
```

---

## Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **react-router-dom v7** (HashRouter, role-based routing)
- **motion** (Framer Motion) — animations
- **lucide-react** + **@fortawesome/react-fontawesome** — icons
- **react-leaflet** + **leaflet.heat** — interactive pollution heat map
- **axios** — HTTP client
- **react-hot-toast** — notifications
- **@google/genai** — Google Gemini AI SDK

### Backend
- **Express 4.21** — REST API
- **MongoDB + Mongoose 8** — database
- **bcryptjs** + **jsonwebtoken** — authentication
- **multer** + **sharp** — file uploads & image processing
- **@google/genai** — Gemini Vision AI for pollution analysis
- **dotenv** — environment configuration

### Deployment
- **Vercel** — frontend (static) + serverless API
- **MongoDB Atlas** — cloud database

---

## Features

### Citizen Portal
| Route | Page | Description |
|-------|------|-------------|
| `/citizen/dashboard` | Dashboard | Overview of reports, AQI, hotspots |
| `/citizen/report` | Report | Upload photo → AI analysis → submit report |
| `/citizen/reports` | My Reports | Track municipal response progress |
| `/citizen/map` | Pollution Map | Interactive heat map of all reports |
| `/citizen/hotspots` | Hotspots | AI-detected pollution hotspot zones |
| `/citizen/aqi` | AQI & Prediction | Live AQI + 24h pollution forecast |
| `/citizen/profile` | Profile | Account details, stats, achievements |

### Officer Portal
| Route | Page | Description |
|-------|------|-------------|
| `/officer/dashboard` | Dashboard | City-wide stats, alerts, overview |
| `/officer/reports` | Reports | Manage & review citizen reports |
| `/officer/hotspots` | Hotspots | Assign teams to hotspot zones |
| `/officer/analytics` | Analytics | Charts, trends, performance metrics |
| `/officer/profile` | Profile | Edit profile, department, stats |

### Core Workflow

1. **Citizen** uploads a pollution photo via the Report page
2. **Google Gemini 2.5 Flash** analyzes the image for pollution type, severity, health risk, and recommendations
3. **OpenWeather API** fetches real-time AQI and weather data for the report location
4. Report is saved to MongoDB with AI analysis results and air quality data
5. **Municipal officers** review reports, assign teams, and update status
6. Citizens track progress through the status timeline (Reported → Under Review → Team Assigned → In Progress → Resolved)
7. **Hotspot engine** automatically clusters nearby reports into hotspot zones for priority response

---

## Environment Variables

### Frontend (`Frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<db>?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
JWT_SECRET=your_jwt_secret
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- OpenWeather API key ([get one free](https://openweathermap.org/api))
- Google Gemini API key ([Google AI Studio](https://aistudio.google.com/))

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd Madurai_For_Nation

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env .env.local   # Edit with your keys

# 4. Start backend server
npm run dev          # http://localhost:5000

# 5. Open a new terminal — install frontend
cd Frontend
npm install

# 6. Start frontend dev server
npm run dev          # http://localhost:3000
```

The Vite dev server proxies `/api` and `/uploads` to `localhost:5000` automatically.

### Using Sample Images

The `pic/` directory contains sample pollution images for testing the AI analysis:
- `constr.jpg` — Construction dust
- `factory_smoke.jpg` — Industrial emissions
- `traffic_pollution.jpg` — Vehicle exhaust
- `clean_env.jpg` — Clean environment (no pollution detected)

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/profile` | Bearer | Get current user profile |
| `POST` | `/api/analyze` | Optional | Analyze pollution image (Gemini) |
| `GET` | `/api/reports` | Optional | List reports (`?map=true` for map data) |
| `GET` | `/api/reports/:id` | Bearer | Get single report |
| `GET` | `/api/officer/profile` | Bearer (officer) | Get officer profile + stats |
| `PUT` | `/api/officer/profile` | Bearer (officer) | Update officer profile |
| `GET` | `/api/dashboard/stats` | Bearer | Dashboard aggregate stats |
| `GET` | `/api/alerts` | Bearer | List pollution alerts |
| `GET` | `/api/prediction` | — | 24-hour AQI prediction |
| `GET` | `/api/hotspots` | Bearer | List pollution hotspots |
| `GET` | `/api/hotspots/citizen/my-reports` | Bearer | Citizen's submitted reports |
| `GET` | `/api/usage` | Bearer | Gemini API usage stats |

---

## Project Structure

### Frontend (`Frontend/src/`)

```
src/
├── api/              # API client functions
│   ├── analyze.ts    # analyzePollutionImage
│   ├── prediction.ts # fetchPrediction
│   └── reports.ts    # fetchMyReports, fetchMapReports
├── components/       # Reusable UI components
│   ├── AirQualityCard.tsx   # Live AQI gauge
│   ├── AIResultCard.tsx     # Gemini analysis results
│   ├── UploadCard.tsx       # Drag-drop / camera upload
│   ├── Common.tsx           # EmptyState, etc.
│   └── Skeleton.tsx         # Loading skeletons
├── pages/            # Route page components
│   ├── Auth.tsx, Home.tsx, About.tsx
│   ├── Report.tsx, CitizenReports.tsx
│   ├── Dashboard.tsx, MapPage.tsx
│   ├── AQI.tsx, Profile.tsx, Alerts.tsx
│   ├── HotspotsPage.tsx, AdminAnalytics.tsx
│   ├── CitizenDashboard.tsx, OfficerDashboard.tsx
│   └── OfficerReports.tsx, AccessDenied.tsx
├── utils/            # Helper utilities
│   ├── municipalStatus.ts  # Status stages, formatting
│   └── reportTransform.ts  # DB report → frontend model
├── types.ts          # TypeScript interfaces
├── data.ts           # Static data (categories, initial reports)
├── App.tsx           # Router + auth state
├── main.tsx          # Entry point
└── index.css         # Tailwind v4 + custom styles
```

### Backend (`backend/src/`)

```
src/
├── config/
│   ├── mongodb.js    # Mongoose connection
│   └── gemini.js     # Gemini client init
├── controllers/      # Request handlers
├── middleware/        # Auth, RBAC, upload
├── models/           # Mongoose schemas
├── routes/           # Express routers
├── services/         # Business logic
│   ├── geminiVision.js    # Image analysis via Gemini
│   ├── aqiService.js      # OpenWeather air pollution
│   ├── predictionService.js # 24h AQI forecast
│   └── hotspotEngine.js   # Hotspot clustering
└── utils/            # Helpers
```

---

## Auth Flow

1. User registers/logs in → receives JWT token
2. Token stored in `localStorage`
3. On app load, `GET /api/auth/profile` verifies token and loads user
4. `RoleProtectedRoute` checks `user.role` before rendering citizen/officer pages
5. 401 responses trigger automatic logout

Roles: `citizen` | `officer`

---

## AI Analysis Pipeline

1. User uploads image → converted to base64
2. Sent as `multipart/form-data` to `POST /api/analyze`
3. Backend uses **Gemini 2.5 Flash Vision** to analyze:
   - Pollution detected (boolean)
   - Pollution type (Industrial, Traffic, Construction, etc.)
   - Confidence score
   - Severity level
   - Health risk description
   - Recommendations
   - Emergency level
4. OpenWeather API fetches live AQI + weather data
5. Both results returned and displayed in the UI

---

## Deployment

The project is configured for Vercel deployment:

```bash
# Build frontend
cd Frontend && npm run build   # Outputs to dist/

# Deploy
vercel --prod
```

`vercel.json` rewrites `/api/*` to the serverless function in `api/index.js`.

---

## License

MIT — Built for Madurai For Nation.
