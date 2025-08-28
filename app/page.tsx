import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, TrendingUp, Shield, Zap, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-betcha-neutral-50 to-betcha-neutral-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="mx-auto mb-8 w-20 h-20 betcha-gradient rounded-2xl flex items-center justify-center">
              <span className="text-white text-4xl font-bold">B</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-betcha-neutral-900 mb-6">
              Bet on Your
              <span className="betcha-gradient bg-clip-text text-transparent"> Skills</span>
            </h1>
            <p className="text-xl text-betcha-neutral-600 mb-8 max-w-3xl mx-auto">
              The premier platform for skill-based gaming with American-style betting odds. 
              Challenge opponents, join tournaments, and win big with your gaming expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="betcha-button-primary text-lg px-8 py-4">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="betchaSecondary" className="text-lg px-8 py-4">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-betcha-neutral-900 mb-4">
              Why Choose Betcha?
            </h2>
            <p className="text-xl text-betcha-neutral-600 max-w-2xl mx-auto">
              Professional gaming platform designed for competitive players who want to monetize their skills.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="betcha-card text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-12 h-12 betcha-gradient rounded-lg flex items-center justify-center">
                  <Trophy className="text-white" size={24} />
                </div>
                <CardTitle>Tournaments</CardTitle>
                <CardDescription>
                  Compete in high-stakes tournaments with guaranteed prize pools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="betcha-card text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-12 h-12 betcha-gradient rounded-lg flex items-center justify-center">
                  <Users className="text-white" size={24} />
                </div>
                <CardTitle>1v1 Challenges</CardTitle>
                <CardDescription>
                  Challenge opponents directly with custom bet amounts and odds
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="betcha-card text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-12 h-12 betcha-gradient rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <CardTitle>Elo System</CardTitle>
                <CardDescription>
                  Fair matchmaking based on skill ratings for balanced competition
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="betcha-card text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-12 h-12 betcha-gradient rounded-lg flex items-center justify-center">
                  <Shield className="text-white" size={24} />
                </div>
                <CardTitle>Secure Platform</CardTitle>
                <CardDescription>
                  Bank-level security with encrypted transactions and data protection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="betcha-card text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-12 h-12 betcha-gradient rounded-lg flex items-center justify-center">
                  <Zap className="text-white" size={24} />
                </div>
                <CardTitle>Instant Payouts</CardTitle>
                <CardDescription>
                  Get your winnings immediately after match completion
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="betcha-card text-center">
              <CardHeader>
                <div className="mx-auto mb-4 w-12 h-12 betcha-gradient rounded-lg flex items-center justify-center">
                  <Star className="text-white" size={24} />
                </div>
                <CardTitle>Premium Experience</CardTitle>
                <CardDescription>
                  Professional UI inspired by leading financial and gaming platforms
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-betcha-primary to-betcha-primary-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of players who are already earning from their gaming skills.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-betcha-primary hover:bg-gray-100 text-lg px-8 py-4">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-betcha-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 betcha-gradient rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold">B</span>
                </div>
                <span className="text-xl font-bold">Betcha</span>
              </div>
              <p className="text-betcha-neutral-400">
                The premier platform for skill-based gaming and betting.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-betcha-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Tournaments</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Matches</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leaderboards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Games</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-betcha-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-betcha-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Responsible Gaming</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Age Verification</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-betcha-neutral-800 mt-8 pt-8 text-center text-betcha-neutral-400">
            <p>&copy; 2024 Betcha. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
