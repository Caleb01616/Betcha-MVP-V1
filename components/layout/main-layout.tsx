import Navigation from './navigation'
import { CustomUser } from '@/lib/supabase/auth'

interface MainLayoutProps {
  children: React.ReactNode
  user: CustomUser | null
  walletBalance: number
}

export default function MainLayout({ children, user, walletBalance }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-betcha-neutral-50">
      <Navigation user={user} walletBalance={walletBalance} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
