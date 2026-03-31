# DDR Genius - AI-Powered Diagnostic Reports

Transform raw property inspection PDFs into professional Detailed Diagnosis Reports (DDR) using AI-powered data matching and analysis.

## 🚀 Features

### 1. **Smart PDF Parsing**
- Extracts text content from both Sample Reports and Thermal Images PDFs
- Automatically extracts and stores images from PDFs
- Parses thermal data (hotspot, coldspot temperatures, emissivity, reflected temp)
- Identifies visual observations (room/area, defect types, descriptions)

### 2. **AI-Powered Data Matching**
- Uses **Claude 3.5 Sonnet** for intelligent merging of visual + thermal data
- Matches observations with thermal readings by room/area
- **Strict Data Rules:**
  - Missing data → "Not Available"
  - Missing images → "Image Not Available"
  - Conflicting data → Flagged and highlighted
  - No duplicate points
  - No invented facts

### 3. **Analytics Dashboard**
- **Issue Distribution Chart**: Pie chart showing defect types (Dampness, Leakage, Cracks, etc.)
- **Temperature Analysis**: Bar charts for hotspot/coldspot readings across areas
- **Severity Distribution**: Classification of issues by severity (Minor/Moderate/Severe)
- **Summary Statistics**: Total areas inspected, defects found, temperature averages

### 4. **Professional UI**
- **UrbanRoof-inspired design**: Dark blue/slate color palette
- Drag-and-drop file upload zones
- Real-time processing progress indicators
- Responsive, modern interface built with Next.js 14 + Tailwind CSS + shadcn/ui

## 🏗️ Architecture

```
DDR Genius
├── Frontend (Next.js 14 App Router)
│   ├── Home/Upload Page - Drag-drop PDF upload
│   ├── Analytics Dashboard - Recharts visualizations
│   └── Report Preview - Generated DDR (coming soon)
│
├── Backend (Next.js API Routes)
│   ├── /api/process - PDF processing & AI matching
│   ├── /api/reports - CRUD operations
│   └── /api/analytics - Aggregated analytics
│
├── AI Engine (Claude 3.5 Sonnet)
│   ├── PDF text extraction (pdf-parse)
│   ├── Image extraction (pdf-lib)
│   └── Intelligent data merging
│
└── Database (MongoDB)
    └── Collections: reports
```

## 📋 Mandatory DDR Sections

Generated reports include:

1. **Property Issue Summary** - Brief overview of all issues
2. **Area-wise Observations** - Detailed findings per room/area
3. **Probable Root Cause** - Analysis of underlying issues
4. **Severity Assessment** - Overall severity with reasoning
5. **Recommended Actions** - Prioritized repair recommendations
6. **Additional Notes** - Supplementary information
7. **Missing or Unclear Information** - Transparency about data gaps

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB
- **AI**: Anthropic Claude 3.5 Sonnet
- **PDF Processing**: pdf-parse, pdf-lib, sharp
- **Charts**: Recharts
- **UI Components**: Radix UI, Lucide Icons
- **File Upload**: react-dropzone

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Gaurav55-A/DDR-Analytics.git
cd DDR-Analytics

# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env and add:
# - MONGO_URL=mongodb://localhost:27017
# - DB_NAME=ddr_analytics
# - ANTHROPIC_API_KEY=your_api_key_here

# Run development server
yarn dev
```

Visit `http://localhost:3000`

## 🔧 Environment Variables

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ddr_analytics
NEXT_PUBLIC_BASE_URL=https://your-domain.com
CORS_ORIGINS=*
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## 📖 Usage

### 1. Upload PDFs
1. Navigate to the home page
2. Drag & drop or click to upload:
   - **Sample Report** (Visual inspection PDF)
   - **Thermal Images** (Thermal imaging data PDF)
3. Click "Generate DDR Report"

### 2. View Processing Results
- Real-time progress indicator shows processing status
- AI analyzes and matches data in ~30-60 seconds
- Success message displays with Report ID

### 3. Access Analytics
- Click "Analytics" button in header
- View aggregated insights across all processed reports
- Charts update automatically as new reports are processed

## 📊 Data Processing Flow

```
1. User uploads 2 PDFs
   ↓
2. Extract text from both PDFs (pdf-parse)
   ↓
3. Extract images from PDFs (pdf-lib)
   ↓
4. Parse thermal data (temp readings, dates, metadata)
   ↓
5. Parse visual observations (rooms, defects, descriptions)
   ↓
6. AI Matching (Claude 3.5 Sonnet)
   - Match observations by room/area
   - Detect conflicts
   - Flag missing data
   - Apply strict rules
   ↓
7. Generate analytics (aggregations, calculations)
   ↓
8. Save to MongoDB
   ↓
9. Return Report ID + Analytics
```

## 🎯 API Endpoints

### POST /api/process
Process uploaded PDFs and generate DDR.

**Request**: `multipart/form-data`
- `sampleReport`: PDF file
- `thermalImages`: PDF file

**Response**:
```json
{
  "reportId": "uuid",
  "message": "Report processed successfully",
  "analytics": { ... },
  "mergedData": { ... }
}
```

### GET /api/reports
Get all processed reports.

**Response**:
```json
[
  {
    "reportId": "uuid",
    "propertyInfo": { ... },
    "mergedData": { ... },
    "status": "completed",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/reports/:id
Get specific report by ID.

### GET /api/analytics
Get aggregated analytics across all reports.

**Response**:
```json
{
  "totalReports": 10,
  "totalAreas": 50,
  "totalDefects": 75,
  "issueDistribution": {
    "Dampness": 25,
    "Leakage": 20,
    "Cracks": 15,
    "Tile Issues": 15
  },
  "severityDistribution": {
    "Minor": 20,
    "Moderate": 40,
    "Severe": 15
  },
  "temperatureStats": {
    "avgHotspot": 26.5,
    "avgColdspot": 21.2,
    "maxHotspot": 28.8,
    "minColdspot": 20.1,
    "readings": [ ... ]
  }
}
```

## 🧪 Testing

The system has been tested with:
- ✅ Sample Report.pdf (UrbanRoof inspection report)
- ✅ Thermal Images.pdf (BOSCH GTC 400 C thermal data)
- ✅ Main DDR.pdf (Reference for output structure)

## 🚧 Roadmap

- [x] PDF parsing & image extraction
- [x] AI-powered data matching
- [x] Analytics dashboard
- [x] Home page with upload
- [ ] **PDF generation** (generate downloadable DDR PDF)
- [ ] **Report preview page** (view generated DDR in browser)
- [ ] **Multi-report comparison**
- [ ] **Export to Excel/CSV**
- [ ] **User authentication**
- [ ] **Report templates customization**

## 🎨 Design System

**Color Palette** (UrbanRoof-inspired):
- Background: `from-slate-900 via-blue-900 to-slate-900`
- Primary: Blue (`#3B82F6`)
- Secondary: Cyan (`#06B6D4`)
- Accent: Purple, Orange
- Text: Slate shades

**Typography**:
- Font: System font stack (optimized for web)
- Headers: Bold, large sizes
- Body: Regular, readable sizes

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Email: support@ddrgenius.com (placeholder)

---

**Built with ❤️ using Next.js, MongoDB & Claude AI**
