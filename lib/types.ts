export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  display_name: string | null
  avatar_url: string | null
  total_balance: number
  total_winnings: number
  join_date: string
  is_active: boolean
}

export interface UserGameRating {
  id: string
  user_id: string
  game_id: string
  elo_rating: number
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  challenger_id: string
  opponent_id: string
  game_id: string
  status: 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled'
  bet_amount: number
  odds_challenger: number
  odds_opponent: number
  winner_id?: string
  created_at: string
  updated_at: string
  scheduled_at?: string
}

export interface Tournament {
  id: string
  name: string
  description: string
  game_id: string
  entry_fee: number
  prize_pool: number
  max_participants: number
  current_participants: number
  status: 'upcoming' | 'registration' | 'in_progress' | 'completed' | 'cancelled'
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface FeedActivity {
  id: string
  user_id: string
  activity_type: 'match_created' | 'match_won' | 'tournament_joined' | 'tournament_won' | 'achievement_earned'
  title: string
  description: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  transaction_type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'tournament_entry' | 'tournament_prize'
  amount: number
  balance_before: number
  balance_after: number
  reference_id?: string
  reference_type?: 'match' | 'tournament' | 'deposit' | 'withdrawal'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  created_at: string
}

export interface Game {
  id: string
  name: string
  description: string
  category: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
