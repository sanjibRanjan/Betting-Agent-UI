import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDateTime } from '../utils/dateUtils';

const MatchDetails = () => {
  const { matchId } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/matches/${matchId}`);
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

      <div className="match-info-section">
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

      {scorecardData && scorecardData.result && scorecardData.result.teams && (
        <div className="scorecard-section">
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
                  <h5>Inning {index + 1}</h5>
                  <div className="inning-details">
                    {/* Add more inning details here when available */}
                    <p>Inning data will be displayed here</p>
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
    </div>
  );
};

export default MatchDetails;
