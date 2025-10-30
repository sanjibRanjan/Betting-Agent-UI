import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';

const MatchDetails = () => {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);
  
  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://betting-agent-server.onrender.com/api/matches/${matchId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setMatchData(data.data.data || data.data);
      } else {
        setError('Failed to fetch match details');
      }
    } catch (err) {
      setError('Error fetching match details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFormatName = (format) => {
    switch (format) {
      case 1: return 'ODI';
      case 2: return 'Test';
      case 3: return 'T20';
      default: return 'Unknown';
    }
  };

  const generateBettingQuestions = (matchData) => {
    try {
      if (!matchData || !matchData.teams) {
        return [{
          id: 'fallback',
          question: 'General Match Questions',
          options: [
            { text: 'Match will be exciting', odds: '1.50' },
            { text: 'Match will be competitive', odds: '2.00' }
          ]
        }];
      }

      const questions = [];
      const team1 = matchData.teams.t1;
      const team2 = matchData.teams.t2;
      const isLive = matchData.isLive;
      const format = matchData.format;
      const status = matchData.status;

      // Extract player data from scorecard
      const scorecardData = matchData.scorecard && matchData.scorecard.length > 0 ? matchData.scorecard[0] : null;

      // Find current innings - for Test matches, this can be more complex
      let currentInnings = null;
      if (scorecardData?.result?.innings) {
        const innings = scorecardData.result.innings;
        const inningsId = scorecardData.result.inningsId;

        if (inningsId) {
          // Find innings by ID if specified
          currentInnings = innings.find(inn => {
            // Match innings by team and number (e.g., "t1_1", "t2_2")
            const teamKey = inn.teamInfo?.teamName === scorecardData.result.teams?.team1?.name ? 't1' : 't2';
            return inningsId.startsWith(teamKey);
          });
        }

        // If no inningsId or not found, use the last innings (current one)
        if (!currentInnings) {
          currentInnings = innings[innings.length - 1];
        }
      }

      // For context, get the previous innings if available
      const allInnings = scorecardData?.result?.innings || [];
      const previousInnings = allInnings.length > 1 ? allInnings[allInnings.length - 2] : null;

      // Detect match states
      const isDelayed = !isLive && status === 5; // Status 5 = Delayed
      const isAbandoned = status === 3; // Status 3 = Abandoned
      const isCompleted = matchData.result && matchData.result.message;
      const notStarted = !isLive && !scorecardData;

      // Helper functions
      const getActiveBatsmen = () => {
        if (!currentInnings?.batting) return [];
        return currentInnings.batting.filter(b => !b.isOut);
      };

      const getCurrentBowler = () => {
        if (!currentInnings?.bowling || currentInnings.bowling.length === 0) return null;
        return currentInnings.bowling[currentInnings.bowling.length - 1];
      };

      const activeBatsmen = getActiveBatsmen();
      const currentBowler = getCurrentBowler();

      // RAIN DELAY SCENARIO
      if (isDelayed) {
        questions.push({
          id: 'rain_delay_resume',
          question: `When will ${team1?.name} vs ${team2?.name} resume?`,
          options: [
            { text: 'Within 30 mins', odds: '2.50' },
            { text: '30-60 mins', odds: '2.00' },
            { text: 'Over 60 mins', odds: '3.00' },
            { text: 'Match abandoned', odds: '4.00' }
          ]
        });

        questions.push({
          id: 'rain_delay_score',
          question: `Score when match resumes?`,
          options: [
            { text: `${team1?.name} leads`, odds: '2.10' },
            { text: `${team2?.name} leads`, odds: '2.10' },
            { text: 'Scores level', odds: '3.50' }
          ]
        });

        return questions;
      }

      // ABANDONED MATCH SCENARIO
      if (isAbandoned) {
        questions.push({
          id: 'abandoned_result',
          question: `What should the result be?`,
          options: [
            { text: `${team1?.name} wins`, odds: '2.20' },
            { text: `${team2?.name} wins`, odds: '2.20' },
            { text: 'No result', odds: '3.00' },
            { text: 'Replay match', odds: '5.00' }
          ]
        });

        return questions;
      }

      // COMPLETED MATCH SCENARIO
      if (isCompleted) {
        questions.push({
          id: 'completed_margin',
          question: `What was the winning margin?`,
          options: [
            { text: 'Close finish (<20 runs)', odds: '2.50' },
            { text: 'Comfortable win (20-50)', odds: '2.10' },
            { text: 'Big win (>50)', odds: '3.00' }
          ]
        });

        return questions;
      }

      // PRE-MATCH SCENARIO
      if (notStarted) {
        questions.push({
          id: 'pre_match_winner',
          question: `Pre-match: Who will win?`,
          options: [
            { text: team1?.name || 'Team 1', odds: '2.00' },
            { text: team2?.name || 'Team 2', odds: '2.20' },
            { text: 'Draw', odds: '8.00' }
          ]
        });

        questions.push({
          id: 'pre_match_first_boundary',
          question: `First boundary of the match?`,
          options: [
            { text: 'Within first over', odds: '3.00' },
            { text: 'Within first 3 overs', odds: '2.20' },
            { text: 'After 3 overs', odds: '2.50' }
          ]
        });

        return questions;
      }

      // LIVE MATCH SCENARIO WITH PLAYER DATA
      if (isLive && scorecardData && currentInnings) {
        // Determine which team is currently batting based on innings data
        const battingTeamName = currentInnings.teamInfo?.teamName;
        const isTeam1Batting = battingTeamName === team1?.name;
        const isTeam2Batting = battingTeamName === team2?.name;

        // Get the score for the currently batting team
        const currentScore = (isTeam1Batting ? team1?.score : isTeam2Batting ? team2?.score : '0/0') || '0/0';
        const battingTeam = isTeam1Batting ? team1 : isTeam2Batting ? team2 : null;

        const runs = parseInt(currentScore.split('/')[0]) || 0;
        const wickets = parseInt(currentScore.split('/')[1]) || 0;
        const overs = parseFloat(currentInnings.teamInfo?.overs) || 0;

        // Match Winner (always shown)
        questions.push({
          id: 'match_winner',
          question: `Match Winner: ${team1?.name} vs ${team2?.name}`,
          options: [
            { text: team1?.name || 'Team 1', odds: format === 3 ? '1.85' : '1.72' },
            { text: team2?.name || 'Team 2', odds: format === 3 ? '2.10' : '2.25' },
            { text: 'Draw/Tie', odds: format === 2 ? '4.50' : '15.00' }
          ]
        });

        // Current Batsman Questions
        if (activeBatsmen.length > 0) {
          const batsman = activeBatsmen[0]; // On-strike batsman
          if (batsman && batsman.playerName) {
            questions.push({
              id: 'current_batsman_runs',
              question: `Will ${batsman.playerName} score 20+ runs in this innings?`,
              options: [
                { text: 'Yes', odds: '2.40' },
                { text: 'No', odds: '1.55' }
              ]
            });

            questions.push({
              id: 'current_batsman_boundary',
              question: `Will ${batsman.playerName} hit next boundary?`,
              options: [
                { text: 'Yes (4 or 6)', odds: '1.75' },
                { text: 'No', odds: '2.00' }
              ]
            });
          }
        }

        // Bowler Questions
        if (currentBowler && currentBowler.playerName) {
          questions.push({
            id: 'bowler_wicket',
            question: `Will ${currentBowler.playerName} take next wicket?`,
            options: [
              { text: 'Yes', odds: '3.50' },
              { text: 'No', odds: '1.30' }
            ]
          });
        }

        // Partnership Questions
        if (activeBatsmen.length >= 2) {
          const batsman1 = activeBatsmen[0]?.playerName;
          const batsman2 = activeBatsmen[1]?.playerName;
          if (batsman1 && batsman2) {
            questions.push({
              id: 'partnership_runs',
              question: `Will ${batsman1}-${batsman2} partnership reach 50 runs?`,
              options: [
                { text: 'Yes', odds: '2.10' },
                { text: 'No', odds: '1.70' }
              ]
            });
          }
        }

        // Score Milestones - Format specific
        let milestoneRuns;
        switch (format) {
          case 3: // T20
            milestoneRuns = 150;
            break;
          case 1: // ODI
            milestoneRuns = 250;
            break;
          case 2: // Test
            milestoneRuns = 300;
            break;
          default:
            milestoneRuns = 150; // Default to T20
        }

        // Only show milestone if current score is below the target
        if (runs < milestoneRuns) {
          questions.push({
            id: 'score_milestone',
            question: `Will ${battingTeam?.name || 'Current team'} reach ${milestoneRuns}+ runs?`,
            options: [
              { text: 'Yes', odds: '1.65' },
              { text: 'No', odds: '2.20' }
            ]
          });
        }

        // Next Over Questions
        if (currentBowler && currentBowler.playerName) {
          questions.push({
            id: 'next_over_runs',
            question: `Runs off ${currentBowler.playerName}'s next over`,
            options: [
              { text: '0-2 runs', odds: '3.50' },
              { text: '3-5 runs', odds: '2.10' },
              { text: '6+ runs', odds: '2.80' }
            ]
          });
        }

        // TEST CRICKET SPECIFIC QUESTIONS
        if (format === 2) { // Test match
          const inningsCount = allInnings.length;
          const inningsNumber = inningsCount; // Current innings number
          const targetRuns = scorecardData?.result?.targetRuns;

          // Declaration questions for batting team
          if (inningsNumber >= 2 && battingTeam && !targetRuns) {
            questions.push({
              id: 'captain_declaration',
              question: `Will ${battingTeam.name} captain declare before end of day?`,
              options: [
                { text: 'Yes', odds: '3.00' },
                { text: 'No', odds: '1.40' }
              ]
            });
          }

          // Follow-on questions after first innings
          if (inningsNumber === 1 && previousInnings) {
            const team1Total = scorecardData.result.teams?.team1?.name === team1?.name ?
              (previousInnings.teamInfo?.runs || 0) : 0;
            const team2Total = scorecardData.result.teams?.team2?.name === team2?.name ?
              (previousInnings.teamInfo?.runs || 0) : 0;

            if (Math.abs(team1Total - team2Total) >= 200) {
              const leadingTeam = team1Total > team2Total ? team1 : team2;
              questions.push({
                id: 'follow_on',
                question: `Will ${leadingTeam?.name} enforce follow-on?`,
                options: [
                  { text: 'Yes', odds: '2.50' },
                  { text: 'No', odds: '1.55' }
                ]
              });
            }
          }

          // Target chase questions for 4th innings
          if (targetRuns && inningsNumber === 4) {
            const remainingRuns = targetRuns - runs;
            const remainingWickets = 10 - wickets;

            if (remainingRuns > 0 && remainingRuns <= 150) {
              questions.push({
                id: 'target_reach',
                question: `Will ${battingTeam?.name} reach target of ${targetRuns}?`,
                options: [
                  { text: 'Yes', odds: wickets <= 3 ? '2.20' : '3.50' },
                  { text: 'No', odds: wickets <= 3 ? '1.70' : '1.30' }
                ]
              });
            }
          }

          // Session survival questions
          if (battingTeam && wickets < 10) {
            questions.push({
              id: 'session_survival',
              question: `Will ${battingTeam.name} lose a wicket before next interval?`,
              options: [
                { text: 'Yes', odds: '1.85' },
                { text: 'No', odds: '1.95' }
              ]
            });
          }

          // Innings completion and match state questions
          const isInningsNearlyComplete = wickets >= 7; // 7+ wickets down
          if (isInningsNearlyComplete && !targetRuns) {
            questions.push({
              id: 'innings_completion',
              question: `Will ${battingTeam?.name} get all out in this innings?`,
              options: [
                { text: 'Yes', odds: wickets >= 9 ? '1.20' : '2.50' },
                { text: 'No', odds: wickets >= 9 ? '4.50' : '1.55' }
              ]
            });
          }

          // Match result questions when in decisive stage
          if (targetRuns && inningsNumber >= 3) {
            const runsNeeded = targetRuns - runs;
            const wicketsInHand = 10 - wickets;

            if (runsNeeded <= 100 && wicketsInHand >= 5) {
              questions.push({
                id: 'match_result_imminent',
                question: `Match result in next 10 overs?`,
                options: [
                  { text: `${battingTeam?.name} wins`, odds: '2.75' },
                  { text: 'Bowling team wins', odds: '2.10' },
                  { text: 'No result yet', odds: '3.00' }
                ]
              });
            }
          }

          // Century prospects for Test batsmen
          if (activeBatsmen.length > 0 && format === 2) {
            activeBatsmen.forEach((batsman, index) => {
              if (batsman && batsman.runs >= 50) {
                questions.push({
                  id: `century_${index}`,
                  question: `Will ${batsman.playerName} score a century?`,
                  options: [
                    { text: 'Yes', odds: batsman.runs >= 80 ? '1.80' : '3.00' },
                    { text: 'No', odds: batsman.runs >= 80 ? '2.00' : '1.35' }
                  ]
                });
              }
            });
          }
        }
      }

      // Default questions if no specific scenario matches
      if (questions.length === 0) {
        questions.push({
          id: 'general_winner',
          question: `Who will win: ${team1?.name} vs ${team2?.name}?`,
          options: [
            { text: team1?.name || 'Team 1', odds: '2.00' },
            { text: team2?.name || 'Team 2', odds: '2.20' },
            { text: 'Draw', odds: '8.00' }
          ]
        });
      }

      return questions;

    } catch (error) {
      console.error('Error generating betting questions:', error);
      return [{
        id: 'error_fallback',
        question: 'Match betting available soon',
        options: [
          { text: 'Home team to win', odds: '2.00' },
          { text: 'Away team to win', odds: '2.20' }
        ]
      }];
    }
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading match details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchMatchDetails} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="error-container">
        <h2>Match Not Found</h2>
        <p>The requested match could not be found.</p>
        <Link to="/" className="back-btn">Back to Live Matches</Link>
      </div>
    );
  }

  const { teams, scorecard, result, ground, name, format, isLive, timestamp } = matchData;
  const scorecardData = scorecard && scorecard.length > 0 ? scorecard[0] : null;

  return (
    <div className="match-details">
      <div className="match-header-section">
        <Link to="/" className="back-link">← Back to Live Matches</Link>
        <div className="match-title">
          <h1>{name}</h1>
          <div className="match-meta">
            <span className="format">{getFormatName(format)}</span>
            {isLive && <span className="live-badge">LIVE</span>}
          </div>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="match-layout-container">
        {/* Left Side Navigation */}
        <div className="left-navigation">
          <div className="navigation-tabs">
            <button
              className="nav-tab-button"
              onClick={() => scrollToSection('match-info')}
            >
              📊 Match Info
            </button>
            <button
              className="nav-tab-button"
              onClick={() => scrollToSection('betting')}
            >
              🤑 Betting
            </button>
            <button
              className="nav-tab-button"
              onClick={() => scrollToSection('scorecard')}
            >
              📈 Scorecard
            </button>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="main-content">
          {/* Scrollable Content Sections */}
      <div id="match-info" className="content-section match-info-section">
        <div className="teams-display">
          {teams && teams.t1 && (
            <div className="team team-large">
              <img src={teams.t1.logo} alt={teams.t1.name} className="team-logo-large" />
              <div className="team-info-large">
                <h2 className="team-name-large">{teams.t1.name}</h2>
                <span className="team-score-large">{teams.t1.score || 'Yet to bat'}</span>
              </div>
            </div>
          )}

          <div className="vs-large">VS</div>

          {teams && teams.t2 && (
            <div className="team team-large">
              <img src={teams.t2.logo} alt={teams.t2.name} className="team-logo-large" />
              <div className="team-info-large">
                <h2 className="team-name-large">{teams.t2.name}</h2>
                <span className="team-score-large">{teams.t2.score || 'Yet to bat'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="match-details-info">
          <div className="info-item">
            <span className="label">Ground:</span>
            <span className="value">{ground}</span>
          </div>
          <div className="info-item">
            <span className="label">Date:</span>
            <span className="value">{formatDateTime(matchData.timestamp, 'long')}</span>
          </div>
          {result && result.message && (
            <div className="info-item">
              <span className="label">Result:</span>
              <span className="value">{result.message}</span>
            </div>
          )}
        </div>
      </div>

      <div id="betting" className="content-section betting-section">
        {(() => {
          const isDelayed = !matchData.isLive && matchData.status === 5;
          const isAbandoned = matchData.status === 3;
          const isCompleted = matchData.result && matchData.result.message;
          const notStarted = !matchData.isLive && !matchData.scorecard;

          if (isDelayed) return <h3>🌧️ Match Delayed - Weather Questions</h3>;
          if (isAbandoned) return <h3>❌ Match Abandoned - Result Questions</h3>;
          if (isCompleted) return <h3>🏆 Match Completed - Analysis Questions</h3>;
          if (notStarted) return <h3>⏰ Pre-Match Betting Questions</h3>;
          return <h3>🤑 Live Betting Questions</h3>;
        })()}

        <div className="betting-questions">
          {generateBettingQuestions(matchData).map((question) => (
            <div key={question.id} className="betting-card">
              <h4>{question.question}</h4>
              <div className="options">
                {question.options.map((option, index) => (
                  <div key={index} className="option">
                    <span>{option.text}</span>
                    <span className="odds">{option.odds}</span>
                    <button className="bet-btn">Bet Now</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {scorecardData && scorecardData.result && scorecardData.result.teams && (
        <div id="scorecard" className="content-section scorecard-section">
          <h3>Scorecard</h3>

          <div className="scorecard-teams">
            {scorecardData.result.teams.team1 && (
              <div className="scorecard-team">
                <img src={scorecardData.result.teams.team1.logo} alt={scorecardData.result.teams.team1.name} className="team-logo" />
                <div className="team-details">
                  <h4>{scorecardData.result.teams.team1.name}</h4>
                  <p className="short-name">{scorecardData.result.teams.team1.shortName}</p>
                </div>
              </div>
            )}

            {scorecardData.result.teams.team2 && (
              <div className="scorecard-team">
                <img src={scorecardData.result.teams.team2.logo} alt={scorecardData.result.teams.team2.name} className="team-logo" />
                <div className="team-details">
                  <h4>{scorecardData.result.teams.team2.name}</h4>
                  <p className="short-name">{scorecardData.result.teams.team2.shortName}</p>
                </div>
              </div>
            )}
          </div>

          {scorecardData.result.innings && scorecardData.result.innings.length > 0 ? (
            <div className="innings-section">
              <h4>Innings</h4>
              {scorecardData.result.innings.map((inning, index) => (
                <div key={index} className="inning-card">
                  <h5>{inning.teamInfo?.teamName} - {inning.teamInfo?.runs}/{inning.teamInfo?.wickets} ({inning.teamInfo?.overs})</h5>
                  <div className="inning-details">
                    {/* Batting Table */}
                    {inning.batting && inning.batting.length > 0 && (
                      <div className="batting-section">
                        <h6>Batting</h6>
                        <table className="scorecard-table">
                          <thead>
                            <tr>
                              <th>Batter</th>
                              <th>R</th>
                              <th>B</th>
                              <th>4s</th>
                              <th>6s</th>
                              <th>SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inning.batting.map((batter, batterIndex) => (
                              <tr key={batterIndex} className={!batter.isOut ? 'not-out' : ''}>
                                <td className="batter-name">
                                  {batter.playerName}
                                  {!batter.isOut && <span className="not-out-indicator">*</span>}
                                </td>
                                <td>{batter.runs || 0}</td>
                                <td>{batter.ballsFaced || 0}</td>
                                <td>{batter.fours || 0}</td>
                                <td>{batter.sixes || 0}</td>
                                <td>{batter.strikeRate ? batter.strikeRate.toFixed(2) : '0.00'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Bowling Table */}
                    {inning.bowling && inning.bowling.length > 0 && (
                      <div className="bowling-section">
                        <h6>Bowling</h6>
                        <table className="scorecard-table">
                          <thead>
                            <tr>
                              <th>Bowler</th>
                              <th>O</th>
                              <th>M</th>
                              <th>R</th>
                              <th>W</th>
                              <th>Econ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inning.bowling.map((bowler, bowlerIndex) => (
                              <tr key={bowlerIndex}>
                                <td className="bowler-name">{bowler.playerName}</td>
                                <td>{bowler.overs || 0}</td>
                                <td>{bowler.maidens || 0}</td>
                                <td>{bowler.runsConceded || 0}</td>
                                <td>{bowler.wickets || 0}</td>
                                <td>{bowler.economyRate ? bowler.economyRate.toFixed(2) : '0.00'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Fall of Wickets */}
                    {inning.fallOfWickets && inning.fallOfWickets.length > 0 && (
                      <div className="fall-of-wickets">
                        <h6>Fall of Wickets</h6>
                        <div className="wickets-list">
                          {inning.fallOfWickets.map((wicket, wicketIndex) => (
                            <span key={wicketIndex} className="wicket-item">
                              {wicket.score} ({wicket.playerName}, {wicket.over})
                              {wicketIndex < inning.fallOfWickets.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Yet to Bat */}
                    {inning.yetToBat && inning.yetToBat.length > 0 && (
                      <div className="yet-to-bat">
                        <h6>Yet to Bat</h6>
                        <div className="yet-to-bat-list">
                          {inning.yetToBat.map((player, playerIndex) => (
                            <span key={playerIndex} className="yet-to-bat-player">
                              {player.playerName}
                              {playerIndex < inning.yetToBat.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-innings">
              <p>No innings data available yet</p>
            </div>
          )}

          {scorecardData.result.resultLine && scorecardData.result.resultLine.message && (
            <div className="result-line">
              <h4>Match Status</h4>
              <p>{scorecardData.result.resultLine.message}</p>
            </div>
          )}
        </div>
      )}
        </div> {/* Close main-content */}
      </div> {/* Close match-layout-container */}
    </div>
  );
};

export default MatchDetails;
