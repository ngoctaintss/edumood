# 🎓 Emotion School

**AI-Powered Emotion Tracking System for Elementary School Students**

A comprehensive fullstack web application that helps track and analyze student emotions, featuring role-based dashboards, AI-powered insights, and a gamified reward system.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-brightgreen)

---

## ✨ Features

### 🎯 Core Features
- **3 User Roles**: Student, Teacher, Admin with role-based access control
- **Emotion Tracking**: Students can submit their daily emotions with optional messages
- **AI Analysis**: OpenAI-powered emotional climate analysis with actionable suggestions
- **Gamification**: Students earn points for submissions and can redeem rewards
- **Analytics Dashboard**: Beautiful charts and visualizations using Recharts
- **PDF Export**: Generate emotion reports for classes
- **Beautiful UI**: Glassmorphism design with GSAP and Framer Motion animations

### 👩‍🎓 Student Features
- Daily emotion submission (😊 😐 😔 😡 😴)
- Energy Points system
- Reward shop with redemption
- Confetti animation on submission
- Points tracking

### 👩‍🏫 Teacher Features
- Multi-class management
- Student CRUD operations
- Emotion analytics with charts
- AI-powered class insights
- Daily submission tracking
- PDF report export

### 🧑‍💼 Admin Features
- Teacher management (CRUD)
- Class management (CRUD)
- Reward shop management (CRUD)
- Global statistics dashboard
- Teacher-class assignments

---

## 🛠️ Technology Stack

### Frontend
- **React 18.2** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **GSAP 3.12** - Advanced animations
- **Framer Motion** - Micro-interactions
- **Recharts** - Data visualization
- **jsPDF** - PDF generation
- **Axios** - HTTP client
- **React Router DOM** - Routing
- **Canvas Confetti** - Celebration effects

### Backend
- **Node.js + Express** - Server framework
- **MongoDB + Mongoose** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **OpenAI API** - AI analysis
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6+ (local or Atlas)
- OpenAI API key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd emotion-school
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/emotion-school
JWT_SECRET=your_super_secret_jwt_key_here
OPENAI_API_KEY=sk-your-openai-api-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Seed the Database:**
```bash
npm run seed
```

**Start the Backend:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

---

## 🔑 Default Login Credentials

After running the seed script, use these credentials:

### Admin
- **Email**: `admin@emotionschool.com`
- **Password**: `admin123`

### Teachers
- **Email**: `sarah@emotionschool.com` or `david@emotionschool.com`
- **Password**: `teacher123`

### Students
- **Student ID**: `STU0011` to `STU0015` (Class 3A)
- **Student ID**: `STU0021` to `STU0025` (Class 4B)
- **Password**: `student123`

---

## 📁 Project Structure

```
emotion-school/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── seed.js          # Database seeding
│   ├── server.js        # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── context/     # React Context
    │   ├── pages/       # Page components
    │   ├── utils/       # API utilities
    │   ├── App.jsx      # Main app component
    │   ├── main.jsx     # Entry point
    │   └── index.css    # Global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - Login (all roles)
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students/class/:classId` - Get students by class
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Teachers
- `GET /api/teachers` - Get all teachers (Admin)
- `POST /api/teachers` - Create teacher (Admin)
- `PUT /api/teachers/:id` - Update teacher (Admin)
- `DELETE /api/teachers/:id` - Delete teacher (Admin)

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create class (Admin)
- `PUT /api/classes/:id` - Update class (Admin)
- `DELETE /api/classes/:id` - Delete class (Admin)
- `PUT /api/classes/:id/assign-teacher` - Assign teacher (Admin)

### Emotions
- `POST /api/emotions` - Submit emotion (Student)
- `GET /api/emotions/class/:classId` - Get class emotions
- `GET /api/emotions/check/:studentId` - Check today's submission

### Rewards
- `GET /api/rewards` - Get all rewards
- `POST /api/rewards` - Create reward (Admin)
- `PUT /api/rewards/:id` - Update reward (Admin)
- `DELETE /api/rewards/:id` - Delete reward (Admin)
- `POST /api/rewards/redeem` - Redeem reward (Student)

### Analytics
- `GET /api/analytics/class/:classId` - Get class analytics
- `POST /api/analytics/ai` - Get AI analysis (Teacher)
- `GET /api/analytics/global` - Get global stats (Admin)

---

## 🎨 Design System

### Color Palette
- **Primary Gradient**: Purple (#9B5DE5) to Pink (#F15BB5) to Blue (#00BBF9)
- **Glass Effects**: White with 10% opacity, 20px blur
- **Text**: White with varying opacity

### Animations
- **GSAP**: Page transitions, stagger effects, complex animations
- **Framer Motion**: Hover effects, micro-interactions, scale animations
- **Custom**: Float, glow, shimmer keyframe animations

---

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcryptjs (10 salt rounds)
- Role-based authorization middleware
- Helmet security headers
- CORS configuration
- API rate limiting (100 requests per 15 minutes)
- Input validation and sanitization

---

## 📊 Database Schema

### Collections
1. **students** - Student accounts and points
2. **teachers** - Teacher accounts
3. **admins** - Admin accounts
4. **classes** - Class information
5. **emotions** - Emotion submissions
6. **rewards** - Shop items
7. **rewardredemptions** - Redemption tracking

---

## 🤖 AI Integration

The system uses OpenAI's GPT-4o-mini model to:
- Analyze emotion distributions
- Identify patterns in student messages
- Generate actionable suggestions for teachers
- Provide empathetic, education-focused insights

**Sample AI Output:**
```
Summary: 42% of students feel tired or sad. Common themes include homework stress and lack of sleep.

Suggestions:
1. Consider reducing homework load this week
2. Implement a 5-minute mindfulness break mid-class
3. Encourage proper sleep hygiene in parent communications
4. Plan a fun, energizing outdoor activity
```

---

## 📈 Future Enhancements

- [ ] Email notifications for teachers
- [ ] Parent portal for viewing child's emotions
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced analytics with trend predictions
- [ ] Integration with school management systems
- [ ] Emotion history timeline for students
- [ ] Teacher collaboration features

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 📧 Support

For questions or support, please open an issue on GitHub.

---

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Anthropic Claude for development assistance
- All open-source libraries used in this project

---

**Built with ❤️ for better emotional wellbeing in schools**
