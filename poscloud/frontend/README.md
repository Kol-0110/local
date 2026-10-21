# Cloud POS – Frontend

Next.js 15 App Router frontend for the Cloud POS restaurant management platform.

## Features
- **POS Register**: Order taking, split payments (Cash, EthQR, USSD Push, Card), receipts modal.
- **KDS (Kitchen Display System)**: Real-time ticket management with prep timers & status updates.
- **Table Management**: Interactive floor plan, seated time tracking, status toggling.
- **Waiter Dashboard**: Shift summary, waiter leaderboard, tips and commission insights.
- **Menu Management**: Categorized Ethiopian cuisine catalog, search, and availability toggle.
- **i18n Multi-language**: English, Amharic (አማርኛ), and Afaan Oromoo.
- **Dark/Light Mode**: Smooth industrial themes.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and set:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_RESTAURANT_NAME="BGS Restaurant & Lounge"
   ```

3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)
