import './App.css';
import olympicsLogo from './Olympics_logo.png';
import { useState, useCallback } from 'react';
import OlympicsTable from './components/OlympicsTable';
import MedalMap from './components/MedalMap';

const INSERTABLE_TABLES = ['athletes', 'countries'];

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const [queryTime, setQueryTime] = useState(null);
  const [selectedTable, setSelectedTable] = useState('medals');
  const [resultCount, setResultCount] = useState(null);
  const [currentRange, setCurrentRange] = useState({ start: 1, end: 50 });
  const [isInserting, setIsInserting] = useState(false);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleTableSelect = (e) => {
    setSelectedTable(e.target.value);
    setQueryTime(null);
    setResultCount(null);
    setCurrentRange({ start: 1, end: 50 });
    setIsInserting(false);
  };

  const handleInsert = () => {
    setIsInserting(true);
  };

  const handleCancelInsert = () => {
    setIsInserting(false);
  };

  const handleQueryComplete = useCallback((time, total, start, end) => {
    setQueryTime(time);
    setResultCount(total);
    setCurrentRange({ start, end });
  }, []);

  const canInsert = INSERTABLE_TABLES.includes(selectedTable);

  return (
    <div className="App">
      <header className="App-header">
        <img src={olympicsLogo} className="App-logo" alt="Olympics Logo" />
        <h1 className="title">Olympics</h1>
      </header>
      <div className="search-container">
        <select 
          className="table-select" 
          value={selectedTable} 
          onChange={handleTableSelect}
        >
          <option value="athletes">Athletes</option>
          <option value="athlete_events">Athlete Events</option>
          <option value="countries">Countries</option>
          <option value="events">Events</option>
          <option value="games">Games</option>
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
      <div className="action-buttons-container">
        <button 
          className={`action-button insert-button ${!canInsert ? 'disabled' : ''}`} 
          onClick={handleInsert}
          disabled={!canInsert}
          title={canInsert ? "Add a new record" : "Insertion not supported for this table"}
        >
          Insert
        </button>
      </div>
      {queryTime !== null && (
        <div className={`results-timing visible`}>
          Showing {currentRange.start.toLocaleString()}-{Math.min(currentRange.end, resultCount).toLocaleString()} of {resultCount?.toLocaleString()} results ({queryTime.toFixed(3)} seconds)
        </div>
      )}
      {!isMapView ? 
        <OlympicsTable 
          tableType={selectedTable} 
          searchQuery={searchQuery}
          onQueryComplete={handleQueryComplete}
          isInserting={isInserting}
          onCancelInsert={handleCancelInsert}
        /> : 
        selectedTable === 'medals' ? 
          <MedalMap 
            searchQuery={searchQuery}
            onQueryComplete={handleQueryComplete}
          /> :
          <div className="map-not-available">
            <p>Map view is only available for Medal data.</p>
            <button onClick={() => setSelectedTable('medals')}>Switch to Medal Data</button>
          </div>
      }
    </div>
  );
}

export default App;
