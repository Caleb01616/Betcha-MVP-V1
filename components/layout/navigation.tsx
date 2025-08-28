'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomUser, clearStoredUser } from '@/lib/supabase/auth'
import { 
  Home, 
  Trophy, 
  Users, 
  Activity, 
  Wallet, 
  Settings, 
  LogOut, 
  User,
  Menu,
  X
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface NavigationProps {
  user: CustomUser | null
  walletBalance: number
}

export default function Navigation({ user, walletBalance }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    clearStoredUser()
    router.push('/login')
  }

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'Matches', href: '/matches', icon: Users },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Wallet', href: '/wallet', icon: Wallet },
  ]

  return (
    <nav className="bg-white border-b border-betcha-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="w-10 h-10 betcha-gradient rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-betcha-neutral-900">Betcha</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-betcha-neutral-600 hover:text-betcha-primary transition-colors duration-200 flex items-center space-x-2"
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="bg-betcha-success px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-white">
                {formatCurrency(walletBalance)}
              </span>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-betcha-neutral-700 hover:text-betcha-primary transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-betcha-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="font-medium">{user?.username || 'User'}</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-betcha-neutral-200 py-1">
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-betcha-neutral-700 hover:bg-betcha-neutral-50"
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-2 text-sm text-betcha-neutral-700 hover:bg-betcha-neutral-50"
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-betcha-neutral-700 hover:bg-betcha-neutral-50"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-betcha-neutral-700 hover:text-betcha-primary"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-betcha-neutral-200">
              {navigationItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-betcha-neutral-600 hover:text-betcha-primary hover:bg-betcha-neutral-50 rounded-md transition-colors duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon size={20} className="mr-3" />
                  <span>{item.name}</span>
                </a>
              ))}
              
              <div className="border-t border-betcha-neutral-200 pt-3 mt-3">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-betcha-neutral-600">Balance:</span>
                  <span className="text-sm font-medium text-betcha-success">
                    {formatCurrency(walletBalance)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 text-betcha-neutral-600 hover:text-betcha-primary hover:bg-betcha-neutral-50 rounded-md transition-colors duration-200"
                >
                  <LogOut size={20} className="mr-3" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
