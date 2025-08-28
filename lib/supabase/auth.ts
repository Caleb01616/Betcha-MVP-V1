import { createClient } from './client'
import bcrypt from 'bcryptjs'

export interface CustomUser {
  id: string
  username: string
  email: string
  display_name: string | null
  avatar_url: string | null
  total_balance: number
  total_winnings: number
  join_date: string
  is_active: boolean
}

export interface UserEloRating {
  user_id: string
  game_type: string
  elo_rating: number
  games_played: number
}

export async function registerUser(username: string, email: string, password: string) {
  try {
    const supabase = createClient()
    
    // Hash password
    const password_hash = await bcrypt.hash(password, 10)
    
    // Insert into custom users table
    const { data, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password_hash,
        display_name: username,
        total_balance: 500.00 // Starting balance
      }])
      .select()
      .single()

    if (error) throw error
    
    // Remove password_hash from returned data
    const { password_hash: _unused, ...userData } = data
    return { user: userData as CustomUser, error: null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Registration failed'
    return { user: null, error: errorMessage }
  }
}

export async function loginUser(username: string, password: string) {
  try {
    const supabase = createClient()
    
    // Get user from custom table
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }

    // Remove password_hash from returned data
    const { password_hash: _unused, ...userData } = user
    return { user: userData as CustomUser, error: null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Login failed'
    return { user: null, error: errorMessage }
  }
}

export async function getUserById(id: string) {
  try {
    const supabase = createClient()
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      throw new Error('User not found')
    }

    // Remove password_hash from returned data
    const { password_hash: _unused, ...userData } = user
    return { user: userData as CustomUser, error: null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get user'
    return { user: null, error: errorMessage }
  }
}

export async function getUserEloRatings(userId: string) {
  try {
    const supabase = createClient()
    
    const { data: ratings, error } = await supabase
      .from('user_game_ratings')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    
    return { ratings: ratings as UserEloRating[], error: null }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get Elo ratings'
    return { ratings: [], error: errorMessage }
  }
}

export function getStoredUser(): CustomUser | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userData = localStorage.getItem('betcha_user')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

export function storeUser(user: CustomUser) {
  if (typeof window === 'undefined') return
  
  localStorage.setItem('betcha_user', JSON.stringify(user))
}

export function clearStoredUser() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('betcha_user')
}
