# Rail-Safe AI - Frontend

## 🚀 התקנה והפעלה

### דרישות מקדימות
- Node.js 18+
- npm או yarn או bun

### התקנה

```bash
# Clone the repository
git clone <your-repo-url>
cd rail-safe-frontend

# Install dependencies
npm install
```

### הגדרת משתני סביבה

צור קובץ `.env.local` בתיקיית הפרויקט:

```env
# Backend API URL - שנה לכתובת של ה-Spring Boot שלך
VITE_API_BASE_URL=http://localhost:8080

# Organization ID - אופציונלי, ניתן להגדיר דינמית
VITE_ORG_ID=your-organization-uuid
```

### הרצה

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 מבנה הפרויקט

```
src/
├── api/                    # שכבת API
│   ├── config.ts          # הגדרות והעזרים של ה-API
│   ├── types.ts           # טייפים שמתאימים ל-Backend Boundaries
│   ├── services/          # שירותי API לכל domain
│   │   ├── organizationService.ts
│   │   ├── riskService.ts
│   │   ├── taskService.ts
│   │   └── userService.ts
│   └── index.ts           # exports
│
├── hooks/                  # React Query hooks
│   ├── useRisks.ts        # hooks לסיכונים
│   ├── useTasks.ts        # hooks למשימות
│   └── useOrganization.ts # hooks לארגון
│
├── contexts/              # React Contexts
│   └── OrganizationContext.tsx
│
├── components/            # קומפוננטות UI
│   ├── layout/           # Sidebar, MainLayout
│   ├── dashboard/        # StatsCard, RiskMatrix, RecentRisks
│   ├── risks/            # RiskTable, RiskFilters, ImageUpload
│   └── ui/               # shadcn/ui components
│
├── pages/                 # דפי האפליקציה
│   ├── Dashboard.tsx
│   ├── RisksList.tsx
│   ├── NewRisk.tsx
│   └── RiskDetail.tsx
│
└── types/                 # טייפים נוספים
    └── risk.ts
```

## 🔗 חיבור ל-Backend

ה-Frontend מוגדר לעבוד עם ה-Spring Boot Backend שלך. נקודות הקצה:

### Organizations
- `POST /api/organizations/create` - יצירת ארגון
- `GET /api/organizations/{orgId}` - קבלת ארגון
- `GET /api/organizations/{orgId}/risk-matrix` - מטריצת סיכון
- `GET /api/organizations/{orgId}/categories` - קטגוריות

### Risks
- `POST /api/risks` - יצירת סיכון
- `GET /api/risks/{riskId}` - סיכון בודד
- `GET /api/risks?orgId=...&filters...` - רשימת סיכונים
- `PATCH /api/risks/{riskId}` - עדכון סיכון
- `PATCH /api/risks/{riskId}/status` - עדכון סטטוס
- `DELETE /api/risks/{riskId}` - מחיקת סיכון

### Tasks
- `POST /api/tasks` - יצירת משימה
- `GET /api/tasks?orgId=...` - רשימת משימות
- `PATCH /api/tasks/{taskId}/status` - עדכון סטטוס

### Users
- `POST /api/users` - יצירת משתמש
- `GET /api/users/{id}` - משתמש בודד
- `GET /api/users?orgId=...` - רשימת משתמשים

## 🎨 עיצוב

האפליקציה בנויה עם:
- **React + TypeScript**
- **Tailwind CSS** - עיצוב
- **shadcn/ui** - קומפוננטות UI
- **React Query** - ניהול state וקריאות API
- **React Router** - ניתוב

## 📱 תכונות

- ✅ לוח בקרה עם סטטיסטיקות
- ✅ מטריצת סיכון 4x4 אינטראקטיבית
- ✅ רשימת סיכונים עם פילטרים
- ✅ אשף יצירת סיכון (5 שלבים)
- ✅ העלאת תמונות עם זיהוי AI
- ✅ צילום ישיר ממצלמה
- ✅ תמיכה מלאה ב-RTL (עברית)

## 🔧 פיתוח ב-VSCode

### Extensions מומלצות
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Importer

### הרצה
```bash
code .  # פתח ב-VSCode
npm run dev  # הרץ development server
```

הפרויקט ירוץ על `http://localhost:5173`

## 🔄 CORS Configuration

אם אתה נתקל בבעיות CORS, הוסף את ההגדרה הבאה ב-Spring Boot:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173", "http://localhost:3000")
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```
