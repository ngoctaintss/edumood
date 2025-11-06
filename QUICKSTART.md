# 🚀 Quick Start Guide - Emotion School

## Prerequisites
✅ Node.js 18+ installed
✅ MongoDB installed and running
✅ OpenAI API key ready

---

## 5-Minute Setup

### 1️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```

### 2️⃣ Configure Environment
```bash
# Create .env file from example
cp .env.example .env

# Edit .env and add your keys
# Required: MONGODB_URI, JWT_SECRET, OPENAI_API_KEY
```

### 3️⃣ Seed Database
```bash
npm run seed
```

### 4️⃣ Start Backend
```bash
npm run dev
# Backend runs on http://localhost:5000
```

### 5️⃣ Install Frontend Dependencies (New Terminal)
```bash
cd ../frontend
npm install
```

### 6️⃣ Start Frontend
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### 7️⃣ Open Browser
Visit: **http://localhost:5173**

---

## 🔑 Test Logins

### Admin Dashboard
- Email: `admin@emotionschool.com`
- Password: `admin123`
- **Can**: Manage teachers, classes, rewards

### Teacher Dashboard
- Email: `sarah@emotionschool.com`
- Password: `teacher123`
- **Can**: Manage students, view analytics, get AI insights

### Student Dashboard
- Student ID: `STU0011` (or STU0012-STU0015, STU0021-STU0025)
- Password: `student123`
- **Can**: Submit emotions, earn points, redeem rewards

---

## 🎯 Test Flow

1. **Login as Student**
   - Select emotion (happy, sad, etc.)
   - Add optional message
   - Submit and earn 10 points!
   - Visit reward shop

2. **Login as Teacher**
   - Select a class
   - View student submission status
   - Click "AI Analysis" for insights
   - Export PDF report
   - Add/Edit/Delete students

3. **Login as Admin**
   - Create new teacher
   - Create new class
   - Assign teacher to class
   - Add rewards to shop
   - View global statistics

---

## 🛠️ Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod --dbpath=/path/to/data/db
```

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Kill process on port 5173
npx kill-port 5173
```

### OpenAI API Error
- Check your API key in `.env`
- Ensure you have credits in your OpenAI account
- The AI analysis will gracefully fail with a fallback message

### CORS Error
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default: `http://localhost:5173`

---

## 📦 Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 🎨 Customization Tips

### Change Color Scheme
Edit `frontend/tailwind.config.js` and `frontend/src/index.css`

### Adjust Point Rewards
Edit `backend/controllers/emotionController.js` line with points value

### Modify AI Prompts
Edit `backend/controllers/analyticsController.js` in `getAIAnalysis` function

### Add More Emotions
Update emotion list in `frontend/src/components/EmojiSelector.jsx`

---

## 📚 Key Files to Understand

- `backend/server.js` - Main server entry
- `backend/middleware/auth.js` - Authentication logic
- `frontend/src/context/AuthContext.jsx` - Global auth state
- `frontend/src/utils/api.js` - All API calls
- `frontend/src/pages/*Dashboard.jsx` - Role-specific pages

---

## 🆘 Need Help?

Check the main README.md for:
- Complete API documentation
- Detailed feature list
- Architecture overview
- Database schema

---

**Happy Coding! 🎉**
