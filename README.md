# Internship Matching & Recommendation Platform

This is a comprehensive platform designed to connect students with relevant internship opportunities using an AI/ML-based recommendation engine. It supports real-world data fetching using custom web scrapers, and features dedicated dashboards for Students, Coordinators, Supervisors, and Organizations.

## Technology Stack

- **Backend:** Python, Django, Django REST Framework
- **Machine Learning:** Scikit-Learn, Pandas, PyPDF2 (for Resume/PDF text extraction)
- **Database:** SQLite (default)
- **Frontend:** React.js, Material UI (MUI)

## Project Features

- **ML-Powered Recommendations:** Analyzes a student's resume (PDF) and manually inputted skills using Scikit-Learn to provide real-time internship match scores.
- **Live Job Scraper:** Automates the collection of live internship postings from Nigerian job portals (e.g., MyJobMag, Jobberman) straight into the platform.
- **Role-based Dashboards:** Dedicated interactive dashboards for Students, IT/School Coordinators, Organizations, and Supervisors.

---

## 🛠️ Local Development Setup

Follow these steps to get the project running locally.

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Python 3.8+**
- **Node.js 16+** & **npm**
- **Git**

### 2. Backend Setup (Django API + ML)

Open a terminal and navigate to the root directory of the project, then enter the `backend` folder:

```bash
cd backend
```

**Create and activate a virtual environment:**
```bash
# On Linux/macOS
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

**Install backend dependencies:**
```bash
pip install -r requirements.txt
```

**Run database migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Seed the database with test data (Optional but recommended):**
```bash
python seed_data.py
```

**Fetch live internship data using the Scraper:**
*This will pull live job listings from the internet to populate the discovery page.*
```bash
python manage.py scrape_internships --pages 2
```

**Start the Backend Development Server:**
```bash
python manage.py runserver 0.0.0.0:8000
```
*The API is now running at `http://localhost:8000/`*

---

### 3. Frontend Setup (React)

Open a **new terminal window**, navigate to the project root, and then enter the `frontend` folder:

```bash
cd frontend
```

**Install Node dependencies:**
```bash
npm install
```

**Start the Frontend Development Server:**
```bash
npm start
```
*The React application will automatically open in your browser at `http://localhost:3000/`*

---

## 📁 System Architecture Overview

### `/backend/`
- Contains all Django apps (`accounts`, `organizations`, `placements`, `recommendations`, `students`, `supervision`).
- `/backend/ml/` houses the recommendation module (`predict.py`) and cached model files (`.pkl`).
- `/backend/apps/organizations/scraper.py` handles live web scraping.

### `/frontend/`
- Standard React architecture.
- `/src/pages/` includes major interactive UI components like `DiscoveryPage.js` (Handles Resume Uploading & Live ML querying), `CoordinatorDashboard.js`, etc.
- `/src/components/` includes reusable chart and standard generic UI elements.

## 🤝 Contributing

When contributing, please ensure:
1. All changes are thoroughly tested locally.
2. If adding new Python packages, update the `requirements.txt`.
3. If altering ML models, please re-train using the backend `retrain_models` command.
