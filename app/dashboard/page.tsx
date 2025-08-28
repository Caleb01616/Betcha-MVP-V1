'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomUser, getStoredUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/client'
import MainLayout from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, TrendingUp, Users, Wallet, Activity, Plus, Gamepad2, Clock, MessageSquare, CheckCircle, CreditCard, Building2, Smartphone, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ChallengeData {
  id: string
  challenger_id: string
  challenged_id: string
  game_type: string
  stake_amount: number
  challenger_odds: string
  challenged_odds?: string
  status: string
  created_at: string
  challenger_name?: string
  challenged_name?: string
  current_responder_id?: string
  challenger_result?: string
  challenged_result?: string
  result_status?: string
  dispute_count?: number
  final_winner_id?: string
  completed_at?: string
}

interface OrganizedChallenges {
  challengesSent: ChallengeData[]
  challengeRequests: ChallengeData[]
  activeMatches: ChallengeData[]
  inNegotiation: ChallengeData[]
}

const AVAILABLE_GAMES = [
  { id: 'fifa', name: 'FIFA', icon: '⚽' },
  { id: '2k', name: 'NBA 2K', icon: '🏀' },
  { id: 'madden', name: 'Madden', icon: '🏈' }
]

const PAYMENT_METHODS = {
  deposit: [
    { id: 'credit_card', name: 'Credit/Debit Card', icon: CreditCard, fee: '2.9% + $0.30' },
    { id: 'bank_account', name: 'Bank Account', icon: Building2, fee: 'Free' },
    { id: 'paypal', name: 'PayPal', icon: Smartphone, fee: '2.9% + $0.30' },
    { id: 'apple_pay', name: 'Apple Pay', icon: Smartphone, fee: '2.9% + $0.30' }
  ],
  withdraw: [
    { id: 'bank_account', name: 'Bank Transfer', icon: Building2, fee: 'Free', time: '3-5 business days' },
    { id: 'paypal', name: 'PayPal', icon: Smartphone, fee: '$0.25', time: 'Instant' },
    { id: 'venmo', name: 'Venmo', icon: Smartphone, fee: 'Free', time: 'Instant' }
  ]
}

export default function DashboardPage() {
  const [user, setUser] = useState<CustomUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [challenges, setChallenges] = useState<OrganizedChallenges>({
    challengesSent: [],
    challengeRequests: [],
    activeMatches: [],
    inNegotiation: []
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showResultModal, setShowResultModal] = useState<string | null>(null)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  
  // Enhanced wallet state
  const [showWalletModal, setShowWalletModal] = useState<'deposit' | 'withdraw' | null>(null)
  const [walletAmount, setWalletAmount] = useState<string>('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    zip: ''
  })
  const [bankDetails, setBankDetails] = useState({
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking'
  })
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const organizeChallenges = (allChallenges: ChallengeData[], currentUserId: string): OrganizedChallenges => {
    return {
      challengesSent: allChallenges.filter(c => 
        c.challenger_id === currentUserId && 
        c.status === 'negotiating' && 
        (!c.current_responder_id || c.current_responder_id === c.challenged_id)
      ),
      challengeRequests: allChallenges.filter(c => 
        c.challenged_id === currentUserId && 
        c.status === 'negotiating' && 
        (!c.current_responder_id || c.current_responder_id === currentUserId)
      ),
      activeMatches: allChallenges.filter(c => 
        (c.challenger_id === currentUserId || c.challenged_id === currentUserId) && 
        c.status === 'accepted'
      ),
      inNegotiation: allChallenges.filter(c => 
        (c.challenger_id === currentUserId || c.challenged_id === currentUserId) && 
        c.status === 'counter_offer'
      )
    }
  }

  const fetchAllChallenges = async (userId: string) => {
    try {
      console.log('Fetching challenges for user:', userId)
      
      const { data: challengeData, error: challengesError } = await supabase
        .from('matches')
        .select('*')
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (challengesError) {
        console.error('Error fetching challenges:', challengesError)
        return
      }

      console.log('Raw challenge data:', challengeData)

      if (challengeData && challengeData.length > 0) {
        const userIds = Array.from(new Set([
          ...challengeData.map(c => c.challenger_id),
          ...challengeData.map(c => c.challenged_id)
        ]))

        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, display_name')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return
        }

        const challengesWithUsers: ChallengeData[] = challengeData.map(challenge => ({
          ...challenge,
          challenger_name: users?.find(u => u.id === challenge.challenger_id)?.display_name || 
                          users?.find(u => u.id === challenge.challenger_id)?.username || 
                          'Unknown',
          challenged_name: users?.find(u => u.id === challenge.challenged_id)?.display_name || 
                          users?.find(u => u.id === challenge.challenged_id)?.username || 
                          'Unknown'
        }))

        const organized = organizeChallenges(challengesWithUsers, userId)
        console.log('Organized challenges:', organized)
        setChallenges(organized)
        setLastUpdate(new Date())
      } else {
        console.log('No challenges found')
        setChallenges({
          challengesSent: [],
          challengeRequests: [],
          activeMatches: [],
          inNegotiation: []
        })
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error in fetchAllChallenges:', error)
    }
  }

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const recordTransaction = async (
    type: 'deposit' | 'withdrawal' | 'bet_stake' | 'bet_payout' | 'refund',
    amount: number,
    description: string,
    matchId?: string,
    referenceId?: string
  ) => {
    try {
      // Check if transactions table exists before attempting insert
      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .limit(1)

      if (error && error.code === '42P01') {
        // Table doesn't exist, skip transaction logging
        console.log('Transactions table not found, skipping transaction log')
        return
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user?.id,
          type,
          amount,
          description,
          match_id: matchId,
          reference_id: referenceId,
          status: 'completed'
        }])

      if (insertError) {
        console.warn('Failed to record transaction:', insertError.message)
        // Don't throw error - transaction logging is optional
      } else {
        console.log(`Transaction recorded: ${type} - ${description}`)
      }
    } catch (error) {
      console.warn('Error recording transaction:', error)
      // Transaction logging failure shouldn't break the main flow
    }
  }

  const simulatePaymentProcessing = (amount: number, method: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simulate processing time (2-3 seconds)
      const processingTime = 2000 + Math.random() * 1000
      setTimeout(() => {
        // 95% success rate for mock payments
        const success = Math.random() > 0.05
        resolve(success)
      }, processingTime)
    })
  }

  const handleDeposit = async () => {
    if (!user || !walletAmount || !selectedPaymentMethod) return

    const amount = parseFloat(walletAmount)
    if (amount <= 0 || amount > 10000) {
      alert('Invalid amount. Please enter between $0.01 and $10,000')
      return
    }

    setActionLoading('deposit')
    try {
      // Simulate payment processing
      const paymentSuccess = await simulatePaymentProcessing(amount, selectedPaymentMethod)
      
      if (!paymentSuccess) {
        throw new Error('Payment processing failed. Please try again.')
      }

      const newBalance = user.total_balance + amount
      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          total_balance: newBalance,
          lifetime_deposits: ((user as any).lifetime_deposits || 0) + amount
        })
        .eq('id', user.id)

      if (balanceError) throw balanceError

      const paymentMethodName = PAYMENT_METHODS.deposit.find(m => m.id === selectedPaymentMethod)?.name || selectedPaymentMethod
      
      await recordTransaction(
        'deposit',
        amount,
        `Deposit via ${paymentMethodName}`,
        undefined,
        `${selectedPaymentMethod}_${Date.now()}`
      )

      setUser({ ...user, total_balance: newBalance })
      await fetchTransactions(user.id)

      setShowWalletModal(null)
      setWalletAmount('')
      setSelectedPaymentMethod('')
      setShowPaymentForm(false)
      resetPaymentForms()
      alert(`Successfully deposited ${formatCurrency(amount)} via ${paymentMethodName}`)

    } catch (error: any) {
      console.error('Error processing deposit:', error)
      alert(`Failed to process deposit: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleWithdrawal = async () => {
    if (!user || !walletAmount || !selectedPaymentMethod) return

    const amount = parseFloat(walletAmount)
    if (amount <= 0) {
      alert('Invalid withdrawal amount')
      return
    }

    if (amount > user.total_balance) {
      alert('Insufficient funds for withdrawal')
      return
    }

    const minWithdrawal = 5.00
    if (amount < minWithdrawal) {
      alert(`Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}`)
      return
    }

    setActionLoading('withdrawal')
    try {
      const paymentMethodInfo = PAYMENT_METHODS.withdraw.find(m => m.id === selectedPaymentMethod)
      
      const { error: withdrawalError } = await supabase
        .from('pending_withdrawals')
        .insert([{
          user_id: user.id,
          amount,
          payment_method: selectedPaymentMethod,
          payment_details: {
            method: selectedPaymentMethod,
            estimated_time: paymentMethodInfo?.time || '3-5 business days'
          },
          status: 'pending'
        }])

      if (withdrawalError) throw withdrawalError

      const newBalance = user.total_balance - amount
      const newPendingBalance = ((user as any).pending_balance || 0) + amount

      const { error: balanceError } = await supabase
        .from('users')
        .update({ 
          total_balance: newBalance,
          pending_balance: newPendingBalance
        })
        .eq('id', user.id)

      if (balanceError) throw balanceError

      await recordTransaction(
        'withdrawal',
        amount,
        `Withdrawal via ${paymentMethodInfo?.name || selectedPaymentMethod}`,
        undefined,
        `withdrawal_${Date.now()}`
      )

      setUser({ 
        ...user, 
        total_balance: newBalance,
        pending_balance: newPendingBalance
      } as any)
      await fetchTransactions(user.id)

      setShowWalletModal(null)
      setWalletAmount('')
      setSelectedPaymentMethod('')
      setShowPaymentForm(false)
      resetPaymentForms()
      
      const timeframe = paymentMethodInfo?.time || '3-5 business days'
      alert(`Withdrawal request submitted for ${formatCurrency(amount)}. Funds will be processed within ${timeframe}.`)

    } catch (error: any) {
      console.error('Error processing withdrawal:', error)
      alert(`Failed to process withdrawal: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const resetPaymentForms = () => {
    setCardDetails({
      number: '',
      expiry: '',
      cvc: '',
      name: '',
      zip: ''
    })
    setBankDetails({
      routingNumber: '',
      accountNumber: '',
      accountType: 'checking'
    })
  }

  const closeWalletModal = () => {
    setShowWalletModal(null)
    setWalletAmount('')
    setSelectedPaymentMethod('')
    setShowPaymentForm(false)
    resetPaymentForms()
  }

  const calculateWinnings = (stakeAmount: number, odds: string): number => {
    const oddsNum = parseInt(odds)
    
    if (oddsNum > 0) {
      return (stakeAmount * oddsNum) / 100
    } else {
      return stakeAmount / (Math.abs(oddsNum) / 100)
    }
  }

  const updateEloRatings = async (
    winnerId: string, 
    loserId: string, 
    gameType: string,
    matchId: string
  ) => {
    try {
      console.log(`Updating Elo ratings for match ${matchId}`)
      
      // Fetch current ratings for both players
      const { data: ratings, error: fetchError } = await supabase
        .from('user_game_ratings')
        .select('user_id, elo_rating, games_played, wins, losses, current_win_streak')
        .eq('game_type', gameType)
        .in('user_id', [winnerId, loserId])

      if (fetchError) {
        console.error('Error fetching ratings:', fetchError)
        throw fetchError
      }

      // Get or create ratings for both players
      let winnerRating = ratings?.find(r => r.user_id === winnerId) || {
        user_id: winnerId,
        elo_rating: 1200,
        games_played: 0,
        wins: 0,
        losses: 0,
        current_win_streak: 0
      }

      let loserRating = ratings?.find(r => r.user_id === loserId) || {
        user_id: loserId,
        elo_rating: 1200,
        games_played: 0,
        wins: 0,
        losses: 0,
        current_win_streak: 0
      }

      // Calculate K-factor based on games played
      const getKFactor = (gamesPlayed: number): number => {
        if (gamesPlayed < 30) return 32  // New players
        return 16  // Established players
      }

      const winnerKFactor = getKFactor(winnerRating.games_played)
      const loserKFactor = getKFactor(loserRating.games_played)

      // Calculate expected scores
      const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserRating.elo_rating - winnerRating.elo_rating) / 400))
      const expectedLoserScore = 1 - expectedWinnerScore

      // Calculate new ratings
      const newWinnerRating = Math.round(winnerRating.elo_rating + winnerKFactor * (1 - expectedWinnerScore))
      const newLoserRating = Math.round(loserRating.elo_rating + loserKFactor * (0 - expectedLoserScore))

      // Update winner stats
      const winnerUpdateData = {
        user_id: winnerId,
        game_type: gameType,
        elo_rating: Math.max(100, newWinnerRating), // Minimum rating of 100
        games_played: winnerRating.games_played + 1,
        wins: winnerRating.wins + 1,
        losses: winnerRating.losses,
        current_win_streak: winnerRating.current_win_streak + 1
      }

      // Update loser stats
      const loserUpdateData = {
        user_id: loserId,
        game_type: gameType,
        elo_rating: Math.max(100, newLoserRating), // Minimum rating of 100
        games_played: loserRating.games_played + 1,
        wins: loserRating.wins,
        losses: loserRating.losses + 1,
        current_win_streak: 0 // Reset win streak
      }

      // Upsert winner rating
      const { error: winnerError } = await supabase
        .from('user_game_ratings')
        .upsert(winnerUpdateData, {
          onConflict: 'user_id,game_type'
        })

      if (winnerError) {
        console.error('Error updating winner rating:', winnerError)
        throw winnerError
      }

      // Upsert loser rating
      const { error: loserError } = await supabase
        .from('user_game_ratings')
        .upsert(loserUpdateData, {
          onConflict: 'user_id,game_type'
        })

      if (loserError) {
        console.error('Error updating loser rating:', loserError)
        throw loserError
      }

      console.log(`Elo ratings updated successfully:`)
      console.log(`Winner: ${winnerRating.elo_rating} → ${newWinnerRating} (+${newWinnerRating - winnerRating.elo_rating})`)
      console.log(`Loser: ${loserRating.elo_rating} → ${newLoserRating} (${newLoserRating - loserRating.elo_rating})`)

      // Log rating changes to console (Elo updates are not financial transactions)
      console.log(`Match ${matchId}: Elo ratings updated for ${gameType}`)
      console.log(`- Winner: ${winnerRating.elo_rating} → ${newWinnerRating} (+${newWinnerRating - winnerRating.elo_rating})`)
      console.log(`- Loser: ${loserRating.elo_rating} → ${newLoserRating} (${newLoserRating - loserRating.elo_rating})`)

      return {
        winnerOldRating: winnerRating.elo_rating,
        winnerNewRating: newWinnerRating,
        loserOldRating: loserRating.elo_rating,
        loserNewRating: newLoserRating,
        ratingChange: {
          winner: newWinnerRating - winnerRating.elo_rating,
          loser: newLoserRating - loserRating.elo_rating
        }
      }

    } catch (error) {
      console.error('Error updating Elo ratings:', error)
      throw error
    }
  }

  const processMatchResults = async (challengeId: string, match: any) => {
    try {
      console.log('Processing match results for:', challengeId, match)
      const { challenger_result, challenged_result } = match
      
      if (challenger_result === challenged_result) {
        const winnerId = challenger_result
        const loserId = winnerId === match.challenger_id ? match.challenged_id : match.challenger_id
        const stakeAmount = match.stake_amount
        const winnerOdds = winnerId === match.challenger_id ? match.challenger_odds : match.challenged_odds
        const winnings = calculateWinnings(stakeAmount, winnerOdds)
        const totalPayout = stakeAmount + winnings

        console.log('Match agreed - processing payout for winner:', winnerId)

        try {
          // Update Elo ratings first
          console.log('Updating Elo ratings...')
          const eloUpdate = await updateEloRatings(winnerId, loserId, match.game_type, challengeId)
          console.log('Elo ratings updated successfully')

          // Get winner's current balance
          console.log('Fetching winner balance...')
          const { data: winner, error: winnerFetchError } = await supabase
            .from('users')
            .select('total_balance')
            .eq('id', winnerId)
            .single()
          
          if (winnerFetchError) {
            console.error('Error fetching winner:', winnerFetchError)
            throw winnerFetchError
          }
          
          // Update winner's balance
          console.log('Updating winner balance...')
          const { error: payoutError } = await supabase
            .from('users')
            .update({ 
              total_balance: winner.total_balance + totalPayout,
              total_winnings: ((winner as any).total_winnings || 0) + winnings
            })
            .eq('id', winnerId)
          
          if (payoutError) {
            console.error('Error updating winner balance:', payoutError)
            throw payoutError
          }
          
          // Update match status
          console.log('Updating match status...')
          const { error: matchUpdateError } = await supabase
            .from('matches')
            .update({ 
              status: 'completed',
              final_winner_id: winnerId,
              result_status: 'agreed',
              completed_at: new Date().toISOString()
            })
            .eq('id', challengeId)
          
          if (matchUpdateError) {
            console.error('Error updating match:', matchUpdateError)
            throw matchUpdateError
          }
          
          // Record transaction (non-blocking)
          console.log('Recording transaction...')
          await recordTransaction(
            'bet_payout',
            totalPayout,
            `Won ${match.game_type} match - ${formatCurrency(stakeAmount)} stake + ${formatCurrency(winnings)} winnings`,
            challengeId
          )
          
          // Refresh data
          console.log('Refreshing user data...')
          if (user) {
            await fetchAllChallenges(user.id)
            await fetchTransactions(user.id)
            const { data: updatedUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (updatedUser) {
              setUser({...user, total_balance: updatedUser.total_balance})
            }
          }
          
          alert(`Match completed! Winner receives ${formatCurrency(totalPayout)} (${formatCurrency(stakeAmount)} stake + ${formatCurrency(winnings)} winnings)\n\nElo Rating Updates:\nWinner: ${eloUpdate.winnerOldRating} → ${eloUpdate.winnerNewRating} (+${eloUpdate.ratingChange.winner})\nLoser: ${eloUpdate.loserOldRating} → ${eloUpdate.loserNewRating} (${eloUpdate.ratingChange.loser})`)
          
        } catch (innerError) {
          console.error('Error in match completion process:', innerError)
          throw innerError
        }
        
      } else {
        // Handle disagreement
        console.log('Results disagreement detected')
        const currentDisputeCount = match.dispute_count || 0
        
        if (currentDisputeCount === 0) {
          const { error } = await supabase
            .from('matches')
            .update({ 
              dispute_count: 1,
              result_status: 'disputed_retry',
              challenger_result: null,
              challenged_result: null
            })
            .eq('id', challengeId)
          
          if (error) throw error
          
          if (user) {
            await fetchAllChallenges(user.id)
          }
          
          alert('Results disagreement detected. Both players can report results again. If there is another disagreement, the match will be voided.')
          
        } else {
          // Handle voided match (refund both players)
          const stakeAmount = match.stake_amount
          
          const { data: challenger } = await supabase
            .from('users')
            .select('total_balance')
            .eq('id', match.challenger_id)
            .single()
          
          if (challenger) {
            await supabase
              .from('users')
              .update({ total_balance: challenger.total_balance + stakeAmount })
              .eq('id', match.challenger_id)
          }
          
          const { data: challenged } = await supabase
            .from('users')
            .select('total_balance')
            .eq('id', match.challenged_id)
            .single()
          
          if (challenged) {
            await supabase
              .from('users')
              .update({ total_balance: challenged.total_balance + stakeAmount })
              .eq('id', match.challenged_id)
          }
          
          const { error } = await supabase
            .from('matches')
            .update({ 
              status: 'voided',
              result_status: 'disputed_void',
              dispute_count: 2,
              completed_at: new Date().toISOString()
            })
            .eq('id', challengeId)
          
          if (error) throw error
          
          await recordTransaction(
            'refund',
            stakeAmount,
            `Match voided due to dispute - stake refunded`,
            challengeId
          )
          
          if (user) {
            await fetchAllChallenges(user.id)
            await fetchTransactions(user.id)
            const { data: updatedUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (updatedUser) {
              setUser({...user, total_balance: updatedUser.total_balance})
            }
          }
          
          alert(`Match voided due to repeated disagreement. Both players have been refunded their ${formatCurrency(stakeAmount)} stakes.`)
        }
      }

      setShowResultModal(null)
      setSelectedWinner(null)
      
    } catch (error) {
      console.error('Error processing match results:', error)
      
      // Safely log error details if they exist
      if (error && typeof error === 'object') {
        const errorObj = error as any
        console.error('Error details:', {
          message: errorObj.message || 'Unknown error',
          code: errorObj.code || 'No code',
          details: errorObj.details || 'No details',
          hint: errorObj.hint || 'No hint'
        })
      }
      
      alert('Error processing match results. Please try again.')
    }
  }

  const handleAcceptChallenge = async (challengeId: string) => {
    setActionLoading(challengeId)
    try {
      const challenge = [...challenges.challengeRequests, ...challenges.inNegotiation].find(c => c.id === challengeId)
      if (!challenge) {
        throw new Error('Challenge not found')
      }
      
      const stakeAmount = challenge.stake_amount
      
      const { data: challengerData } = await supabase
        .from('users')
        .select('total_balance')
        .eq('id', challenge.challenger_id)
        .single()
        
      const { data: challengedData } = await supabase
        .from('users')
        .select('total_balance')
        .eq('id', challenge.challenged_id)
        .single()
      
      if (!challengerData || challengerData.total_balance < stakeAmount) {
        throw new Error('Challenger has insufficient funds')
      }
      
      if (!challengedData || challengedData.total_balance < stakeAmount) {
        throw new Error('Challenged player has insufficient funds')
      }
      
      const { error: challengerDeductError } = await supabase
        .from('users')
        .update({ 
          total_balance: challengerData.total_balance - stakeAmount 
        })
        .eq('id', challenge.challenger_id)
      
      if (challengerDeductError) {
        throw new Error('Failed to process challenger payment')
      }
      
      const { error: challengedDeductError } = await supabase
        .from('users')
        .update({ 
          total_balance: challengedData.total_balance - stakeAmount 
        })
        .eq('id', challenge.challenged_id)
      
      if (challengedDeductError) {
        await supabase
          .from('users')
          .update({ 
            total_balance: challengerData.total_balance 
          })
          .eq('id', challenge.challenger_id)
        
        throw new Error('Failed to process challenged player payment')
      }
      
      const { error: acceptError } = await supabase
        .from('matches')
        .update({ status: 'accepted' })
        .eq('id', challengeId)

      if (acceptError) {
        await supabase.from('users').update({ total_balance: challengerData.total_balance }).eq('id', challenge.challenger_id)
        await supabase.from('users').update({ total_balance: challengedData.total_balance }).eq('id', challenge.challenged_id)
        throw acceptError
      }

      await recordTransaction(
        'bet_stake',
        stakeAmount,
        `Stake for ${challenge.game_type} match vs ${challenge.challenger_id === user?.id ? challenge.challenged_name : challenge.challenger_name}`,
        challengeId
      )
      
      if (user) {
        await fetchAllChallenges(user.id)
        await fetchTransactions(user.id)
        const { data: updatedUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (updatedUser) {
          setUser({...user, total_balance: updatedUser.total_balance})
        }
      }
      
      alert('Challenge accepted! Funds have been held in escrow until match completion.')

    } catch (error: any) {
      console.error('Error accepting challenge:', error)
      alert(`Failed to accept challenge: ${error.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeclineChallenge = async (challengeId: string) => {
    setActionLoading(challengeId)
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: 'declined' })
        .eq('id', challengeId)

      if (error) throw error

      if (user) {
        await fetchAllChallenges(user.id)
      }
      
      alert('Challenge declined.')

    } catch (error) {
      console.error('Error declining challenge:', error)
      alert('Failed to decline challenge. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReportResult = async (challengeId: string, winnerId: string) => {
    console.log('🚨 HANDLE REPORT RESULT CALLED 🚨')
    console.log('Challenge ID:', challengeId)
    console.log('Winner ID:', winnerId)
    
    if (!user) {
      console.log('❌ No user found, exiting')
      return
    }
    
    console.log('Starting handleReportResult for challenge:', challengeId, 'winner:', winnerId)
    
    setActionLoading(challengeId)
    try {
      const challenge = [...challenges.activeMatches, ...challenges.inNegotiation].find(c => c.id === challengeId)
      if (!challenge) {
        console.error('Challenge not found for ID:', challengeId)
        return
      }
      
      console.log('Found challenge:', challenge)
      
      const isChallenger = challenge.challenger_id === user.id
      const resultField = isChallenger ? 'challenger_result' : 'challenged_result'
      
      console.log('User is challenger:', isChallenger, 'updating field:', resultField)
      
      const updateData = {
        [resultField]: winnerId,
        result_status: 'awaiting_second_report'
      }
      
      console.log('Updating match with data:', updateData)
      
      const { data, error } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', challengeId)
        .select()
      
      if (error) {
        console.error('Error updating match result:', error)
        throw error
      }
      
      console.log('Match updated successfully, fetching complete match data...')
      
      const { data: updatedMatch, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', challengeId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching updated match:', fetchError)
        // Still show waiting message since we can't verify both results
        alert('Result submitted successfully! Waiting for your opponent to submit their result.')
      } else {
        console.log('Updated match data:', updatedMatch)
        
        // Check if BOTH players have submitted results
        if (updatedMatch?.challenger_result && updatedMatch?.challenged_result) {
          console.log('Both results submitted, processing match results...')
          console.log('Challenger result:', updatedMatch.challenger_result)
          console.log('Challenged result:', updatedMatch.challenged_result)
          await processMatchResults(challengeId, updatedMatch)
        } else {
          console.log('Waiting for second player result')
          console.log('Current results - Challenger:', updatedMatch?.challenger_result, 'Challenged:', updatedMatch?.challenged_result)
          alert('Result submitted successfully! Waiting for your opponent to submit their result.')
        }
      }
      
    } catch (error) {
      console.error('Error reporting result:', error)
      alert('Failed to report result. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCounterOffer = async (challengeId: string) => {
    router.push(`/create-challenge?counter=${challengeId}`)
  }

  useEffect(() => {
    const initializeUser = async () => {
      console.log('Initializing dashboard...')
      try {
        const storedUser = await getStoredUser()
        console.log('Stored user:', storedUser)
        
        if (!storedUser) {
          console.log('No user found, redirecting to login')
          router.push('/login')
          return
        }

        setUser(storedUser)
        await fetchAllChallenges(storedUser.id)
        await fetchTransactions(storedUser.id)
      } catch (error) {
        console.error('Error initializing user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [router])

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('matches_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches' },
        (payload) => {
          console.log('Real-time update received:', payload)
          fetchAllChallenges(user.id)
        }
      )
      .subscribe()

    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchAllChallenges(user.id)
      }
    }, 15000)

    return () => {
      subscription.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [user, supabase])

  if (loading) {
    return (
      <MainLayout user={user} walletBalance={user?.total_balance || 0}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout user={user} walletBalance={user?.total_balance || 0}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.display_name || user?.username}!
            </h1>
            <p className="text-gray-600 mt-1">
              Ready to make some bets? 
              {lastUpdate && (
                <span className="text-sm text-gray-500 ml-2">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-3">
            {/* Two separate wallet buttons */}
            <Button
              onClick={() => setShowWalletModal('deposit')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Funds
            </Button>
            <Button
              onClick={() => setShowWalletModal('withdraw')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Minus className="w-4 h-4" />
              Withdraw
            </Button>
            <Button
              onClick={() => router.push('/create-challenge')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Challenge
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(user?.total_balance || 0)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Winnings</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(user?.total_winnings || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{challenges.activeMatches.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {challenges.challengeRequests.length + challenges.challengesSent.length + challenges.inNegotiation.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Challenge Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Challenge Requests ({challenges.challengeRequests.length})
              </CardTitle>
              <CardDescription>Incoming challenges waiting for your response</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenges.challengeRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending requests</p>
              ) : (
                challenges.challengeRequests.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.icon}
                          </span>
                          <span className="font-medium">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          <strong>{challenge.challenger_name}</strong> challenged you
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(challenge.stake_amount)}</p>
                        <p className="text-sm text-gray-600">
                          Odds: {challenge.challenger_odds} / {challenge.challenged_odds || 'TBD'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptChallenge(challenge.id)}
                        disabled={actionLoading === challenge.id}
                        className="flex-1"
                      >
                        {actionLoading === challenge.id ? 'Processing...' : 'Accept'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCounterOffer(challenge.id)}
                        className="flex-1"
                      >
                        Negotiate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineChallenge(challenge.id)}
                        disabled={actionLoading === challenge.id}
                        className="flex-1"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Challenges Sent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Challenges Sent ({challenges.challengesSent.length})
              </CardTitle>
              <CardDescription>Challenges you've sent waiting for responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenges.challengesSent.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No outgoing challenges</p>
              ) : (
                challenges.challengesSent.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.icon}
                          </span>
                          <span className="font-medium">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Challenging <strong>{challenge.challenged_name}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(challenge.stake_amount)}</p>
                        <p className="text-sm text-gray-600">
                          Odds: {challenge.challenger_odds} / {challenge.challenged_odds || 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Awaiting response</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Matches and Negotiation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Matches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Active Matches ({challenges.activeMatches.length})
              </CardTitle>
              <CardDescription>Accepted challenges ready to play</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenges.activeMatches.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active matches</p>
              ) : (
                challenges.activeMatches.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.icon}
                          </span>
                          <span className="font-medium">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {challenge.challenger_id === user?.id 
                            ? `vs ${challenge.challenged_name}`
                            : `vs ${challenge.challenger_name}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(challenge.stake_amount)}</p>
                        <p className="text-sm text-gray-600">
                          Your odds: {challenge.challenger_id === user?.id 
                            ? challenge.challenger_odds 
                            : challenge.challenged_odds}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">Funds in escrow - Ready to play!</span>
                    </div>
                    
                    {(() => {
                      // Check submission status
                      const currentUserIsChallenger = challenge.challenger_id === user?.id
                      const currentUserSubmitted = currentUserIsChallenger ? challenge.challenger_result : challenge.challenged_result
                      const opponentSubmitted = currentUserIsChallenger ? challenge.challenged_result : challenge.challenger_result
                      
                      if (currentUserSubmitted) {
                        // Current user already submitted
                        return (
                          <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded text-center">
                            <div className="text-sm text-yellow-700 font-medium">
                              Waiting on opponent to verify results
                            </div>
                          </div>
                        )
                      } else if (opponentSubmitted) {
                        // Opponent submitted, current user needs to verify
                        return (
                          <div className="space-y-2">
                            <div className="w-full p-2 bg-blue-50 border border-blue-200 rounded text-center">
                              <div className="text-sm text-blue-700 font-medium">
                                Opponent submitted results - Please verify
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => setShowResultModal(challenge.id)}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              disabled={actionLoading === challenge.id}
                            >
                              {actionLoading === challenge.id ? 'Processing...' : 'Verify Results'}
                            </Button>
                          </div>
                        )
                      } else {
                        // Neither submitted yet
                        return (
                          <Button
                            size="sm"
                            onClick={() => setShowResultModal(challenge.id)}
                            className="w-full"
                            disabled={actionLoading === challenge.id}
                          >
                            {actionLoading === challenge.id ? 'Processing...' : 'Report Results'}
                          </Button>
                        )
                      }
                    })()}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* In Negotiation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                In Negotiation ({challenges.inNegotiation.length})
              </CardTitle>
              <CardDescription>Ongoing odds negotiations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenges.inNegotiation.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No ongoing negotiations</p>
              ) : (
                challenges.inNegotiation.map((challenge) => (
                  <div key={challenge.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.icon}
                          </span>
                          <span className="font-medium">
                            {AVAILABLE_GAMES.find(g => g.id === challenge.game_type)?.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {challenge.challenger_id === user?.id 
                            ? `with ${challenge.challenged_name}`
                            : `with ${challenge.challenger_name}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(challenge.stake_amount)}</p>
                        <p className="text-sm text-gray-600">
                          Odds: {challenge.challenger_odds} / {challenge.challenged_odds}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-blue-600">
                        {challenge.current_responder_id === user?.id 
                          ? 'Your turn to respond'
                          : 'Waiting for response'
                        }
                      </span>
                    </div>
                    
                    {challenge.current_responder_id === user?.id && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptChallenge(challenge.id)}
                          disabled={actionLoading === challenge.id}
                          className="flex-1"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCounterOffer(challenge.id)}
                          className="flex-1"
                        >
                          Counter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineChallenge(challenge.id)}
                          disabled={actionLoading === challenge.id}
                          className="flex-1"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold">
                {showWalletModal === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {showWalletModal === 'deposit' 
                  ? 'Choose your preferred payment method' 
                  : `Available: ${formatCurrency(user?.total_balance || 0)}`}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    placeholder="0.00"
                    min={showWalletModal === 'deposit' ? "0.01" : "5.00"}
                    max={showWalletModal === 'deposit' ? "10000" : user?.total_balance || 0}
                    step="0.01"
                    className="w-full pl-8 pr-3 py-3 border rounded-lg text-lg font-medium"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {showWalletModal === 'deposit' 
                    ? 'Maximum: $10,000 per transaction' 
                    : 'Minimum: $5.00 per withdrawal'}
                </p>
              </div>

              {/* Step 2: Payment Method Selection */}
              {walletAmount && parseFloat(walletAmount) > 0 && !showPaymentForm && (
                <div>
                  <label className="block text-sm font-medium mb-3">Payment Method</label>
                  <div className="space-y-2">
                    {(showWalletModal === 'deposit' ? PAYMENT_METHODS.deposit : PAYMENT_METHODS.withdraw).map((method) => {
                      const IconComponent = method.icon
                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            setSelectedPaymentMethod(method.id)
                            if (method.id === 'credit_card' && showWalletModal === 'deposit') {
                              setShowPaymentForm(true)
                            }
                          }}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            selectedPaymentMethod === method.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <IconComponent className="w-5 h-5 text-gray-600" />
                              <div>
                                <div className="font-medium">{method.name}</div>
                                {showWalletModal === 'withdraw' && (method as any).time && (
                                  <div className="text-sm text-gray-500">{(method as any).time}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {method.fee}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Payment Form (for credit cards) */}
              {showPaymentForm && selectedPaymentMethod === 'credit_card' && showWalletModal === 'deposit' && (
                <div>
                  <h4 className="font-medium mb-3">Card Information</h4>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Card number"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        className="p-3 border rounded-lg"
                        maxLength={5}
                      />
                      <input
                        type="text"
                        placeholder="CVC"
                        value={cardDetails.cvc}
                        onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                        className="p-3 border rounded-lg"
                        maxLength={4}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Cardholder name"
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="ZIP code"
                        value={cardDetails.zip}
                        onChange={(e) => setCardDetails({...cardDetails, zip: e.target.value})}
                        className="w-full p-3 border rounded-lg"
                        maxLength={5}
                      />
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                    <p className="text-sm text-yellow-800">
                      🔒 <strong>Demo Mode:</strong> This is a mock payment form. No real card will be charged.
                    </p>
                  </div>
                </div>
              )}

              {/* Processing Fee Summary */}
              {selectedPaymentMethod && walletAmount && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span>Amount</span>
                    <span>{formatCurrency(parseFloat(walletAmount))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Processing Fee</span>
                    <span>
                      {PAYMENT_METHODS[showWalletModal!].find(m => m.id === selectedPaymentMethod)?.fee || 'Free'}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>
                      {showWalletModal === 'deposit' ? 'You Pay' : 'You Receive'}
                    </span>
                    <span>{formatCurrency(parseFloat(walletAmount))}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t bg-gray-50 flex gap-3">
              <Button
                variant="outline"
                onClick={closeWalletModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={showWalletModal === 'deposit' ? handleDeposit : handleWithdrawal}
                disabled={
                  !walletAmount || 
                  !selectedPaymentMethod || 
                  actionLoading === (showWalletModal === 'deposit' ? 'deposit' : 'withdrawal') ||
                  (showPaymentForm && selectedPaymentMethod === 'credit_card' && 
                   (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name || !cardDetails.zip))
                }
                className="flex-1"
              >
                {actionLoading === (showWalletModal === 'deposit' ? 'deposit' : 'withdrawal') ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  showWalletModal === 'deposit' ? 'Add Funds' : 'Request Withdrawal'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Result Reporting Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Report Match Result</h3>
            <p className="text-gray-600 mb-6">Who won this match?</p>
            
            <div className="space-y-3">
              {(() => {
                const challenge = challenges.activeMatches.find(c => c.id === showResultModal)
                if (!challenge) return null
                
                return (
                  <>
                    <button
                      onClick={() => setSelectedWinner(challenge.challenger_id)}
                      className={`w-full p-3 rounded border text-left ${
                        selectedWinner === challenge.challenger_id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{challenge.challenger_name}</div>
                      <div className="text-sm text-gray-500">
                        Challenger • Odds: {challenge.challenger_odds}
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedWinner(challenge.challenged_id)}
                      className={`w-full p-3 rounded border text-left ${
                        selectedWinner === challenge.challenged_id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{challenge.challenged_name}</div>
                      <div className="text-sm text-gray-500">
                        Challenged • Odds: {challenge.challenged_odds}
                      </div>
                    </button>
                  </>
                )
              })()}
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResultModal(null)
                  setSelectedWinner(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (selectedWinner && showResultModal && user) {
                    const challenge = challenges.activeMatches.find(c => c.id === showResultModal)
                    if (!challenge) return
                    
                    const isChallenger = challenge.challenger_id === user.id
                    const resultField = isChallenger ? 'challenger_result' : 'challenged_result'
                    
                    // Submit result
                    const { error } = await supabase
                      .from('matches')
                      .update({ [resultField]: selectedWinner })
                      .eq('id', showResultModal)
                    
                    if (error) {
                      alert('Error submitting result')
                      return
                    }
                    
                    // Check if both submitted
                    const { data: updatedMatch } = await supabase
                      .from('matches')
                      .select('*')
                      .eq('id', showResultModal)
                      .single()
                    
                    setShowResultModal(null)
                    setSelectedWinner(null)
                    
                    if (updatedMatch?.challenger_result && updatedMatch?.challenged_result) {
                      // Both submitted - process
                      await processMatchResults(showResultModal, updatedMatch)
                    } else {
                      // Show waiting message
                      alert('Result submitted! Waiting for your opponent to verify.')
                    }
                  }
                }}
                disabled={!selectedWinner}
                className="flex-1"
              >
                Submit Result
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}