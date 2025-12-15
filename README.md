# Massawa - Time Tracking System

A modern, mobile-first time tracking application built with Next.js 16, React 19, TypeScript, and Supabase. Perfect for restaurants and businesses to track employee work hours with geofencing and real-time updates.

## ✨ Features

### For Workers
- ⏰ **Clock In/Out** - Simple one-tap time tracking
- 📍 **Geofencing** - Automatic location verification (100m radius)
- 📊 **Statistics** - View weekly and monthly work hours
- 📱 **Mobile App Experience** - PWA support with bottom navigation
- 👤 **Profile Management** - Update name and avatar
- 📈 **Shift History** - View all past shifts with details

### For Admins
- 👥 **Employee Management** - View and manage all employees
- 📊 **Real-time Dashboard** - See active shifts in real-time
- 📈 **Analytics & Reports** - Weekly reports per employee
- 🔍 **Shift Management** - View, edit, and delete shifts
- 📱 **Employee Insights** - Detailed per-employee statistics
- 📥 **CSV Export** - Export data for external analysis

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Storage**: Supabase Storage
- **Charts**: Recharts
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- Git

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Eyobiel-12/awet-clok-system.git
   cd awet-clok-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Set up Supabase Database**
   
   Run the migrations in order:
   ```bash
   supabase db push --include-all
   ```
   
   Or manually run SQL scripts from `supabase/migrations/` in Supabase SQL Editor.

5. **Create Storage Bucket**
   
   In Supabase Dashboard:
   - Go to Storage
   - Create a new bucket named `avatars`
   - Set it as public
   - Configure policies (see `AVATAR_SETUP.md`)

6. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
time-tracking-system/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard pages
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # Worker dashboard pages
│   └── actions/            # Server actions
├── components/             # React components
│   ├── admin/              # Admin components
│   ├── dashboard/          # Worker dashboard components
│   └── ui/                 # Reusable UI components
├── lib/                    # Utility functions
├── supabase/              # Supabase migrations
│   └── migrations/        # Database migrations
└── public/                 # Static assets
```

## 🔐 Authentication

The app uses Supabase Authentication with email/password. Users are automatically assigned a `worker` role. To make a user an admin, update their profile in the database:

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
```

## 📱 Mobile Support

The app is fully optimized for mobile devices:
- **PWA Support** - Install as a native app
- **Bottom Navigation** - Easy mobile navigation
- **Touch Optimized** - 44px minimum touch targets
- **Safe Area Support** - Works on notched devices
- **Responsive Design** - Adapts to all screen sizes

## 🎨 Features in Detail

### Geofencing
- Employees must be within 100 meters of the restaurant to clock in
- Location is verified using GPS coordinates
- Distance is calculated using the Haversine formula

### Real-time Updates
- Admin dashboard shows active shifts in real-time
- Uses Supabase Realtime subscriptions
- Falls back to polling if Realtime is unavailable

### Role-Based Access
- **Worker**: Can clock in/out, view own statistics
- **Admin**: Full access to all features and employee management

## 📊 Database Schema

### Tables
- `profiles` - User profiles with roles
- `shifts` - Time tracking records
- `restaurant` - Restaurant location for geofencing

### Row Level Security (RLS)
- Workers can only view/edit their own data
- Admins can view/edit all data
- Policies are enforced at the database level

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Node.js

## 📝 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Eyobiel Goitom**
- GitHub: [@Eyobiel-12](https://github.com/Eyobiel-12)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📚 Documentation

- [Setup Guide](RUN_SETUP.md)
- [Supabase CLI Login](SUPABASE_CLI_LOGIN.md)
- [Avatar Setup](AVATAR_SETUP.md)
- [Test Results](TEST_RESULTS.md)

## 🐛 Known Issues

None at the moment! If you find any issues, please open an issue on GitHub.

## 🔮 Future Enhancements

- [ ] Push notifications for shift reminders
- [ ] Multi-location support
- [ ] Break time tracking
- [ ] Overtime calculations
- [ ] Integration with payroll systems
- [ ] Mobile app (React Native)

---

Made with ❤️ for efficient time tracking

