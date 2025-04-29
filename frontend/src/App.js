import './App.css';
import olympicsLogo from './Olympics_logo.png';
import { useState, useCallback } from 'react';
import OlympicsTable from './components/OlympicsTable';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapView, setIsMapView] = useState(false);
  const [queryTime, setQueryTime] = useState(null);
  const [selectedTable, setSelectedTable] = useState('medals');
  const [resultCount, setResultCount] = useState(null);
  const [currentRange, setCurrentRange] = useState({ start: 1, end: 50 });
  
  const [popupType, setPopupType] = useState(null); // for insert update delete
  const [modeSelect, setModeSelect] = useState('select');

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleTableSelect = (e) => {
    setSelectedTable(e.target.value);
    setQueryTime(null);
    setResultCount(null);
    setCurrentRange({ start: 1, end: 50 });
  };

  const handleMode = (e) => {
    const mode = e.target.value;
    setModeSelect(mode); 
  
    if (mode === 'insert') {
      setPopupType('insert');
    } else if (mode === 'update') {
      setPopupType('update');
    } else if (mode === 'delete') {
      setPopupType('delete');
    } else {
      setPopupType(null);
    }
  };

  const handleQueryComplete = useCallback((time, total, start, end) => {
    setQueryTime(time);
    setResultCount(total);
    setCurrentRange({ start, end });
  }, []);

  return (
    <>
      {popupType && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>{popupType.charAt(0).toUpperCase() + popupType.slice(1)} Player</h2>
            <input type="text" placeholder="Athlete Name" />
            <input type="text" placeholder="Height" />
            <input type="text" placeholder="Weight" />
          </div>
        </div>
      )}

      <div className="App">
        <header className="App-header">
          <img src={olympicsLogo} className="App-logo" alt="Olympics Logo" />
          <h1 className="title">Olympics</h1>
          <div className="mode-select-container">
            <select 
              className="mode-select" 
              value={modeSelect} 
              onChange={handleMode}
            >
              <option value="select">Select</option>
              <option value="insert">Insertdontclickrn</option> 
              <option value="update">Updatedontclickrn</option>
              <option value="delete">Deletedontclickrn</option>
            </select>
          </div>
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
        {queryTime !== null && (
          <div className={`results-timing visible`}>
            Showing {currentRange.start.toLocaleString()}-{Math.min(currentRange.end, resultCount).toLocaleString()} of {resultCount?.toLocaleString()} results ({queryTime.toFixed(3)} seconds)
          </div>
        )}
        {!isMapView && <OlympicsTable 
          tableType={selectedTable} 
          searchQuery={searchQuery}
          onQueryComplete={handleQueryComplete}
        />}
      </div>
    </>
  );
}

export default App;
