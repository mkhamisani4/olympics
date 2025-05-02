import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Box, Alert, TablePagination, IconButton, TextField } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import axios from 'axios';

const tableConfigs = {
  athletes: {
    title: 'Olympic Athletes',
    endpoint: '/api/athletes',
    supportsDelete: true,
    supportsInsert: true,
    columns: [
      { id: 'athlete_id', label: 'ID', align: 'left' },
      { id: 'name', label: 'Name', align: 'left' },
      { id: 'sex', label: 'Sex', align: 'left' },
      { id: 'born', label: 'Born', align: 'left' },
      { id: 'height', label: 'Height', align: 'right' },
      { id: 'weight', label: 'Weight', align: 'right' },
      { id: 'country', label: 'Country', align: 'left' },
      { id: 'country_noc', label: 'NOC', align: 'left' },
      { id: 'description', label: 'Description', align: 'left' },
      { id: 'special_notes', label: 'Notes', align: 'left' }
    ]
  },
  athlete_events: {
    title: 'Athlete Events',
    endpoint: '/api/athlete_events',
    supportsDelete: true,
    supportsInsert: false,
    columns: [
      { id: 'edition', label: 'Edition', align: 'left' },
      { id: 'edition_id', label: 'Edition ID', align: 'right' },
      { id: 'country_noc', label: 'NOC', align: 'left' },
      { id: 'sport', label: 'Sport', align: 'left' },
      { id: 'event', label: 'Event', align: 'left' },
      { id: 'result_id', label: 'Result ID', align: 'right' },
      { id: 'athlete', label: 'Athlete', align: 'left' },
      { id: 'athlete_id', label: 'Athlete ID', align: 'right' },
      { id: 'pos', label: 'Position', align: 'right' },
      { id: 'medal', label: 'Medal', align: 'left' },
      { id: 'isteamsport', label: 'Team Sport', align: 'left' }
    ]
  },
  countries: {
    title: 'Olympic Countries',
    endpoint: '/api/countries',
    supportsDelete: false,
    supportsInsert: true,
    columns: [
      { id: 'noc', label: 'NOC', align: 'left' },
      { id: 'country', label: 'Country', align: 'left' }
    ]
  },
  events: {
    title: 'Olympic Events',
    endpoint: '/api/events',
    supportsDelete: false,
    supportsInsert: false,
    columns: [
      { id: 'result_id', label: 'Result ID', align: 'right' },
      { id: 'event_title', label: 'Event', align: 'left' },
      { id: 'edition', label: 'Edition', align: 'left' },
      { id: 'edition_id', label: 'Edition ID', align: 'right' },
      { id: 'sport', label: 'Sport', align: 'left' },
      { id: 'sport_url', label: 'Sport URL', align: 'left' },
      { id: 'result_date', label: 'Date', align: 'left' },
      { id: 'result_location', label: 'Location', align: 'left' },
      { id: 'result_participants', label: 'Participants', align: 'left' },
      { id: 'result_format', label: 'Format', align: 'left' },
      { id: 'result_detail', label: 'Detail', align: 'left' },
      { id: 'result_description', label: 'Description', align: 'left' }
    ]
  },
  games: {
    title: 'Olympic Games',
    endpoint: '/api/games',
    supportsDelete: false,
    supportsInsert: false,
    columns: [
      { id: 'edition', label: 'Edition', align: 'left' },
      { id: 'edition_id', label: 'Edition ID', align: 'right' },
      { id: 'year', label: 'Year', align: 'right' },
      { id: 'city', label: 'Host City', align: 'left' },
      { id: 'country_noc', label: 'Country', align: 'left' },
      { id: 'start_date', label: 'Opening Date', align: 'left' },
      { id: 'end_date', label: 'Closing Date', align: 'left' },
      { id: 'competition_date', label: 'Competition Dates', align: 'left' },
      { id: 'isHeld', label: 'Status', align: 'left' }
    ]
  },
  medals: {
    title: 'Olympic Medal Tally',
    endpoint: '/api/medals',
    supportsDelete: false,
    supportsInsert: false,
    columns: [
      { id: 'edition', label: 'Games', align: 'left' },
      { id: 'edition_id', label: 'Edition ID', align: 'right' },
      { id: 'year', label: 'Year', align: 'right' },
      { id: 'country', label: 'Country', align: 'left' },
      { id: 'country_noc', label: 'NOC', align: 'left' },
      { id: 'rank', label: 'Rank', align: 'right' },
      { id: 'gold', label: 'Gold', align: 'right' },
      { id: 'silver', label: 'Silver', align: 'right' },
      { id: 'bronze', label: 'Bronze', align: 'right' },
      { id: 'total', label: 'Total', align: 'right' }
    ]
  }
};

const OlympicsTable = ({ 
  tableType = 'medals', 
  searchQuery = '', 
  onQueryComplete,
  isInserting = false,
  onCancelInsert
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage] = useState(50);
  const [newRowData, setNewRowData] = useState({});
  const [editingRow, setEditingRow] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const config = tableConfigs[tableType];
      const response = await axios.get(`http://localhost:5000${config.endpoint}`, {
        params: {
          page: page + 1,
          per_page: rowsPerPage,
          search: searchQuery
        }
      });

      setData([...response.data.data]);
      setTotalCount(response.data.total);
      setError(null);
      
      const start = page * rowsPerPage + 1;
      const end = Math.min(start + rowsPerPage - 1, response.data.total);
      
      onQueryComplete?.(
        response.data.execution_time,
        response.data.total,
        start,
        end
      );
    } catch (err) {
      console.error('Error details:', err);
      const errorMessage = err.response 
        ? `Error: ${err.response.status} - ${err.response.statusText}`
        : err.message || 'Error fetching data. Please try again later.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tableType, page, rowsPerPage, onQueryComplete, searchQuery]);

  useEffect(() => {
    const config = tableConfigs[tableType];
    const emptyRow = {};
    config.columns.forEach(column => {
      emptyRow[column.id] = '';
    });
    setNewRowData(emptyRow);
  }, [tableType]);

  useEffect(() => {
    setPage(0);
    setSortConfig({ key: null, direction: null });
  }, [tableType, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData, page, tableType, searchQuery]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleUpdateRow = (row) => {
    setEditingRow(row);
    setEditRowData({ ...row });
  };

  const handleDeleteRow = async (row) => {
    if (!tableConfigs[tableType].supportsDelete) {
      setError('Delete operation is not supported for this table type');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this ${tableType === 'athletes' ? 'athlete' : 'record'}?`)) {
      return;
    }

    try {
      let endpoint = '';
      let deleteData = {};
      
      switch (tableType) {
        case 'athletes':
          endpoint = '/api/delete/athleteBio';
          deleteData = {
            athlete_id: row.athlete_id,
            name: row.name
          };
          break;
        case 'athlete_events':
          endpoint = '/api/delete/athleteEventDetails';
          deleteData = {
            edition_id: row.edition_id,
            result_id: row.result_id,
            athlete_id: row.athlete_id,
            pos: row.pos
          };
          break;
        default:
          setError('Delete not implemented for this table type');
          return;
      }

      const response = await axios.delete(`http://localhost:5000${endpoint}`, {
        data: deleteData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setPage(0);
        await fetchData();
      } else {
        setError(response.data.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete record';
      setError(errorMessage);
    }
  };

  const handleNewRowChange = (columnId, value) => {
    setNewRowData(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  const handleSaveNewRow = async () => {
    if (!tableConfigs[tableType].supportsInsert) {
      setError('Insert operation is not supported for this table type');
      return;
    }

    try {
      const insertData = {};
      Object.keys(newRowData).forEach(key => {
        if (newRowData[key] !== '') {
          insertData[key] = newRowData[key];
        }
      });

      if (Object.keys(insertData).length === 0) {
        setError('Please fill in at least one field');
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/insert/${tableType}`,
        insertData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setPage(0);
        await fetchData();
        if (onCancelInsert) onCancelInsert();
      } else {
        setError(response.data.error || 'Failed to insert record');
      }
    } catch (error) {
      console.error('Error inserting row:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to insert record';
      setError(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditRowData({});
  };

  const handleEditRowChange = (columnId, value) => {
    setEditRowData(prev => ({
      ...prev,
      [columnId]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      let endpoint = '';
      let params = [];
      
      switch (tableType) {
        case 'athletes':
          endpoint = '/api/update/athleteBio';
          params = [
            editRowData.athlete_id,
            editRowData.name,
            editRowData.sex,
            editRowData.born,
            editRowData.height,
            editRowData.weight,
            editRowData.country,
            editRowData.country_noc,
            editRowData.description,
            editRowData.special_notes
          ];
          break;
        case 'athlete_events':
          endpoint = '/api/update/athleteEventDetails';
          params = [
            editRowData.edition,
            editRowData.edition_id,
            editRowData.country_noc,
            editRowData.event,
            editRowData.result_id,
            editRowData.athlete,
            editRowData.athlete_id,
            editRowData.pos,
            editRowData.medal
          ];
          break;
        default:
          console.error('Update not implemented for this table type');
          return;
      }

      const response = await axios.put(`http://localhost:5000${endpoint}`, editRowData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setEditingRow(null);
        setEditRowData({});
        setPage(0);
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating row:', error);
      setError('Failed to update record. Please try again.');
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ key, direction });
  };

  const resetSort = () => {
    setSortConfig({ key: null, direction: null });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px" sx={{ width: '100%', maxWidth: 800, margin: 'auto' }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please check yo backend
          </Typography>
        </Alert>
      </Box>
    );
  }

  const config = tableConfigs[tableType];
  let filteredData = searchQuery
    ? data.filter(row => 
        Object.values(row)
          .some(value => 
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : data;

  if (sortConfig.key && sortConfig.direction) {
    filteredData = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
        return sortConfig.direction === 'asc' 
          ? parseFloat(aValue) - parseFloat(bValue) 
          : parseFloat(bValue) - parseFloat(aValue);
      }
      
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '90%', margin: 'auto', mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          p: 2,
          position: 'relative'
        }}>
          <Typography 
            variant="h4" 
            component="h2" 
            sx={{
              fontFamily: "'HelveticaNeue', sans-serif",
              fontWeight: '600',
              fontSize: '32px',
              letterSpacing: '-0.5px',
              textAlign: 'center'
            }}
          >
            {config.title}
          </Typography>
          {sortConfig.key && (
            <div style={{ position: 'absolute', right: '16px' }}>
              <button 
                className="action-button insert-button"
                onClick={resetSort}
              >
                Reset Order
              </button>
            </div>
          )}
        </Box>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="olympics data table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {config.columns.map(column => (
                  <TableCell 
                    key={column.id} 
                    align={column.align}
                    onClick={() => requestSort(column.id)}
                    sx={{ 
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover': { backgroundColor: '#e0e0e0' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: column.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {column.label}
                      {sortConfig.key === column.id && sortConfig.direction === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                      )}
                      {sortConfig.key === column.id && sortConfig.direction === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                      )}
                    </Box>
                  </TableCell>
                ))}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isInserting && tableConfigs[tableType].supportsInsert && (
                <TableRow>
                  {config.columns.map(column => (
                    <TableCell key={column.id} align={column.align}>
                      <TextField
                        size="small"
                        fullWidth
                        value={newRowData[column.id] || ''}
                        onChange={(e) => handleNewRowChange(column.id, e.target.value)}
                        placeholder={column.label}
                        variant="outlined"
                      />
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <IconButton 
                      color="success" 
                      onClick={handleSaveNewRow}
                      size="small"
                    >
                      <CheckIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={onCancelInsert}
                      size="small"
                    >
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )}
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    {editingRow === row ? (
                      <>
                        {config.columns.map(column => (
                          <TableCell key={column.id} align={column.align}>
                            <TextField
                              size="small"
                              fullWidth
                              value={editRowData[column.id] || ''}
                              onChange={(e) => handleEditRowChange(column.id, e.target.value)}
                              placeholder={column.label}
                              variant="outlined"
                            />
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <IconButton 
                            color="success" 
                            onClick={handleSaveEdit}
                            size="small"
                          >
                            <CheckIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={handleCancelEdit}
                            size="small"
                          >
                            <CancelIcon />
                          </IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        {config.columns.map(column => (
                          <TableCell key={column.id} align={column.align}>
                            {row[column.id] === null || row[column.id] === undefined || row[column.id] === '' ? 
                              "--" : 
                              column.id === 'country' ? `${row.country} (${row.country_noc})` : row[column.id]
                            }
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton 
                              className="update-icon" 
                              size="small" 
                              onClick={() => handleUpdateRow(row)}
                              sx={{ 
                                visibility: 'hidden', 
                                '&:hover': { color: '#1565c0' },
                                '.MuiTableRow-root:hover &': { visibility: 'visible' }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {tableConfigs[tableType].supportsDelete && (
                              <IconButton 
                                className="delete-icon" 
                                size="small" 
                                onClick={() => handleDeleteRow(row)}
                                sx={{ 
                                  visibility: 'hidden', 
                                  '&:hover': { color: '#e53935' },
                                  '.MuiTableRow-root:hover &': { visibility: 'visible' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={config.columns.length + 1} align="center" sx={{ py: 4 }}>
                    <Typography variant="h6" color="textSecondary">
                      No results found
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {searchQuery ? `No matches for "${searchQuery}"` : "No data available"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
        />
      </Paper>
    </Box>
  );
};

export default OlympicsTable; 