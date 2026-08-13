# Naskly CRM System

A comprehensive Client Relationship Management (CRM) web application designed for **Naskly**, featuring Supabase integration, real-time analytics dashboards, client & service management, automated delivery reminder notifications, and role-based staff access control.

---

## 🌟 Key Features

- **Dashboard & Analytics**: Real-time KPI statistics (Total Revenue, Active Services, Active Clients, Pending Deliveries) with intuitive visual cards.
- **Client & Service Management**: Full CRUD operations for tracking service requests, payment statuses, and project delivery schedules.
- **Role-Based Access Control (RBAC)**: Custom staff user authentication (`Admin` vs. `Staff` roles) powered by Supabase RLS. Financial metrics and administrative settings are restricted to privileged users.
- **Automated Delivery Alerts**: Global notification system and automated GitHub Actions scripts (`RminderEmail.txt`) for proactive client delivery follow-ups.
- **Modern UI & Aesthetic**: Dynamic Dark/Cyber UI built with clean vanilla CSS/JS, modular components, and responsive grid views.

---

## 📁 Repository Structure

```text
├── index.html          # Main Dashboard & Grid View Interface
├── dashboard.html      # Overview Analytics Page
├── login.html          # Staff & Admin Login Authentication Page
├── settings.html       # User & Staff Management (Admin Only)
├── schema.sql          # Supabase SQL Database Schema & RLS Setup
├── js/
│   ├── mainData.js     # Core CRM Data Handling & Supabase Sync
│   ├── auth.js         # Authentication, Roles, & Permissions
│   └── dashboard.js    # Dashboard Statistics & Visualizations
├── css/                # Custom Stylesheets & Design Systems
├── data/               # Static Data & Service Reference Definitions
└── scripts/            # Backend & Automation Scripts
```

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL & Authentication)
- **Automation**: GitHub Actions & Node.js scripts for automated email reporting

---

## 🚀 Setup & Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. **Database Configuration**:
   - Create a new project on [Supabase](https://supabase.com/).
   - Execute the SQL statements in [`schema.sql`](file:///d:/Projects/Mohand%20Naskly/CRM/Dashboard%26Gridview/schema.sql) in your Supabase SQL Editor to set up `app_users`, clients, and services tables with appropriate RLS policies.
   - Configure your Supabase URL and Anon Key in `js/auth.js` / `js/mainData.js`.

3. **Running Locally**:
   - Open `index.html` or `login.html` directly in your browser or run a simple local web server (e.g., using VS Code Live Server or `npx serve .`).

---

## 📧 Contact & Maintenance

Developed & Maintained by:
- **Email**: [mohammedreda301@gmail.com](mailto:mohammedreda301@gmail.com)
