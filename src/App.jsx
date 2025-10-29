import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LiveMatchesList from './components/LiveMatchesList';
import MatchDetails from './components/MatchDetails';
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LiveMatchesList />} />
          <Route path="/match/:matchId" element={<MatchDetails />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
