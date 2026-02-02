# 📚 StudyBank

**Bank your focus. Earn your freedom.**

A gamified study hours tracking and banking system that helps you manage your time effectively. Study hard, bank your hours, and redeem them for guilt-free recreation time!

## ✨ Features

- ⏱️ **Active Study Timer** - Start, pause, and stop your study sessions with precision
- 🏦 **Hour Banking System** - Save your completed study hours to a personal bank
- 🎮 **Recreation Redemption** - Convert banked hours to recreation time at 0.4x multiplier (40%)
- 📊 **Comprehensive Metrics** - Track total study time, sessions, averages, streaks, and more
- 🎯 **Achievement System** - Unlock achievements as you hit milestones
- 💾 **Persistent Storage** - All your data is saved locally using localStorage
- 🎨 **Beautiful UI** - Cyberpunk-inspired design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Create your project structure:**

```bash
mkdir studybank
cd studybank
```

2. **Copy the project files:**

Place all the provided files in your project with this structure:

```
studybank/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── index.css
    ├── App.tsx
    └── App.css
```

3. **Install dependencies:**

```bash
npm install
```

4. **Start the development server:**

```bash
npm run dev
```

The app should automatically open in your browser at `http://localhost:3000`

## 📖 How to Use

### Study Timer
1. Click **Start** to begin a study session
2. Click **Pause** if you need a break (your time is saved)
3. Click **Stop** when you're done to save the session

### Banking Hours
1. After completing a study session, click **Bank Current Session**
2. Your session hours are now saved in your Hour Bank
3. Banked hours persist even after closing the app

### Redeeming Recreation Time
1. Enter the number of hours you want to redeem
2. Click **Redeem for Recreation Time**
3. You'll receive 40% of the hours as guilt-free recreation time
4. Example: Redeem 10 banked hours → Get 4 hours of recreation time

### Tracking Metrics
Monitor your progress with:
- Total study time and sessions
- Average session length
- Longest session record
- Weekly study hours
- Current study streak

### Achievements
Unlock achievements by:
- Completing your first session
- Reaching 10+ total study hours
- Maintaining a 7-day study streak
- Completing a 2+ hour marathon session

## 🛠️ Build Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 💾 Data Persistence

All your data is stored locally in your browser using `localStorage`. This means:
- ✅ Your data persists between sessions
- ✅ No account or login required
- ✅ Complete privacy - data never leaves your device
- ⚠️ Clearing browser data will reset your progress
- ⚠️ Data is specific to this browser on this device

## 🎨 Customization

You can customize the app by editing:
- **Colors**: Change CSS variables in `App.css` (lines 10-18)
- **Redemption multiplier**: Edit the multiplier value in `App.tsx` (default 0.4)
- **Fonts**: Update Google Fonts import in `index.css`

## 🤝 Tips for Success

1. **Be honest with yourself** - Only count genuine study time
2. **Take breaks** - Use the pause button for short breaks
3. **Set goals** - Try to maintain your study streak
4. **Redeem wisely** - Save up for meaningful recreation rewards
5. **Track trends** - Monitor your weekly hours to stay consistent

## 📝 License

This project is open source and available for personal use.

## 🙏 Acknowledgments

Built with React, TypeScript, and Vite for a smooth, modern development experience.

---

**Happy studying! 📖⚡**
