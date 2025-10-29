import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { filterTodayMatches, formatDateTime } from '../utils/dateUtils';

const LiveMatchesList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/live-matches');
      const data = await response.json();
      if (data.success) {
        setMatches(data.data);
      } else {
        setError('Failed to fetch matches');
      }
    } catch (err) {
      setError('Error fetching matches: ' + err.message);
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
        <p>Loading live matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchMatches} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="live-matches">
      <div className="header">
        <h1>Live Cricket Matches</h1>
        <p>Watch live scores and match updates</p>
      </div>

      {(() => {
        const todayMatches = filterTodayMatches(matches);
        return todayMatches.length === 0 ? (
          <div className="no-matches">
            <h3>No live matches today</h3>
            <p>Check back later for today's matches</p>
          </div>
        ) : (
          <div className="matches-grid">
            {todayMatches.map((match) => (
            <Link
              key={match._id}
              to={`/match/${match._id}`}
              className="match-card"
            >
              <div className="match-header">
                <span className="match-format">{getFormatName(match.format)}</span>
                <span className="live-badge">LIVE</span>
              </div>

              <div className="teams-section">
                <div className="team">
                  <img src={match.teams.t1.logo} alt={match.teams.t1.name} className="team-logo" />
                  <div className="team-info">
                    <h3 className="team-name">{match.teams.t1.name}</h3>
                    <span className="team-score">{match.teams.t1.score || 'Yet to bat'}</span>
                  </div>
                </div>

                <div className="vs-text">VS</div>

                <div className="team">
                  <img src={match.teams.t2.logo} alt={match.teams.t2.name} className="team-logo" />
                  <div className="team-info">
                    <h3 className="team-name">{match.teams.t2.name}</h3>
                    <span className="team-score">{match.teams.t2.score || 'Yet to bat'}</span>
                  </div>
                </div>
              </div>

              <div className="match-details">
                <h4 className="match-name">{match.name}</h4>
                <p className="ground">{match.ground}</p>
                <p className="match-time">{formatDateTime(match.timestamp)}</p>
              </div>
            </Link>
            ))}
          </div>
        );
      })()}
    </div>
  );
};

export default LiveMatchesList;
