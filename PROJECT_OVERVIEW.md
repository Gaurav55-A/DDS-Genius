# DDR Genius - Complete Project Documentation

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Design System](#design-system)
5. [Features Implemented](#features-implemented)
6. [File Structure](#file-structure)
7. [API Endpoints](#api-endpoints)
8. [Components](#components)
9. [Pages](#pages)
10. [Database Schema](#database-schema)
11. [PDF Generation](#pdf-generation)
12. [Installation & Setup](#installation--setup)
13. [Usage Guide](#usage-guide)
14. [Testing](#testing)
15. [Development Timeline](#development-timeline)
16. [Future Enhancements](#future-enhancements)

---

## Project Overview

**DDR Genius** is an AI-powered automated platform that converts raw property inspection PDFs into professional Detailed Diagnosis Reports (DDR). The system intelligently merges visual observations from inspection reports with thermal imaging data, creating comprehensive diagnostic reports with conflict detection.

### Purpose
Transform manual inspection data processing into an automated, AI-driven workflow that:
- Extracts data from Sample Reports (visual inspections)
- Extracts data from Thermal Image Reports
- Uses AI (Claude 3.5 Sonnet) to intelligently match observations by room/area
- Detects conflicts between visual and thermal data
- Generates professional PDF reports matching UrbanRoof DDR format
- Provides analytics dashboard for insights across all reports

### Key Differentiator
The system flags critical conflicts where thermal imaging detects issues (e.g., cold spots indicating moisture) that aren't visible in visual inspections, ensuring inspectors never miss sub-surface problems.

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS** (with custom design system)
- **shadcn/ui** (component library)
- **Lucide React** (icons)
- **Recharts** (analytics visualizations)
- **react-dropzone** (file uploads)
- **sonner** (toast notifications)

### Backend
- **Next.js API Routes**
- **Node.js**
- **MongoDB** (database)
- **Anthropic Claude 3.5 Sonnet** (AI matching engine)

### PDF Processing
- **pdf-parse** (text extraction)
- **pdf-lib** (image extraction)
- **pdfkit** (PDF generation)
- **sharp** (image processing)

### Typography
- **Plus Jakarta Sans** (headings)
- **Inter** (body text, data)

---

## Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER UPLOADS                          │
│   Sample Report.pdf (Visual) + Thermal Images.pdf           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    PDF PARSING LAYER                         │
│  • Extract text (pdf-parse)                                  │
│  • Extract images (pdf-lib)                                  │
│  • Parse thermal data (hotspot, coldspot, emissivity)        │
│  • Parse visual observations (rooms, defects)                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI MATCHING ENGINE                          │
│         Claude 3.5 Sonnet (Anthropic)                        │
│  • Match observations by room/area                           │
│  • Detect data conflicts                                     │
│  • Apply strict rules:                                       │
│    - Missing data → "Not Available"                          │
│    - Missing images → "Image Not Available"                  │
│    - Conflicts → Flagged in array                            │
│  • Generate merged JSON                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA PERSISTENCE                           │
│                     MongoDB                                  │
│  • Store report data                                         │
│  • Store analytics                                           │
│  • Store merged observations                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  PRESENTATION LAYER                          │
│  • Analytics Dashboard (Recharts)                            │
│  • KPI Cards (Health Index, Defects, Temperature)           │
│  • Conflict Alerts (Rose-bordered)                           │
│  • PDF Export (pdfkit)                                       │
└─────────────────────────────────────────────────────────────┘
```

### Application Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │   Home Page    │  │   Analytics    │  │  Report View   │ │
│  │  (Upload UI)   │  │   Dashboard    │  │  (Future)      │ │
│  └────────┬───────┘  └────────┬───────┘  └────────────────┘ │
│           │                   │                               │
│           └───────────────────┴───────────────────────────────┤
│                             ▼                                 │
│                    Next.js App Router                         │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    API ROUTES LAYER                           │
│  /api/process        - Upload & process PDFs                 │
│  /api/reports        - CRUD operations                       │
│  /api/analytics      - Aggregated analytics                  │
│  /api/export-pdf     - Generate & download PDF               │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC                             │
│  lib/pdf-parser.js      - PDF extraction utilities           │
│  lib/ai-matcher.js      - Claude AI integration              │
│  lib/pdf-generator.js   - PDF generation engine              │
│  lib/db.js              - MongoDB connection                 │
└───────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                 │
│  MongoDB Collections:                                         │
│  • reports (main collection)                                  │
│    - reportId, propertyInfo, visualObservations,             │
│      thermalReadings, mergedData, analytics, status          │
└──────────────────────────────────────────────────────────────┘
```

---

## Design System

### Color Architecture (Vibrant Industrial)

#### Primary Brand: Electric Yellow (#FACC15)
**Usage:**
- Logo icon backgrounds
- Primary CTA buttons (Analytics, Export Report)
- Active navigation states
- KPI card accents
- Progress bars
- Bullet markers in lists

**Rationale:**
Represents UrbanRoof's visibility and energy. Commands attention for primary actions while maintaining perfect readability with Slate-950 text.

#### Secondary Technical: Electric Blue (#3B82F6)
**Usage:**
- Technical data indicators
- Coldspot temperature bars
- AI feature highlights
- Area headers in PDFs
- Secondary chart elements

**Rationale:**
Represents "cold" technical data and the AI engine working behind the scenes. Evokes trust and technical precision.

#### Status Colors:

**Neon Teal (#2DD4BF)**
- Health Index indicators
- Minor severity classification
- Positive trends (↑)
- Success states

**Bright Rose (#FB7185)**
- Critical conflict alerts
- Defect indicators
- Severe severity classification
- Error states

**Vivid Amber (#F59E0B)**
- Warning states
- Moderate severity classification
- Hotspot temperature indicators
- Cautionary notices

### Typography

**Headings: Plus Jakarta Sans**
- Font weight: 400, 500, 600, 700, 800
- Usage: h1-h6, card titles, section headers
- Characteristics: Bold, commanding, modern

**Body: Inter**
- Font weight: 300, 400, 500, 600, 700
- Usage: Body text, data values, labels, tooltips
- Characteristics: Clean, readable, optimized for screens

### Layout Principles

**High-Density Minimalist**
- 1px borders (`border-slate-200` light / `border-slate-800` dark)
- No heavy shadows
- Clean spacing (Tailwind spacing scale)
- Maximum information density
- White space for breathing room

**Grid System**
- 4-column KPI cards (responsive: 1 col mobile, 2 tablet, 4 desktop)
- 2-column charts (responsive)
- Container max-width: 1400px
- Padding: 2rem

---

## Features Implemented

### 1. PDF Processing & Data Extraction ✅

**Text Extraction:**
- Extracts complete text from both PDFs using `pdf-parse`
- Handles multi-page documents
- Preserves structure and formatting

**Image Extraction:**
- Uses `pdf-lib` to extract embedded images
- Saves to `/public/uploads/{reportId}/`
- Categorizes as 'visual' or 'thermal'
- Maintains original quality

**Thermal Data Parsing:**
- Hotspot temperatures (°C)
- Coldspot temperatures (°C)
- Emissivity values
- Reflected temperature
- Date/time stamps
- Image filenames

**Visual Observation Parsing:**
- Room/area identification (Hall, Bedroom, Kitchen, etc.)
- Defect type classification (Dampness, Leakage, Cracks, Tile Issues)
- Point numbers
- Descriptions
- Photo references

### 2. AI-Powered Data Matching ✅

**Claude 3.5 Sonnet Integration:**
- Model: `claude-3-5-sonnet-20241022`
- Max tokens: 4000
- Temperature: 0.3 (low for consistency)

**Matching Logic:**
- Matches visual observations with thermal readings by room/area
- Handles variations in room naming
- Detects correlations between visual and thermal data

**Strict Data Rules (Enforced):**
- Missing data → Write "Not Available"
- Missing images → Write "Image Not Available"
- Data conflicts → Flagged in `dataConflicts` array
- No duplicate points
- No invented facts

**Output Structure:**
```json
{
  "propertyIssueSummary": "Overview of all issues",
  "areaWiseObservations": [
    {
      "area": "Room name",
      "visualObservation": "Description",
      "thermalReading": {
        "hotspot": 28.5,
        "coldspot": 20.3,
        "analysis": "What the data indicates"
      },
      "defectType": "Dampness",
      "severity": "Moderate",
      "images": ["filename1.jpg"]
    }
  ],
  "probableRootCause": "Analysis",
  "severityAssessment": {
    "overall": "Moderate",
    "reasoning": "Why this level"
  },
  "recommendedActions": ["Action 1", "Action 2"],
  "additionalNotes": "Supplementary info",
  "missingOrUnclearInfo": ["What's missing"],
  "dataConflicts": ["Conflict descriptions"]
}
```

### 3. Analytics Dashboard ✅

**KPI Cards (4-Column):**

1. **Health Index** (Teal)
   - Calculated: `((totalAreas - totalDefects) / totalAreas) * 100`
   - Progress bar
   - Trend indicator (+5% example)

2. **Total Defects** (Rose)
   - Count of all issues identified
   - Trend indicator (-3% example)

3. **Avg Hotspot** (Amber)
   - Average maximum temperature across all areas
   - Displayed in °C

4. **Total Areas** (Blue)
   - Count of distinct areas inspected
   - Progress bar (100% when complete)

**Visualizations (Recharts):**

1. **Issue Distribution Pie Chart**
   - Shows breakdown by defect type
   - Vibrant color palette
   - Percentage labels

2. **Temperature Analysis Bar Chart**
   - Hotspot vs Coldspot by area
   - Amber for hotspots, Blue for coldspots
   - Y-axis labeled "Temperature (°C)"

3. **Severity Distribution Bar Chart**
   - Teal for Minor
   - Amber for Moderate
   - Rose for Severe

**Conflict Alerts:**
- Rose-bordered alert component
- Glowing icon background
- Displays visual vs thermal discrepancies
- Example: "Hallway Skirting - Visual shows no dampness vs Thermal detects 20.5°C cold spot"
- Warning text: "⚠️ Sub-surface issues not visible to naked eye"

### 4. Theme System ✅

**Dark/Light Mode:**
- Toggle button in header (Moon/Sun icon)
- localStorage persistence
- System preference detection on first load
- All components adapt (charts, cards, text)
- CSS variables for both modes

**Implementation:**
- Tailwind `dark:` utility classes
- CSS custom properties in `globals.css`
- JavaScript localStorage API
- React state management

### 5. PDF Export Functionality ✅

**Export Button:**
- Electric Yellow background (primary CTA)
- Slate-950 text
- Download icon
- Loading state: "Exporting..." with spinner
- Only visible when reports exist

**PDF Generation (pdfkit):**

**Cover Page:**
- Electric Yellow header (80px)
- Title: "DETAILED DIAGNOSIS REPORT"
- Property information table
- Report ID
- Footer: "Made by Gaurav Agrawal"

**Summary Page:**
- Property Issue Summary
- Severity Assessment (color-coded badge)
- Probable Root Cause
- Recommended Actions (bullet list)

**Area-wise Observations:**
- Electric Blue headers for each area
- Visual Observation section
- Thermal Analysis section
- Defect Type & Severity
- Auto-pagination

**Analysis Page:**
- Additional Notes
- Missing Information (amber markers)
- Data Conflicts (rose markers)

**Limitations Page:**
- 6-point limitation list
- Professional disclaimer
- Generator footer

**API Endpoint:**
- `POST /api/export-pdf`
- Input: `{ reportId: "uuid" }`
- Output: PDF blob
- Headers: Content-Type, Content-Disposition

### 6. File Upload System ✅

**Drag & Drop Zones:**
- Two separate zones (Sample Report, Thermal Images)
- react-dropzone integration
- Visual feedback on drag
- File type validation (.pdf only)
- Green checkmark on successful upload
- Toast notifications

**Processing Flow:**
1. User drops/selects files
2. Frontend validates file types
3. FormData sent to `/api/process`
4. Backend extracts text and images
5. AI processes and matches data
6. Report saved to MongoDB
7. Success message with Report ID
8. Redirect option to Analytics or Report view

---

## File Structure

```
/app/
├── app/                                # Next.js App Router
│   ├── api/[[...path]]/route.js       # Universal API handler
│   ├── dashboard/analytics/page.js    # Analytics dashboard
│   ├── page.js                        # Home/upload page
│   ├── layout.js                      # Root layout with fonts
│   └── globals.css                    # Global styles + design tokens
│
├── components/                         # React components
│   ├── ui/                            # shadcn/ui components
│   │   ├── alert.jsx
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── progress.jsx
│   │   └── ... (28 other components)
│   ├── analytics-charts.jsx          # Recharts visualizations
│   ├── conflict-alert.jsx             # Rose-bordered alert
│   ├── kpi-card.jsx                   # Stat cards with progress
│   ├── theme-toggle.jsx               # Dark/Light mode toggle
│   └── upload-zone.jsx                # Drag-drop file upload
│
├── lib/                                # Business logic
│   ├── ai-matcher.js                  # Claude AI integration
│   ├── db.js                          # MongoDB connection
│   ├── pdf-generator.js               # PDF generation engine
│   ├── pdf-parser.js                  # PDF extraction utilities
│   └── utils.js                       # Helper functions
│
├── public/                             # Static assets
│   └── uploads/                       # Uploaded PDF images
│       └── {reportId}/                # Per-report directories
│           ├── visual_page1_img1.jpg
│           └── thermal_page2_img1.jpg
│
├── tests/                              # Test files
│   └── __init__.py
│
├── .env                                # Environment variables
├── .gitignore                          # Git ignore rules
├── package.json                        # Dependencies
├── tailwind.config.js                  # Tailwind + design tokens
├── postcss.config.js                   # PostCSS config
├── next.config.mjs                     # Next.js config
├── jsconfig.json                       # JavaScript config
├── README.md                           # Project documentation
├── IMPLEMENTATION.md                   # Implementation details
├── VIBRANT_DESIGN_IMPLEMENTATION.md   # Design system docs
├── FINAL_CLEANUP_COMPLETE.md          # Final cleanup docs
└── GITHUB_PUSH.md                      # Git push instructions
```

---

## API Endpoints

### Base URL
- Local: `http://localhost:3000/api`
- Production: `https://defect-detector-10.preview.emergentagent.com/api`

### Endpoints

#### GET /api/root
**Description:** API health check

**Response:**
```json
{
  "message": "DDR Genius API",
  "version": "1.0.0",
  "endpoints": ["/process", "/reports", "/analytics", "/export-pdf"]
}
```

---

#### POST /api/process
**Description:** Upload and process PDFs with AI

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `sampleReport`: PDF file (visual inspection)
  - `thermalImages`: PDF file (thermal data)

**Response:**
```json
{
  "reportId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Report processed successfully",
  "analytics": {
    "totalAreas": 8,
    "totalDefects": 12,
    "issueDistribution": {
      "Dampness": 5,
      "Leakage": 3,
      "Cracks": 2,
      "Tile Issues": 2
    },
    "temperatureStats": {
      "avgHotspot": 26.5,
      "avgColdspot": 21.2,
      "maxHotspot": 28.8,
      "minColdspot": 20.1,
      "readings": [...]
    }
  },
  "mergedData": { ... }
}
```

**Errors:**
- 400: Missing files
- 500: Processing error

---

#### GET /api/reports
**Description:** Get all processed reports

**Response:**
```json
[
  {
    "reportId": "uuid",
    "propertyInfo": {
      "type": "Flat",
      "floors": 11,
      "inspectionDate": "2024-01-15T10:30:00Z",
      "inspector": "DDR Genius AI"
    },
    "visualObservations": [...],
    "thermalReadings": [...],
    "mergedData": {...},
    "analytics": {...},
    "status": "completed",
    "createdAt": "2024-01-15T10:35:00Z"
  }
]
```

---

#### GET /api/reports/:id
**Description:** Get specific report by ID

**Response:**
```json
{
  "reportId": "uuid",
  "propertyInfo": {...},
  "mergedData": {...},
  "analytics": {...}
}
```

**Errors:**
- 404: Report not found

---

#### GET /api/analytics
**Description:** Get aggregated analytics across all reports

**Response:**
```json
{
  "totalReports": 10,
  "totalAreas": 80,
  "totalDefects": 120,
  "issueDistribution": {
    "Dampness": 40,
    "Leakage": 30,
    "Cracks": 25,
    "Tile Issues": 25
  },
  "severityDistribution": {
    "Minor": 30,
    "Moderate": 60,
    "Severe": 30
  },
  "temperatureStats": {
    "avgHotspot": 26.8,
    "avgColdspot": 21.5,
    "maxHotspot": 29.2,
    "minColdspot": 19.8,
    "readings": [...]
  },
  "mostCommonIssue": "Dampness"
}
```

---

#### POST /api/export-pdf
**Description:** Generate and download DDR PDF

**Request:**
```json
{
  "reportId": "uuid"
}
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="DDR_Report_{reportId}.pdf"`
- Body: PDF binary data

**Errors:**
- 400: Missing reportId
- 404: Report not found
- 500: PDF generation error

---

## Components

### Theme Toggle (`theme-toggle.jsx`)
**Purpose:** Dark/Light mode switcher

**Features:**
- Moon/Sun icon (Lucide)
- localStorage persistence
- System preference detection
- Smooth transitions

**Usage:**
```jsx
import { ThemeToggle } from '@/components/theme-toggle';

<ThemeToggle />
```

---

### KPI Card (`kpi-card.jsx`)
**Purpose:** Display key performance indicators with visual enhancements

**Props:**
- `title`: Card title
- `value`: Main value to display
- `description`: Subtitle/description
- `icon`: Lucide React icon component
- `progress`: Progress bar value (0-100)
- `color`: 'yellow' | 'blue' | 'teal' | 'rose' | 'amber'
- `trend`: Trend percentage (positive or negative)

**Features:**
- Glowing animated icon backgrounds
- Vibrant progress bars
- Trend indicators (↑ ↓)
- Hover effects

**Usage:**
```jsx
import { KPICard } from '@/components/kpi-card';
import { Activity } from 'lucide-react';

<KPICard
  title="Health Index"
  value="85%"
  description="Overall property condition"
  icon={Activity}
  progress={85}
  color="teal"
  trend={5}
/>
```

---

### Conflict Alert (`conflict-alert.jsx`)
**Purpose:** Display critical data conflicts with high visibility

**Props:**
- `title`: Alert title (default: "Critical Data Conflicts Detected")
- `conflicts`: Array of conflict objects or strings

**Conflict Object:**
```javascript
{
  area: "Hallway Skirting",
  description: "Mismatch description",
  visualData: "What visual inspection showed",
  thermalData: "What thermal imaging detected"
}
```

**Features:**
- 2px Rose border
- Glowing rose icon
- Bullet list formatting
- Warning text at bottom

**Usage:**
```jsx
import { ConflictAlert } from '@/components/conflict-alert';

<ConflictAlert
  title="Critical Conflicts"
  conflicts={[
    {
      area: "Hallway",
      description: "Thermal cold spot detected",
      visualData: "No visible dampness",
      thermalData: "20.5°C cold spot"
    }
  ]}
/>
```

---

### Upload Zone (`upload-zone.jsx`)
**Purpose:** Drag-and-drop file upload interface

**Props:**
- `onUploadComplete`: Callback function when processing completes

**Features:**
- Two separate drop zones
- File type validation
- Visual feedback (drag state, success state)
- Progress indicator during processing
- Toast notifications
- Success screen with Report ID
- Navigation buttons

**Usage:**
```jsx
import UploadZone from '@/components/upload-zone';

<UploadZone onUploadComplete={(data) => console.log(data)} />
```

---

### Analytics Charts (`analytics-charts.jsx`)

#### IssueDistributionChart
**Purpose:** Pie chart showing defect types

**Props:**
- `data`: Object with defect types and counts

**Example:**
```jsx
<IssueDistributionChart 
  data={{ Dampness: 5, Leakage: 3, Cracks: 2 }} 
/>
```

#### TemperatureAnalysisChart
**Purpose:** Bar chart showing hotspot vs coldspot

**Props:**
- `data`: Object with `readings` array

**Example:**
```jsx
<TemperatureAnalysisChart 
  data={{
    readings: [
      { area: "Hall", hotspot: 26.5, coldspot: 21.2 }
    ]
  }} 
/>
```

#### SeverityChart
**Purpose:** Bar chart showing severity distribution

**Props:**
- `data`: Object with severity counts

**Example:**
```jsx
<SeverityChart 
  data={{ Minor: 10, Moderate: 20, Severe: 5 }} 
/>
```

---

## Pages

### Home Page (`/app/page.js`)
**Route:** `/`

**Features:**
- Header with logo and theme toggle
- Analytics button (Electric Yellow)
- Hero section with gradient title
- Two upload zones (Sample Report + Thermal Images)
- Three feature cards
- Footer: "Made by Gaurav Agrawal"

**Key Sections:**
1. Header (sticky)
2. Hero with title and description
3. Upload zones
4. Feature highlights
5. Footer

---

### Analytics Dashboard (`/app/dashboard/analytics/page.js`)
**Route:** `/dashboard/analytics`

**Features:**
- Header with Export button and theme toggle
- 4-column KPI cards
- Conflict alert (when applicable)
- Charts grid (2-column then full-width)
- Report summary section
- Empty state (when no reports)
- Footer: "Made by Gaurav Agrawal"

**Layout:**
1. Header (sticky)
2. KPI Cards row
3. Conflict Alert (conditional)
4. Charts grid
5. Summary section
6. Footer

---

## Database Schema

### MongoDB Collection: `reports`

```javascript
{
  _id: ObjectId,
  reportId: String,              // UUID
  
  propertyInfo: {
    type: String,                 // "Flat", "Villa", etc.
    floors: Number,
    inspectionDate: Date,
    inspector: String
  },
  
  visualObservations: [
    {
      pointNo: String,
      area: String,
      description: String,
      rooms: [String],
      defectType: String
    }
  ],
  
  thermalReadings: [
    {
      filename: String,
      date: String,
      hotspot: Number,
      coldspot: Number,
      emissivity: Number,
      reflectedTemp: Number
    }
  ],
  
  sampleImages: [
    {
      filename: String,
      path: String,
      page: Number,
      type: "visual"
    }
  ],
  
  thermalImages: [
    {
      filename: String,
      path: String,
      page: Number,
      type: "thermal"
    }
  ],
  
  mergedData: {
    propertyIssueSummary: String,
    areaWiseObservations: [
      {
        area: String,
        visualObservation: String,
        thermalReading: {
          hotspot: Number | "Not Available",
          coldspot: Number | "Not Available",
          analysis: String
        },
        defectType: String,
        severity: "Minor" | "Moderate" | "Severe",
        images: [String]
      }
    ],
    probableRootCause: String,
    severityAssessment: {
      overall: String,
      reasoning: String
    },
    recommendedActions: [String],
    additionalNotes: String,
    missingOrUnclearInfo: [String],
    dataConflicts: [String]
  },
  
  analytics: {
    totalAreas: Number,
    totalDefects: Number,
    issueDistribution: Object,
    severityDistribution: Object,
    temperatureStats: {
      avgHotspot: Number,
      avgColdspot: Number,
      maxHotspot: Number,
      minColdspot: Number,
      readings: [Object]
    }
  },
  
  status: "processing" | "completed" | "failed",
  createdAt: Date,
  updatedAt: Date
}
```

---

## PDF Generation

### Library: pdfkit

### Structure

#### Cover Page
```javascript
- Electric Yellow header (595x80px)
- Title: "DETAILED DIAGNOSIS REPORT"
- Subtitle: "Property Inspection & Thermal Analysis"
- Property details table
- Footer: "Made by Gaurav Agrawal"
```

#### Summary Page
```javascript
- Property Issue Summary (paragraph)
- Severity Assessment (color-coded badge)
- Probable Root Cause (paragraph)
- Recommended Actions (bullet list with yellow markers)
```

#### Area-wise Observations Pages
```javascript
For each observation:
  - Electric Blue header (595x25px) with area name
  - Visual Observation section
  - Thermal Analysis section
  - Defect Type & Severity
  - Divider line (slate-200)
  
Auto-pagination when y > 700
```

#### Analysis Page
```javascript
- Additional Notes
- Missing Information (amber markers if any)
- Data Conflicts (rose markers with rose divider if any)
```

#### Limitations Page
```javascript
- 6-point limitation list (yellow markers)
- Professional disclaimer
- Generator footer box with "Made by Gaurav Agrawal"
```

### Colors Used in PDF

- Header: `#FACC15` (Electric Yellow)
- Area Headers: `#3B82F6` (Electric Blue)
- Severity Badges:
  - Minor: `#2DD4BF` (Teal)
  - Moderate: `#F59E0B` (Amber)
  - Severe: `#FB7185` (Rose)
- Text: `#0F172A` (Slate-950) and `#334155` (Slate-700)
- Markers: `#FACC15` (Yellow bullets), `#FB7185` (Rose for conflicts)

---

## Installation & Setup

### Prerequisites
- Node.js 18+ (LTS)
- MongoDB running locally or connection string
- Git

### Environment Variables

Create `.env` file:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ddr_analytics
NEXT_PUBLIC_BASE_URL=https://your-domain.com
CORS_ORIGINS=*
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Installation Steps

```bash
# Clone repository
git clone https://github.com/Gaurav55-A/DDR-Analytics.git
cd DDR-Analytics

# Install dependencies
yarn install

# Start MongoDB (if local)
sudo systemctl start mongodb

# Run development server
yarn dev
```

Visit `http://localhost:3000`

### Production Build

```bash
# Build for production
yarn build

# Start production server
yarn start
```

---

## Usage Guide

### 1. Upload Reports

1. Navigate to homepage
2. Drag and drop OR click to upload:
   - **Sample Report**: Visual inspection PDF
   - **Thermal Images**: Thermal imaging PDF
3. Click "Generate DDR Report"
4. Wait for processing (30-60 seconds)
5. Success message appears with Report ID

### 2. View Analytics

1. Click "Analytics" button in header
2. View 4 KPI cards:
   - Health Index (overall property condition)
   - Total Defects (issues found)
   - Avg Hotspot (thermal data)
   - Total Areas (inspected areas)
3. Review conflict alerts (if any)
4. Analyze charts:
   - Issue Distribution (pie chart)
   - Severity Distribution (bar chart)
   - Temperature Analysis (bar chart)
5. Check Report Summary section

### 3. Export PDF

1. On Analytics Dashboard
2. Click "Export Report" button (Electric Yellow)
3. Wait for PDF generation
4. File downloads as `DDR_Report_{reportId}.pdf`
5. Open and review:
   - Cover page
   - Property Issue Summary
   - Area-wise Observations
   - Analysis & Recommendations
   - Limitations

### 4. Toggle Theme

1. Click Moon/Sun icon in header
2. Theme switches instantly
3. Preference saved to localStorage
4. All pages and charts adapt

---

## Testing

### Manual Testing Checklist

#### Home Page
- [ ] Page loads without errors
- [ ] Theme toggle works
- [ ] Upload zones accept PDF files
- [ ] Both files required before processing
- [ ] Progress indicator shows during upload
- [ ] Success message appears with Report ID
- [ ] "View Report" and "View Analytics" buttons work
- [ ] Footer shows "Made by Gaurav Agrawal"

#### Analytics Dashboard
- [ ] KPI cards display correct data
- [ ] Health Index calculates correctly
- [ ] Charts render with vibrant colors
- [ ] Conflict alert appears when applicable
- [ ] Export button visible when reports exist
- [ ] Export button downloads PDF
- [ ] Empty state shows when no reports
- [ ] Dark/Light mode works on all elements
- [ ] Footer shows "Made by Gaurav Agrawal"

#### PDF Export
- [ ] PDF downloads with correct filename
- [ ] Cover page has yellow header
- [ ] Property info is accurate
- [ ] Area-wise observations are complete
- [ ] Visual + Thermal data merged correctly
- [ ] Severity colors correct (Teal/Amber/Rose)
- [ ] Footer shows "Made by Gaurav Agrawal"
- [ ] All pages formatted professionally

#### API Testing

```bash
# Health check
curl http://localhost:3000/api/root

# Get analytics (empty state)
curl http://localhost:3000/api/analytics

# Get all reports
curl http://localhost:3000/api/reports

# Upload and process (use Postman or similar)
POST http://localhost:3000/api/process
Content-Type: multipart/form-data
Body: 
  - sampleReport: [PDF file]
  - thermalImages: [PDF file]

# Export PDF
POST http://localhost:3000/api/export-pdf
Content-Type: application/json
Body: { "reportId": "uuid" }
```

---

## Development Timeline

### Phase 1: Initial Setup (Day 1)
- ✅ Next.js 14 project initialization
- ✅ MongoDB connection setup
- ✅ shadcn/ui components installation
- ✅ Tailwind CSS configuration
- ✅ Basic file structure

### Phase 2: PDF Processing (Day 1-2)
- ✅ pdf-parse integration for text extraction
- ✅ pdf-lib integration for image extraction
- ✅ Thermal data parser (hotspot, coldspot, emissivity)
- ✅ Visual observation parser (rooms, defects)
- ✅ Image storage system

### Phase 3: AI Integration (Day 2)
- ✅ Anthropic Claude 3.5 Sonnet setup
- ✅ AI matching algorithm
- ✅ Strict data rules implementation
- ✅ Conflict detection logic
- ✅ JSON structure generation

### Phase 4: Analytics Dashboard (Day 2-3)
- ✅ KPI card component
- ✅ Recharts integration
- ✅ Issue Distribution chart
- ✅ Temperature Analysis chart
- ✅ Severity Distribution chart
- ✅ Aggregation logic

### Phase 5: Vibrant Design System (Day 3)
- ✅ Color architecture implementation
- ✅ Google Fonts (Plus Jakarta Sans + Inter)
- ✅ Dark/Light mode system
- ✅ Theme toggle component
- ✅ CSS custom properties
- ✅ Tailwind theme extension

### Phase 6: UI Refinement (Day 3-4)
- ✅ Home page hero section
- ✅ Upload zone with drag-drop
- ✅ Feature cards
- ✅ Conflict alert component
- ✅ Professional styling

### Phase 7: PDF Export (Day 4)
- ✅ pdfkit installation
- ✅ PDF generation engine
- ✅ Multi-page layout
- ✅ Color-coded sections
- ✅ Export API endpoint
- ✅ Download functionality

### Phase 8: Final Cleanup (Day 4)
- ✅ Removed showcase sections
- ✅ Updated footer to "Made by Gaurav Agrawal"
- ✅ Code cleanup
- ✅ Documentation
- ✅ Git commits

---

## Future Enhancements

### Planned Features

1. **Report Preview Page**
   - Route: `/report/[id]`
   - View generated DDR in browser
   - Print-friendly layout
   - Share functionality

2. **Multi-Report Comparison**
   - Side-by-side comparison
   - Trend analysis over time
   - Historical data visualization

3. **Export Options**
   - CSV export for analytics
   - Excel export with charts
   - JSON data export

4. **User Authentication**
   - Login/logout system
   - User-specific reports
   - Role-based access control
   - Team collaboration

5. **Template Customization**
   - Custom report templates
   - Brand logo upload
   - Color scheme customization
   - Header/footer customization

6. **Advanced Analytics**
   - Predictive analytics
   - Defect pattern recognition
   - Cost estimation
   - Priority recommendations

7. **Image Gallery**
   - View all extracted images
   - Image comparison (visual vs thermal)
   - Zoom and annotations
   - Image gallery export

8. **Notification System**
   - Email notifications
   - Report completion alerts
   - Conflict detection alerts
   - Weekly summary emails

9. **API Documentation**
   - Interactive API docs (Swagger)
   - Code examples
   - Webhook support
   - Rate limiting

10. **Mobile App**
    - React Native app
    - On-site photo upload
    - Offline mode
    - Push notifications

---

## Credits

**Developer:** Gaurav Agrawal

**AI Assistant:** Claude 3.5 Sonnet (Anthropic)

**Technologies:**
- Next.js (Vercel)
- MongoDB (MongoDB Inc.)
- Tailwind CSS (Tailwind Labs)
- shadcn/ui (shadcn)
- Recharts (Recharts team)
- pdfkit (pdfkit contributors)

---

## License

MIT License - See LICENSE file for details

---

## Contact

For questions or issues:
- GitHub: https://github.com/Gaurav55-A/DDR-Analytics
- Email: [Your email]

---

**Made by Gaurav Agrawal** 🚀

---

*Last Updated: March 31, 2025*
