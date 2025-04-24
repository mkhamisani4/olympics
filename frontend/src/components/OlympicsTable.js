import React, { useState, useEffect } from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Box, Alert, TablePagination } from '@mui/material';
import axios from 'axios';

const tableConfigs = {
  athletes: {
    title: 'Olympic Athletes',
    endpoint: '/api/athletes',
    columns: [
      { id: 'name', label: 'Name', align: 'left' },
      { id: 'gender', label: 'Gender', align: 'left' },
      { id: 'height', label: 'Height', align: 'right' },
      { id: 'weight', label: 'Weight', align: 'right' },
      { id: 'birth_date', label: 'Birth Date', align: 'left' }
    ]
  },
  athlete_events: {
    title: 'Athlete Events',
    endpoint: '/api/athlete_events',
    columns: [
      { id: 'athlete', label: 'Athlete', align: 'left' },
      { id: 'age', label: 'Age', align: 'right' },
      { id: 'medal', label: 'Medal', align: 'left' }
    ]
  },
  countries: {
    title: 'Olympic Countries',
    endpoint: '/api/countries',
    columns: [
      { id: 'country', label: 'Country', align: 'left' },
      { id: 'noc', label: 'NOC', align: 'left' },
      { id: 'notes', label: 'Notes', align: 'left' }
    ]
  },
  events: {
    title: 'Olympic Events',
    endpoint: '/api/events',
    columns: [
      { id: 'event_title', label: 'Event', align: 'left' },
      { id: 'sport', label: 'Sport', align: 'left' },
      { id: 'edition', label: 'Games', align: 'left' },
      { id: 'result_date', label: 'Date', align: 'left' },
      { id: 'result_location', label: 'Location', align: 'left' },
      { id: 'result_description', label: 'Result', align: 'left' }
    ]
  },
  games: {
    title: 'Olympic Games',
    endpoint: '/api/games',
    columns: [
      { id: 'edition', label: 'Games', align: 'left' },
      { id: 'year', label: 'Year', align: 'right' },
      { id: 'host_city', label: 'Host City', align: 'left' },
      { id: 'nations', label: 'Nations', align: 'right' },
      { id: 'participants', label: 'Total Athletes', align: 'right' },
      { id: 'events', label: 'Events', align: 'right' }
    ]
  },
  medals: {
    title: 'Olympic Medal Tally',
    endpoint: '/api/medals',
    columns: [
      { id: 'country_name', label: 'Country', align: 'left' },
      { id: 'edition_id', label: 'Games', align: 'left' },
      { id: 'rank', label: 'Rank', align: 'right' },
      { id: 'gold', label: 'Gold', align: 'right' },
      { id: 'silver', label: 'Silver', align: 'right' },
      { id: 'bronze', label: 'Bronze', align: 'right' },
      { id: 'total', label: 'Total', align: 'right' }
    ]
  }
};

const OlympicsTable = ({ tableType = 'medals', searchQuery = '', onQueryComplete }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage] = useState(50);

  // handling table type changes
  useEffect(() => {
    setPage(0); 
  }, [tableType]);

  //fetching data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const config = tableConfigs[tableType];
        const response = await axios.get(`http://localhost:5000${config.endpoint}`, {
          params: {
            page: page + 1,
            per_page: rowsPerPage
          }
        });
        setData(response.data.data);
        setTotalCount(response.data.total);
        setError(null);
        
        const start = page * rowsPerPage + 1;
        const end = start + rowsPerPage - 1;
        
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
    };

    fetchData();
  }, [tableType, page, rowsPerPage, onQueryComplete]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
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
            Please ensure the backend server is running on port 5000 and try refreshing the page.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const config = tableConfigs[tableType];
  const filteredData = searchQuery
    ? data.filter(row => 
        Object.values(row)
          .some(value => 
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : data;

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, margin: 'auto', mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Typography variant="h4" component="h2" sx={{ p: 2 }}>
          {config.title}
        </Typography>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="olympics data table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                {config.columns.map(column => (
                  <TableCell key={column.id} align={column.align}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {config.columns.map(column => (
                    <TableCell key={column.id} align={column.align}>
                      {column.id === 'country' ? `${row.country} (${row.country_noc})` : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
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