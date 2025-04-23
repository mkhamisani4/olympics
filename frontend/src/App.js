import './App.css';
import olympicsLogo from './Olympics_logo.png';
import { useState } from 'react';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const [searchTime, setSearchTime] = useState(null);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query) {
      // testing only
      setSearchTime(Math.random() * 0.5 + 0.1);
    } else {
      setSearchTime(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={olympicsLogo} className="App-logo" alt="Olympics Logo" />
        <h1 className="title">Olympics</h1>
      </header>
      <div className="search-container">
        <select className="table-select">
          <option value="athletes">Athletes</option>
          <option value="events">Events</option>
          <option value="medals">Medals</option>
        </select>
        <input 
          type="text" 
          className="search-bar" 
          placeholder="Search Olympic records"
          value={searchQuery}
          onChange={handleSearch}
        />
        <div className="view-toggle" onClick={() => setIsMapView(!isMapView)}>
          <div className={`toggle-background ${isMapView ? 'map' : ''}`}></div>
          <span className={`toggle-option ${!isMapView ? 'active' : ''}`}>Table</span>
          <span className={`toggle-option ${isMapView ? 'active' : ''}`}>Map</span>
        </div>
      </div>
      {searchTime && (
        <div className={`results-timing ${searchTime ? 'visible' : ''}`}>
          About {searchQuery.split(' ').length * 100} results ({searchTime.toFixed(2)} seconds)
        </div>
      )}
    </div>
  );
}

export default App;
