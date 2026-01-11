# MediGuard Health System 🏥

**MediGuard** is a comprehensive healthcare management platform designed to bridge the gap between patients and doctors using modern web technologies and **Generative AI**. It features intelligent health analysis, appointment management, and digital medical records.

## 🚀 Key Features

### 🤖 AI-Powered Health Analysis
-   **Automated Insights**: Upload patient vitals (CSV) and get immediate risk assessment.
-   **Risk Scoring**: AI calculates a **Risk Score**, assigns a category (Low/High/Critical), and provides detailed reasoning.
-   **Smart Alerts**: High-risk patients are immediately prompted to "Find a Doctor".

### 🗓️ Appointment Management
-   **Doctor Directory**: Patients can browse doctors by specialization and visiting hours.
-   **Conflict Detection**: Smart system prevents double-booking of doctors at the same time.
-   **Dashboard**: Doctors can view upcoming appointments and patient details.

### 📋 Medical Records & Prescriptions
-   **Digital History**: Doctors can create clinical records including diagnosis, symptoms, and prescriptions.
-   **Print-Ready PDFs**: Patients can download or print professional prescription PDFs directly from their dashboard.

### 🛡️ Admin & Security
-   **Admin Dashboard**: Manage users, approve doctor accounts, and view system statistics.
-   **Role-Based Access**: Secure routing and data access for Patients, Doctors, and Admins.

---

## 🛠️ Technology Stack

### Frontend
-   **Framework**: [Next.js 14](https://nextjs.org/) (App Directory)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Shadcn UI](https://ui.shadcn.com/) & [Lucide React](https://lucide.dev/)
-   **Language**: TypeScript

### Backend
-   **Runtime**: Node.js & Express.js
-   **Language**: TypeScript
-   **Authentication**: JWT (JSON Web Tokens)
-   **AI Integration**: Google Gemini Pro (via `@google/generative-ai`)

### Database
-   **Relational (SQL)**: MySQL (Users, Appointments, Clinical Records)
-   **NoSQL**: MongoDB (Audit Logs, Vitals History, AI Insights)

---

## ⚙️ Installation & Setup

### prerequisites
-   Node.js (v18+)
-   MySQL Server
-   MongoDB (Local or Atlas)
-   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/1921-affan/MediGuard-System.git
cd MediGuard-System
```

### 2. Backend Setup
```bash
cd backend
npm install
```
**Configure Environment Variables**:
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=mediguard_db
MONGO_URI=mongodb://localhost:27017/mediguard
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

**Initialize Database**:
```bash
# This script creates all MySQL tables
npx ts-node src/scripts/setupDatabase.ts
```

**Run Server**:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The app will be running at `http://localhost:3000`.

---

## 📖 Usage Guide

### Creating an Admin Account
To access the Admin Dashboard, you need to promote a registered user to Admin status.
1.  Register a new user (or use an existing one).
2.  Run this backend script:
    ```bash
    cd backend
    npx ts-node scripts/create_admin.ts <user-email>
    ```

### Using AI Analysis
1.  Login as a **Patient**.
2.  Go to **Upload Vitals**.
3.  Upload a CSV file containing columns like `Heart_Rate`, `Systolic_BP`, `Sugar_Level`.
4.  View the generated **AI Risk Report**.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
