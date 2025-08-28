# Betcha - Skill-Based Gaming Platform

A professional web application for skill-based gaming with American-style betting odds. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **User Authentication**: Secure login/registration with Supabase Auth
- **Professional UI**: Inspired by leading financial and gaming platforms (Venmo, FanDuel, Robinhood)
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Real-time Data**: Live updates with Supabase real-time subscriptions
- **Type Safety**: Full TypeScript implementation
- **Modern Stack**: Next.js 14 with App Router

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#1e40af to #3b82f6) - Professional and trustworthy
- **Success**: Money green (#10b981) - Winning and positive actions
- **Warning**: Amber (#f59e0b) - Clear warning indicators
- **Danger**: Red (#ef4444) - Risk and loss indicators
- **Neutral**: Clean grays (#f8fafc to #0f172a) - Minimal backgrounds

### Design Inspiration
- **Venmo**: Clean, minimal social feed with simple white cards
- **FanDuel**: Professional sports betting interface with clear odds display
- **Robinhood**: Sleek financial UI with intuitive navigation

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd betcha-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secure_secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application expects the following Supabase tables:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  avatar_url TEXT,
  bio TEXT,
  elo_rating INTEGER DEFAULT 1200,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0
);
```

### Matches Table
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id),
  opponent_id UUID REFERENCES users(id),
  game_id UUID REFERENCES games(id),
  status TEXT DEFAULT 'pending',
  bet_amount DECIMAL(10,2) NOT NULL,
  odds_challenger DECIMAL(5,2) NOT NULL,
  odds_opponent DECIMAL(5,2) NOT NULL,
  winner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_at TIMESTAMP WITH TIME ZONE
);
```

### Additional Tables
- `user_game_ratings` - Per-game Elo ratings
- `tournaments` - Multi-player competitions
- `feed_activities` - Social features
- `wallet_transactions` - Financial tracking
- `games` - Available games

## 📁 Project Structure

```
betcha-web/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Protected dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── auth/             # Authentication components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── supabase/         # Supabase configuration
│   ├── utils.ts          # Utility functions
│   └── types.ts          # TypeScript types
├── hooks/                # Custom React hooks
├── public/               # Static assets
└── package.json          # Dependencies
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up the database tables (see schema above)
3. Configure Row Level Security (RLS) policies
4. Add your Supabase URL and keys to `.env.local`

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key for client-side
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations
- `NEXT_PUBLIC_APP_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secure random string for session encryption

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
npm start
```

## 🔒 Security Features

- **Authentication**: Supabase Auth with secure session management
- **Protected Routes**: Middleware-based route protection
- **Input Validation**: Client and server-side validation
- **SQL Injection Protection**: Supabase parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Supabase Auth handles CSRF tokens

## 🎯 Success Criteria

- [x] Next.js application starts without errors
- [x] Supabase connection works correctly
- [x] User registration creates entries in database
- [x] User login authenticates successfully
- [x] Protected dashboard accessible after login
- [x] Environment variables properly configured
- [x] TypeScript compilation successful
- [x] Responsive design renders correctly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@betcha.com or create an issue in the repository.

---

**Betcha** - Where skill meets opportunity. 🎮💰
