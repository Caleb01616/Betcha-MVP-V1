import React, { useState, useEffect } from 'react';

// Game configuration - easily expandable
const AVAILABLE_GAMES = [
  { id: 'fifa', name: 'FIFA', icon: '⚽' },
  { id: '2k', name: 'NBA 2K', icon: '🏀' },
  { id: 'madden', name: 'Madden', icon: '🏈' }
];

// Mock user data - replace with your actual user context
const mockUsers = {
  currentUser: { 
    id: 'user1', 
    username: 'mike_23', 
    displayName: 'Mike Johnson',
    elo: { fifa: 1350, '2k': null, madden: 1180 } 
  },
  friends: [
    { id: 'user2', username: 'sarah_hoops', displayName: 'Sarah Martinez', elo: { fifa: 1420, '2k': 1250, madden: null } },
    { id: 'user3', username: 'alex_pro', displayName: 'Alex Chen', elo: { fifa: 1180, '2k': 1400, madden: 1320 } },
    { id: 'user4', username: 'jordan_23', displayName: 'Jordan Smith', elo: { fifa: null, '2k': 1100, madden: 1450 } }
  ]
};

// Elo to probability calculation
const calculateWinProbability = (playerElo, opponentElo) => {
  return 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
};

// Probability to American odds conversion
const probabilityToAmericanOdds = (probability) => {
  if (probability > 0.5) {
    const odds = Math.round(-100 / (probability - 1));
    return Math.min(-100, odds);
  } else if (probability < 0.5) {
    const odds = Math.round((1 - probability) * 100 / probability);
    return Math.max(100, odds);
  } else {
    return 100;
  }
};

const BetSlip = ({ 
  gameType, 
  isFirstTime = false, 
  currentUserElo = 1200, 
  opponentElo = 1200,
  opponentName = "Opponent"
}) => {
  const [yourStake, setYourStake] = useState(20);
  const [selectedOdds, setSelectedOdds] = useState(100);
  const [isEditingOdds, setIsEditingOdds] = useState(false);
  const [tempOdds, setTempOdds] = useState(100);

  // Calculate suggested odds based on Elo difference
  const calculateSuggestedOdds = () => {
    const winProb = calculateWinProbability(currentUserElo, opponentElo);
    return probabilityToAmericanOdds(winProb);
  };

  // Initialize odds when component mounts or Elo changes
  useEffect(() => {
    const suggested = calculateSuggestedOdds();
    setSelectedOdds(suggested);
    setTempOdds(suggested);
  }, [currentUserElo, opponentElo]);

  // Calculate FanDuel-style payouts
  const calculatePayouts = (odds, stake) => {
    const stakeNum = Number(stake) || 0;
    if (odds >= 100) {
      const yourWinnings = (stakeNum * odds) / 100;
      const opponentStake = yourWinnings;
      
      return {
        yourStake: stakeNum,
        yourWinnings: Math.round(yourWinnings * 100) / 100,
        yourTotal: Math.round((stakeNum + yourWinnings) * 100) / 100,
        opponentStake: Math.round(opponentStake * 100) / 100,
        opponentWinnings: stakeNum,
        totalPot: Math.round((stakeNum + opponentStake) * 100) / 100
      };
    } else {
      const yourWinnings = (stakeNum * 100) / Math.abs(odds);
      const opponentStake = yourWinnings;
      
      return {
        yourStake: stakeNum,
        yourWinnings: Math.round(yourWinnings * 100) / 100,
        yourTotal: Math.round((stakeNum + yourWinnings) * 100) / 100,
        opponentStake: Math.round(opponentStake * 100) / 100,
        opponentWinnings: stakeNum,
        totalPot: Math.round((stakeNum + opponentStake) * 100) / 100
      };
    }
  };

  const payouts = calculatePayouts(selectedOdds, yourStake);
  const suggestedOdds = calculateSuggestedOdds();

  const formatOdds = (odds) => {
    return odds >= 100 ? `+${odds}` : `${odds}`;
  };

  const quickAdjustOdds = (direction) => {
    const increment = 25;
    let newOdds = selectedOdds + (increment * direction);
    
    if (selectedOdds < 0 && newOdds > -100 && direction > 0) {
      newOdds = 100;
    } else if (selectedOdds > 0 && newOdds < 100 && direction < 0) {
      newOdds = -100;
    }
    
    newOdds = Math.max(-500, Math.min(500, newOdds));
    
    if (newOdds !== selectedOdds) {
      setSelectedOdds(newOdds);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Bet Slip</span>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-bold ${selectedOdds >= 100 ? 'text-red-600' : 'text-green-600'}`}>
              {formatOdds(selectedOdds)}
            </span>
            {selectedOdds !== suggestedOdds && (
              <span className="text-xs text-gray-500">
                (was {formatOdds(suggestedOdds)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
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
            <input
              type="number"
              value={yourStake}
              onChange={(e) => setYourStake(Number(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
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
            <span className="text-xs text-gray-500">Suggested: {formatOdds(suggestedOdds)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => quickAdjustOdds(-1)}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            >
              -25
            </button>
            <button
              onClick={() => setIsEditingOdds(!isEditingOdds)}
              className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 font-mono text-lg rounded hover:bg-blue-100 border border-blue-200"
            >
              {formatOdds(selectedOdds)}
            </button>
            <button
              onClick={() => quickAdjustOdds(+1)}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            >
              +25
            </button>
          </div>
        </div>

        {/* Status & Opponent Info */}
        <div className="text-center space-y-1">
          <div className="text-sm text-gray-600">
            {selectedOdds >= 100 ? (
              <span>You're the <span className="font-medium text-red-600">underdog</span></span>
            ) : (
              <span>You're the <span className="font-medium text-green-600">favorite</span></span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {opponentName} must wager ${payouts.opponentStake} to win ${payouts.opponentWinnings}
          </div>
          <div className="text-xs text-gray-400">
            Total pot: ${payouts.totalPot}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChallengeCreation = () => {
  const [step, setStep] = useState(1);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState(null);

  const currentUser = mockUsers.currentUser;
  const friends = mockUsers.friends;

  const isFirstTimeForGame = (gameId) => {
    return currentUser.elo[gameId] === null;
  };

  const getCurrentUserElo = (gameId) => {
    return currentUser.elo[gameId] || 1200;
  };

  const getOpponentElo = (gameId) => {
    return selectedOpponent?.elo[gameId] || 1200;
  };

  const getStepTitle = () => {
    switch(step) {
      case 1: return 'Select Game';
      case 2: return 'Choose Opponent';
      case 3: return 'Place Your Bet';
      default: return 'Create Challenge';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Challenge</h1>
          <p className="text-gray-600">{getStepTitle()}</p>
          
          {/* Progress indicator */}
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
        </div>

        {/* Step 1: Game Selection */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Game</h2>
            <div className="grid grid-cols-3 gap-3">
              {AVAILABLE_GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => {
                    setSelectedGame(game.id);
                    setStep(2);
                  }}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all group"
                >
                  <div className="text-2xl mb-2">{game.icon}</div>
                  <div className="text-sm font-medium text-gray-900">{game.name}</div>
                  {isFirstTimeForGame(game.id) && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">First time!</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Opponent Selection */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Choose Opponent</h2>
              <button 
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
            
            <div className="space-y-3">
              {friends.map((friend) => {
                const friendElo = friend.elo[selectedGame];
                const isFirstTimeOpponent = friendElo === null;
                
                return (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setSelectedOpponent(friend);
                      setStep(3);
                    }}
                    className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{friend.displayName}</div>
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
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Bet Slip */}
        {step === 3 && selectedOpponent && (
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Place Your Bet</h2>
              <button 
                onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Matchup</div>
                <div className="font-medium text-gray-900">
                  You vs {selectedOpponent.displayName} • {AVAILABLE_GAMES.find(g => g.id === selectedGame)?.name}
                </div>
              </div>

              <BetSlip
                gameType={selectedGame}
                isFirstTime={isFirstTimeForGame(selectedGame)}
                currentUserElo={getCurrentUserElo(selectedGame)}
                opponentElo={getOpponentElo(selectedGame)}
                opponentName={selectedOpponent.displayName}
              />
              
              <div className="text-center text-sm text-gray-600 space-y-1">
                <div>Your {AVAILABLE_GAMES.find(g => g.id === selectedGame)?.name} Elo: {getCurrentUserElo(selectedGame)}</div>
                <div>{selectedOpponent.displayName}'s Elo: {getOpponentElo(selectedGame)}</div>
              </div>

              <button
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Send Challenge to {selectedOpponent.displayName}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeCreation;