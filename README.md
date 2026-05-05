# FokusMode

FokusMode is a productivity dashboard designed to help you master your time. Built with **React 19**, **Convex**, and **Tailwind CSS 4**, it combines aesthetic glassmorphism with robust session tracking to provide a professional deep-work environment.

<img width="3556" height="2092" alt="fokusmode-web-homepage" src="https://github.com/user-attachments/assets/0fb60a2e-807a-44aa-9fd3-38d486f32796" />


## 🚀 Features

- **Dynamic Pomodoro Timer**: Seamlessly switch between Focus and Break modes with customizable durations.
- **Smart Browser Tab Integration**: Real-time timer updates in your browser tab title, optimized for zero CPU overhead.
- **Interactive Calendar**: Visualize your work history with a powerful calendar view powered by `react-big-calendar`.
- **Deep Analytics**: Track your focus streaks, daily progress, and tag-based productivity breakdowns with interactive charts.
- **Distraction Management**: Log and categorize distractions in real-time to identify and eliminate productivity leaks.
- **Premium Design**: A state-of-the-art dark mode interface featuring glassmorphism, fluid animations, and high-fidelity iconography.
- **System Performance Monitor**: Built-in debug overlay to track FPS, memory usage, and blocking tasks.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Backend**: [Convex](https://convex.dev/) (Real-time Database & Cloud Functions)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Shadcn UI](https://ui.shadcn.com/)
- **Charts & Data**: [Recharts](https://recharts.org/), [date-fns](https://date-fns.org/)
- **Calendar**: [React Big Calendar](https://jquense.github.io/react-big-calendar/)

## 📂 Project Structure

```bash
fokusmode-web/
├── convex/             # Backend schema, functions, and seed data
├── src/
│   ├── components/     # Reusable UI components (Shadcn, Debug, Layout)
│   ├── context/        # Core state management (TimerContext)
│   ├── hooks/          # Custom logic (useTimer, usePerformance, useTimerSound)
│   ├── lib/            # Utilities and helper functions
│   └── pages/          # Main application views (Focus, Calendar, Stats, etc.)
└── public/             # Static assets
```

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- A [Convex](https://convex.dev/) account

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:ShadyXV/fokusmode-web.git
   cd fokusmode-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

1. Start the Convex backend in a separate terminal:
   ```bash
   npx convex dev
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`.

## 📈 Performance Optimization

FokusMode is engineered for efficiency:
- **Low CPU Footprint**: Smart title updates only fire when the text content changes, preventing browser thread saturation.
- **Audio Singleton**: Shared `AudioContext` prevents browser memory limits and ensures reliable notification sounds.
- **Memoized Analytics**: Heavy statistical calculations are cached using `useMemo` with stable timestamp references.

## 📄 License

This project is private and intended for personal use.

---

Built with ❤️ for focused work.
