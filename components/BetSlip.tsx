'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CustomUser, getStoredUser, getUserEloRatings, UserEloRating } from '@/lib/supabase/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'

// Game configuration - easily expandable
const AVAILABLE_GAMES = [
  { id: 'fifa', name: 'FIFA', icon: '⚽' },
  { id: '2k', name: 'NBA 2K', icon: '🏀' },
  { id: 'madden', name: 'Madden', icon: '🏈' }
]

interface UserWithElo {
  id: string
  username: string
  display_name: string | null
  elo_ratings: Record<string, number>
}

// Elo to probability calculation
const calculateWinProbability = (playerElo: number, opponentElo: number) => {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400))
}

// Probability to American odds conversion
const probabilityToAmericanOdds = (probability: number) => {
  if (probability > 0.5) {
    const odds = Math.round(-100 / (probability - 1))
    return Math.min(-100, odds)
  } else if (probability < 0.5) {
    const odds = Math.round((1 - probability) * 100 / probability)
    return Math.max(100, odds)
  } else {
    return 100
  }
}

interface BetSlipProps {
  gameType: string
  isFirstTime?: boolean
  currentUserElo?: number
  opponentElo?: number
  opponentName?: string
  onSendChallenge?: (stake: number, odds: number) => void
  isSubmitting?: boolean
  isNegotiating?: boolean
  currentStake?: number
  currentOdds?: number
}

const BetSlip: React.FC<BetSlipProps> = ({ 
  gameType, 
  currentUserElo = 1200, 
  opponentElo = 1200,
  opponentName = "Opponent",
  onSendChallenge,
  isSubmitting = false,
  isNegotiating = false,
  currentStake = 20,
  currentOdds
}) => {
  console.log('BetSlip mounted with props:', {
    gameType,
    currentUserElo, 
    opponentElo,
    opponentName,
    currentOdds
  })

  const [yourStake, setYourStake] = useState(currentStake)
  const [isEditingOdds, setIsEditingOdds] = useState(false)

  // Initialize with calculated odds using existing functions
  const [selectedOdds, setSelectedOdds] = useState(() => {
    console.log('Calculating initial odds...')
    if (currentOdds !== undefined) {
      console.log('Negotiation mode - using currentOdds:', currentOdds)
      return currentOdds // Negotiation mode
    }
    // Use existing functions for Elo-based odds calculation
    console.log('New challenge mode - calculating with Elos:', { currentUserElo, opponentElo })
    const winProb = calculateWinProbability(currentUserElo, opponentElo)
    const calculatedOdds = probabilityToAmericanOdds(winProb)
    console.log('Calculated odds result:', { winProb, calculatedOdds })
    return calculatedOdds
  })

  // Calculate suggested odds based on Elo difference
  const calculateSuggestedOdds = () => {
    const winProb = calculateWinProbability(currentUserElo, opponentElo)
    return probabilityToAmericanOdds(winProb)
  }

  // Initialize odds when component mounts or Elo changes - only for prop changes
  useEffect(() => {
    if (currentOdds !== undefined) {
      // In negotiation mode, update to current odds
      setSelectedOdds(currentOdds)
    }
    // Don't override initial calculation for new challenges
  }, [currentOdds]) // Remove Elo dependencies to prevent overriding initial calculation

  // Calculate FanDuel-style payouts - ensure this uses selectedOdds, not hardcoded values
  const calculatePayouts = (odds: number, stake: number) => {
    const stakeNum = Number(stake) || 0
    console.log('Calculating payouts with odds:', odds, 'stake:', stakeNum)
    
    if (odds >= 100) {
      // Positive odds: winnings = (stake * odds) / 100
      const yourWinnings = (stakeNum * odds) / 100
      const opponentStake = yourWinnings
      
      return {
        yourStake: stakeNum,
        yourWinnings: Math.round(yourWinnings * 100) / 100,
        yourTotal: Math.round((stakeNum + yourWinnings) * 100) / 100,
        opponentStake: Math.round(opponentStake * 100) / 100,
        opponentWinnings: stakeNum,
        totalPot: Math.round((stakeNum + opponentStake) * 100) / 100
      }
    } else {
      // Negative odds: winnings = stake / (Math.abs(odds) / 100)
      const yourWinnings = (stakeNum * 100) / Math.abs(odds)
      const opponentStake = yourWinnings
      
      return {
        yourStake: stakeNum,
        yourWinnings: Math.round(yourWinnings * 100) / 100,
        yourTotal: Math.round((stakeNum + yourWinnings) * 100) / 100,
        opponentStake: Math.round(opponentStake * 100) / 100,
        opponentWinnings: stakeNum,
        totalPot: Math.round((stakeNum + opponentStake) * 100) / 100
      }
    }
  }

  // Force payouts to recalculate with current selectedOdds
  const payouts = calculatePayouts(selectedOdds, yourStake)
  
  // Recalculate suggested odds for display comparison
  const currentSuggestedOdds = (() => {
    const winProb = calculateWinProbability(currentUserElo, opponentElo)
    return probabilityToAmericanOdds(winProb)
  })()

  const formatOdds = (odds: number) => {
    return odds >= 100 ? `+${odds}` : `${odds}`
  }

  const quickAdjustOdds = (direction: number) => {
    const increment = 25
    let newOdds = selectedOdds + (increment * direction)
    
    if (selectedOdds < 0 && newOdds > -100 && direction > 0) {
      newOdds = 100
    } else if (selectedOdds > 0 && newOdds < 100 && direction < 0) {
      newOdds = -100
    }
    
    newOdds = Math.max(-500, Math.min(500, newOdds))
    
    if (newOdds !== selectedOdds) {
      setSelectedOdds(newOdds)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {isNegotiating ? 'Counter-Offer' : 'Bet Slip'}
          </span>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-bold ${selectedOdds >= 100 ? 'text-red-600' : 'text-green-600'}`}>
              {formatOdds(selectedOdds)}
            </span>
            {selectedOdds !== currentSuggestedOdds && (
              <span className="text-xs text-gray-500">
                (suggested: {formatOdds(currentSuggestedOdds)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Negotiation Context */}
        {isNegotiating && (
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="text-sm text-blue-800">
              <strong>Negotiating with {opponentName}</strong>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Current terms: ${currentStake} at {formatOdds(currentOdds || 100)}
            </div>
          </div>
        )}

        {/* Bet Details */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">You vs {opponentName}</span>
          <span className="text-sm font-medium text-gray-900">{gameType.toUpperCase()}</span>
        </div>

        {/* Your Wager Input */}
        <div className="space-y-1">
          <label className="block text-xs text-gray-500">WAGER</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              type="number"
              value={yourStake}
              onChange={(e) => setYourStake(Number(e.target.value) || 0)}
              className="pl-8 text-lg font-semibold"
              placeholder="20"
              min="0"
            />
          </div>
        </div>

        {/* Payout Display */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">YOU WIN</label>
            <div className="bg-green-50 rounded px-3 py-2 border border-green-200">
              <div className="text-lg font-semibold text-green-700">
                ${payouts.yourWinnings}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">TOTAL RETURN</label>
            <div className="bg-gray-50 rounded px-3 py-2">
              <div className="text-lg font-semibold text-gray-900">
                ${payouts.yourTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Odds Adjustment */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">ADJUST ODDS</label>
            <span className="text-xs text-gray-500">
              {isNegotiating ? `Previous: ${formatOdds(currentOdds || 100)}` : `Suggested: ${formatOdds(currentSuggestedOdds)}`}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => quickAdjustOdds(-1)}
              variant="outline"
              size="sm"
              className="px-3 py-2"
            >
              -25
            </Button>
            <Button
              onClick={() => setIsEditingOdds(!isEditingOdds)}
              variant="outline"
              className="flex-1 font-mono text-lg"
            >
              {formatOdds(selectedOdds)}
            </Button>
            <Button
              onClick={() => quickAdjustOdds(+1)}
              variant="outline"
              size="sm"
              className="px-3 py-2"
            >
              +25
            </Button>
          </div>
        </div>

        {/* Status & Opponent Info */}
        <div className="text-center space-y-1">
          <div className="text-sm text-gray-600">
            {selectedOdds >= 100 ? (
              <span>You&apos;re the <span className="font-medium text-red-600">underdog</span></span>
            ) : (
              <span>You&apos;re the <span className="font-medium text-green-600">favorite</span></span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {opponentName} must wager ${payouts.opponentStake} to win ${payouts.opponentWinnings}
          </div>
          <div className="text-xs text-gray-400">
            Total pot: ${payouts.totalPot}
          </div>
        </div>

        {/* Action Button */}
        {onSendChallenge && (
          <Button
            onClick={() => onSendChallenge(yourStake, selectedOdds)}
            disabled={isSubmitting || yourStake <= 0}
            className="w-full py-3 mt-4"
            variant="default"
          >
            {isSubmitting ? 'Sending...' : (isNegotiating ? `Send Counter-Offer` : `Send Challenge`)}
          </Button>
        )}
      </div>
    </div>
  )
}

const ChallengeCreation: React.FC = () => {
  const [step, setStep] = useState(1)
  const [selectedGame, setSelectedGame] = useState('')
  const [selectedOpponent, setSelectedOpponent] = useState<UserWithElo | null>(null)
  const [currentUser, setCurrentUser] = useState<CustomUser | null>(null)
  const [currentUserEloRatings, setCurrentUserEloRatings] = useState<UserEloRating[]>([])
  const [friends, setFriends] = useState<UserWithElo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Negotiation mode state
  const [isNegotiating, setIsNegotiating] = useState(false)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Check for negotiation mode from URL parameters
  useEffect(() => {
    const mode = searchParams.get('mode')
    const id = searchParams.get('challengeId')
    const gameType = searchParams.get('gameType')
    const opponentId = searchParams.get('opponentId')
    const currentOdds = searchParams.get('currentOdds')
    const currentStake = searchParams.get('currentStake')

    if (mode === 'negotiate' && id && gameType && opponentId) {
      setIsNegotiating(true)
      setChallengeId(id)
      setSelectedGame(gameType)
      setStep(3) // Skip to bet slip
      
      // Find and set opponent
      // We'll need to fetch this data
      const fetchOpponentData = async () => {
        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('id, username, display_name')
            .eq('id', opponentId)
            .single()

          if (!error && user) {
            // Fetch Elo ratings for opponent
            const { data: eloRatings } = await supabase
              .from('user_game_ratings')
              .select('game_type, elo_rating')
              .eq('user_id', opponentId)

            const userEloRatings: Record<string, number> = {}
            AVAILABLE_GAMES.forEach(game => {
              userEloRatings[game.id] = 1200
            })

            eloRatings?.forEach(rating => {
              userEloRatings[rating.game_type] = rating.elo_rating
            })

            setSelectedOpponent({
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              elo_ratings: userEloRatings
            })
          }
        } catch (err) {
          console.error('Error fetching opponent data:', err)
        }
      }

      fetchOpponentData()
    }
  }, [searchParams, supabase])

  // MODIFIED FUNCTION: Handle sending challenge or counter-offer to database
  // THIS IS THE MAIN CHANGE - Phase 1 escrow implementation
  const handleSendChallenge = async (stake: number, odds: number) => {
    if (!selectedOpponent || !currentUser) {
      console.error('Missing required data:', { selectedOpponent, currentUser })
      alert('Missing user data. Please refresh and try again.')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (isNegotiating && challengeId) {
        // Counter-offer logic (no money changes hands during negotiation)
        console.log('Sending counter-offer for challenge:', challengeId)
        console.log('Update data:', {
          stake_amount: stake,
          challenged_odds: odds >= 100 ? `+${odds}` : `${odds}`,
          status: 'counter_offer',
          current_responder_id: selectedOpponent.id
        })
        
        const { data, error } = await supabase
          .from('matches')
          .update({
            stake_amount: stake,
            challenged_odds: odds >= 100 ? `+${odds}` : `${odds}`,
            status: 'counter_offer',
            current_responder_id: selectedOpponent.id // Switch turn to opponent
          })
          .eq('id', challengeId)
          .select()

        console.log('Update result:', { data, error })

        if (error) {
          console.error('Supabase error details:', error)
          throw error
        }

        // Success! Redirect to dashboard
        router.push('/dashboard?counter_offer_sent=true')
        
      } else {
        // PHASE 1 ESCROW: NEW CHALLENGE - DEDUCT CHALLENGER'S STAKE IMMEDIATELY
        console.log('Creating new challenge - implementing Phase 1 escrow')
        
        // Check challenger's balance (with null safety)
        const { data: challengerData, error: balanceError } = await supabase
          .from('users')
          .select('total_balance')
          .eq('id', currentUser.id)
          .single()
        
        if (balanceError) throw balanceError
        
        const challengerBalance = challengerData?.total_balance ?? 0
        
        if (challengerBalance < stake) {
          throw new Error('Insufficient funds to create challenge')
        }
        
        console.log('=== PHASE 1 ESCROW (CHALLENGE CREATION) ===')
        console.log('Challenger balance before:', challengerBalance)
        console.log('Deducting challenger stake:', stake)
        
        // PHASE 1: Deduct challenger's stake immediately
        const { error: deductError } = await supabase
          .from('users')
          .update({ 
            total_balance: challengerBalance - stake 
          })
          .eq('id', currentUser.id)
        
        if (deductError) {
          console.error('Failed to deduct challenger stake:', deductError)
          throw new Error('Failed to process your stake payment')
        }
        
        console.log('Phase 1: Challenger stake deducted successfully')
        
        // Create the challenge
        console.log('Creating challenge record:', {
          challenger_id: currentUser.id,
          challenged_id: selectedOpponent.id,
          game_type: selectedGame,
          stake_amount: stake,
          challenger_odds: odds >= 100 ? `+${odds}` : `${odds}`,
          status: 'negotiating'
        })

        const { data, error } = await supabase
          .from('matches')
          .insert([{
            challenger_id: currentUser.id,
            challenged_id: selectedOpponent.id,
            game_type: selectedGame,
            stake_amount: stake,
            challenger_odds: odds >= 100 ? `+${odds}` : `${odds}`,
            status: 'negotiating'
          }])
          .select()

        console.log('Insert result:', { data, error })

        if (error) {
          // Rollback the challenger's stake deduction
          console.error('Challenge creation failed, rolling back stake deduction')
          await supabase
            .from('users')
            .update({ total_balance: challengerBalance })
            .eq('id', currentUser.id)
          console.error('Supabase error details:', error)
          throw error
        }

        console.log('=== PHASE 1 ESCROW COMPLETED ===')
        console.log('Challenge created with challenger stake in escrow')
        
        // Force refresh to show updated balance immediately
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
        // Success! Redirect to dashboard
        router.push('/dashboard?challenge_sent=true')
      }
      
    } catch (error) {
      console.error('Error sending challenge/counter-offer:', error)
      console.error('Error type:', typeof error)
      
      const errorMessage = error instanceof Error ? error.message : 
                          (error as any)?.message || 
                          'Unknown error'
      
      console.error('Error message:', errorMessage)
      console.error('Error details:', JSON.stringify(error, null, 2))
      alert(`Failed to send. Error: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ALL OTHER FUNCTIONS REMAIN UNCHANGED - preserving working functionality

  // Fetch current user and friends with Elo ratings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get current user from localStorage
        const user = getStoredUser()
        if (!user) {
          router.push('/login')
          return
        }
        setCurrentUser(user)

        // Fetch current user's Elo ratings
        const { ratings: userRatings, error: userRatingsError } = await getUserEloRatings(user.id)
        if (userRatingsError) {
          console.warn('Failed to fetch user Elo ratings:', userRatingsError)
        } else {
          setCurrentUserEloRatings(userRatings)
        }

        // Skip fetching friends if in negotiation mode (we already have opponent)
        if (isNegotiating) {
          setLoading(false)
          return
        }

        // Fetch all users except current user
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, username, display_name')
          .neq('id', user.id)
          .eq('is_active', true)

        if (usersError) throw usersError

        // Fetch Elo ratings for all users
        const { data: eloRatings, error: eloError } = await supabase
          .from('user_game_ratings')
          .select('user_id, game_type, elo_rating, games_played')

        if (eloError) throw eloError

        // Combine users with their Elo ratings
        const usersWithElo: UserWithElo[] = users.map(user => {
          const userEloRatings: Record<string, number> = {}
          
          // Initialize with default Elo for all games
          AVAILABLE_GAMES.forEach(game => {
            userEloRatings[game.id] = 1200
          })

          // Override with actual Elo ratings
          eloRatings
            .filter(rating => rating.user_id === user.id)
            .forEach(rating => {
              userEloRatings[rating.game_type] = rating.elo_rating
            })

          return {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            elo_ratings: userEloRatings
          }
        })

        setFriends(usersWithElo)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load users and ratings')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase, isNegotiating])

  const isFirstTimeForGame = (gameId: string) => {
    if (!currentUser) return true
    
    // Check if user has Elo rating for this game
    const hasRating = currentUserEloRatings.some(rating => rating.game_type === gameId)
    return !hasRating
  }

  const getCurrentUserElo = (gameId: string) => {
    if (!currentUser) return 1200
    
    // Find the user's Elo rating for this game
    const rating = currentUserEloRatings.find(rating => rating.game_type === gameId)
    return rating ? rating.elo_rating : 1200 // Default to 1200 if no rating exists
  }

  const getOpponentElo = (gameId: string) => {
    return selectedOpponent?.elo_ratings[gameId] || 1200
  }

  const getStepTitle = () => {
    if (isNegotiating) {
      return 'Send Counter-Offer'
    }
    switch(step) {
      case 1: return 'Select Game'
      case 2: return 'Choose Opponent'
      case 3: return 'Place Your Bet'
      default: return 'Create Challenge'
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-betcha-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isNegotiating ? 'Counter-Offer' : 'Create Challenge'}
          </h1>
          <p className="text-gray-600">{getStepTitle()}</p>
          
          {/* Progress indicator (hide for negotiation) */}
          {!isNegotiating && (
            <div className="flex justify-center mt-4 space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div 
                  key={stepNum}
                  className={`w-3 h-3 rounded-full ${
                    step >= stepNum ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Back button for negotiation */}
        {isNegotiating && (
          <div className="text-center">
            <Button 
              onClick={() => router.back()}
              variant="outline"
              size="sm"
            >
              ← Back to Dashboard
            </Button>
          </div>
        )}

        {/* Step 1: Game Selection */}
        {step === 1 && !isNegotiating && (
          <Card>
            <CardHeader>
              <CardTitle>Select Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {AVAILABLE_GAMES.map((game) => (
                  <Button
                    key={game.id}
                    onClick={() => {
                      setSelectedGame(game.id)
                      setStep(2)
                    }}
                    variant="outline"
                    className="p-4 h-auto flex-col space-y-2"
                  >
                    <div className="text-2xl">{game.icon}</div>
                    <div className="text-sm font-medium">{game.name}</div>
                    {isFirstTimeForGame(game.id) && (
                      <div className="text-xs text-blue-600 font-medium">First time!</div>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Opponent Selection */}
        {step === 2 && !isNegotiating && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Choose Opponent</CardTitle>
                <Button 
                  onClick={() => setStep(1)}
                  variant="ghost"
                  size="sm"
                >
                  ← Back
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {friends.map((friend) => {
                  const friendElo = friend.elo_ratings[selectedGame]
                  const isFirstTimeOpponent = friendElo === 1200 // Assuming 1200 is default
                  
                  return (
                    <Button
                      key={friend.id}
                      onClick={() => {
                        setSelectedOpponent(friend)
                        setStep(3)
                      }}
                      variant="outline"
                      className="w-full p-4 h-auto justify-start"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <div className="font-medium">{friend.display_name || friend.username}</div>
                          <div className="text-sm text-gray-500">@{friend.username}</div>
                        </div>
                        <div className="text-right">
                          {isFirstTimeOpponent ? (
                            <span className="text-xs text-blue-600 font-medium">
                              New to {AVAILABLE_GAMES.find(g => g.id === selectedGame)?.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600">Elo: {friendElo}</span>
                          )}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Bet Slip */}
        {step === 3 && selectedOpponent && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isNegotiating ? 'Send Counter-Offer' : 'Place Your Bet'}</CardTitle>
                {!isNegotiating && (
                  <Button 
                    onClick={() => setStep(2)}
                    variant="ghost"
                    size="sm"
                  >
                    ← Back
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Matchup</div>
                  <div className="font-medium text-gray-900">
                    You vs {selectedOpponent.display_name || selectedOpponent.username} • {AVAILABLE_GAMES.find(g => g.id === selectedGame)?.name}
                  </div>
                </div>

                <BetSlip
                  gameType={selectedGame}
                  isFirstTime={isFirstTimeForGame(selectedGame)}
                  currentUserElo={getCurrentUserElo(selectedGame)}
                  opponentElo={getOpponentElo(selectedGame)}
                  opponentName={selectedOpponent.display_name || selectedOpponent.username}
                  onSendChallenge={handleSendChallenge}
                  isSubmitting={isSubmitting}
                  isNegotiating={isNegotiating}
                  currentStake={parseInt(searchParams.get('currentStake') || '20')}
                  currentOdds={isNegotiating ? parseInt(searchParams.get('currentOdds')?.replace('+', '') || '100') : undefined}
                />
                
                <div className="text-center text-sm text-gray-600 space-y-1">
                  <div>Your {AVAILABLE_GAMES.find(g => g.id === selectedGame)?.name} Elo: {getCurrentUserElo(selectedGame)}</div>
                  <div>{selectedOpponent.display_name || selectedOpponent.username}&apos;s Elo: {getOpponentElo(selectedGame)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ChallengeCreation