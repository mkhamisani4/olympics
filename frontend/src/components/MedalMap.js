import React, { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Sphere, Graticule, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Box, Typography, CircularProgress, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import axios from 'axios';
import ReactTooltip from 'react-tooltip';
import geoData from '../countriesGeoJsonData.json';

const nocToIsoMap = {
  "AFG": "AFG", "ALB": "ALB", "ALG": "DZA", "AND": "AND", "ANG": "AGO",
  "ANT": "ATG", "ARG": "ARG", "ARM": "ARM", "ARU": "ABW", "ASA": "ASM",
  "AUS": "AUS", "AUT": "AUT", "AZE": "AZE", "BAH": "BHS", "BAN": "BGD",
  "BAR": "BRB", "BDI": "BDI", "BEL": "BEL", "BEN": "BEN", "BER": "BMU",
  "BHU": "BTN", "BIH": "BIH", "BIZ": "BLZ", "BLR": "BLR", "BOL": "BOL",
  "BOT": "BWA", "BRA": "BRA", "BRN": "BHR", "BRU": "BRN", "BUL": "BGR",
  "BUR": "BFA", "CAF": "CAF", "CAM": "KHM", "CAN": "CAN", "CAY": "CYM",
  "CGO": "COG", "CHA": "TCD", "CHI": "CHL", "CHN": "CHN", "CIV": "CIV",
  "CMR": "CMR", "COD": "COD", "COK": "COK", "COL": "COL", "COM": "COM",
  "CPV": "CPV", "CRC": "CRI", "CRO": "HRV", "CUB": "CUB", "CYP": "CYP",
  "CZE": "CZE", "DEN": "DNK", "DJI": "DJI", "DMA": "DMA", "DOM": "DOM",
  "ECU": "ECU", "EGY": "EGY", "ERI": "ERI", "ESA": "SLV", "ESP": "ESP",
  "EST": "EST", "ETH": "ETH", "FIJ": "FJI", "FIN": "FIN", "FRA": "FRA",
  "FSM": "FSM", "GAB": "GAB", "GAM": "GMB", "GBR": "GBR", "GBS": "GNB",
  "GEO": "GEO", "GEQ": "GNQ", "GER": "DEU", "GHA": "GHA", "GRE": "GRC",
  "GRN": "GRD", "GUA": "GTM", "GUI": "GIN", "GUM": "GUM", "GUY": "GUY",
  "HAI": "HTI", "HKG": "HKG", "HON": "HND", "HUN": "HUN", "INA": "IDN",
  "IND": "IND", "IRI": "IRN", "IRL": "IRL", "IRQ": "IRQ", "ISL": "ISL",
  "ISR": "ISR", "ISV": "VIR", "ITA": "ITA", "IVB": "VGB", "JAM": "JAM",
  "JOR": "JOR", "JPN": "JPN", "KAZ": "KAZ", "KEN": "KEN", "KGZ": "KGZ",
  "KIR": "KIR", "KOR": "KOR", "KOS": "XKX", "KSA": "SAU", "KUW": "KWT",
  "LAO": "LAO", "LAT": "LVA", "LBA": "LBY", "LBN": "LBN", "LBR": "LBR",
  "LCA": "LCA", "LES": "LSO", "LIE": "LIE", "LTU": "LTU", "LUX": "LUX",
  "MAD": "MDG", "MAR": "MAR", "MAS": "MYS", "MAW": "MWI", "MDA": "MDA",
  "MDV": "MDV", "MEX": "MEX", "MGL": "MNG", "MHL": "MHL", "MKD": "MKD",
  "MLI": "MLI", "MLT": "MLT", "MNE": "MNE", "MON": "MCO", "MOZ": "MOZ",
  "MRI": "MUS", "MTN": "MRT", "MYA": "MMR", "NAM": "NAM", "NCA": "NIC",
  "NED": "NLD", "NEP": "NPL", "NGR": "NGA", "NIG": "NER", "NOR": "NOR",
  "NRU": "NRU", "NZL": "NZL", "OMA": "OMN", "PAK": "PAK", "PAN": "PAN",
  "PAR": "PRY", "PER": "PER", "PHI": "PHL", "PLE": "PSE", "PLW": "PLW",
  "PNG": "PNG", "POL": "POL", "POR": "PRT", "PRK": "PRK", "PUR": "PUR",
  "QAT": "QAT", "ROU": "ROU", "RSA": "ZAF", "RUS": "RUS", "RWA": "RWA",
  "SAM": "WSM", "SEN": "SEN", "SEY": "SYC", "SGP": "SGP", "SKN": "KNA",
  "SLE": "SLE", "SLO": "SVN", "SMR": "SMR", "SOL": "SLB", "SOM": "SOM",
  "SRB": "SRB", "SRI": "LKA", "SSD": "SSD", "STP": "STP", "SUD": "SDN",
  "SUI": "CHE", "SUR": "SUR", "SVK": "SVK", "SWE": "SWE", "SWZ": "SWZ",
  "SYR": "SYR", "TAN": "TZA", "TGA": "TON", "THA": "THA", "TJK": "TJK",
  "TKM": "TKM", "TLS": "TLS", "TOG": "TGO", "TPE": "TWN", "TTO": "TTO",
  "TUN": "TUN", "TUR": "TUR", "TUV": "TUV", "UAE": "ARE", "UGA": "UGA",
  "UKR": "UKR", "URU": "URY", "USA": "USA", "UZB": "UZB", "VAN": "VUT", 
  "VEN": "VEN", "VIE": "VNM", "VIN": "VCT", "YEM": "YEM", "ZAM": "ZMB",
  "ZIM": "ZWE"
};

const MedalMap = ({ tableType = 'medals', searchQuery = '', onQueryComplete }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medalType, setMedalType] = useState('total');
  const [rowsPerPage] = useState(250); 

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/medals`, {
        params: {
          page: 1,
          per_page: rowsPerPage
        }
      });

      setData([...response.data.data]);
      setError(null);
      
      onQueryComplete?.(
        response.data.execution_time,
        response.data.total,
        1,
        Math.min(rowsPerPage, response.data.total)
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
  }, [rowsPerPage, onQueryComplete]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    ReactTooltip.rebuild();
  }, [data, medalType]);

  const processedData = data.reduce((acc, country) => {
    const countryNoc = country.country_noc;
    
    if (!nocToIsoMap[countryNoc]) return acc;
    
    const iso = nocToIsoMap[countryNoc];
    
    const goldCount = country.gold || 0;
    const silverCount = country.silver || 0;
    const bronzeCount = country.bronze || 0;
    const totalCount = country.total || 0;
    
    let medalCount;
    switch(medalType) {
      case 'gold':
        medalCount = goldCount;
        break;
      case 'silver':
        medalCount = silverCount;
        break;
      case 'bronze':
        medalCount = bronzeCount;
        break;
      default:
        medalCount = totalCount;
    }
    
    if (!acc[iso]) {
      acc[iso] = {
        medals: medalCount,
        gold: goldCount,
        silver: silverCount,
        bronze: bronzeCount,
        total: totalCount,
        name: country.country
      };
    } else {
      acc[iso].medals += medalCount;
      acc[iso].gold += goldCount;
      acc[iso].silver += silverCount;
      acc[iso].bronze += bronzeCount;
      acc[iso].total += totalCount;
    }
    
    return acc;
  }, {});

  const maxMedals = Object.values(processedData).length > 0 
    ? Math.max(...Object.values(processedData).map(d => d.medals)) 
    : 0;

  const colorScale = scaleLinear()
    .domain([0, maxMedals])
    .range(["#CFD8DC", "#102693"]);

  const handleMedalTypeChange = (event) => {
    setMedalType(event.target.value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel id="medal-type-label">Medal Type</InputLabel>
          <Select
            labelId="medal-type-label"
            id="medal-type-select"
            value={medalType}
            onChange={handleMedalTypeChange}
            label="Medal Type"
          >
            <MenuItem value="total">Total Medals</MenuItem>
            <MenuItem value="gold">Gold Medals</MenuItem>
            <MenuItem value="silver">Silver Medals</MenuItem>
            <MenuItem value="bronze">Bronze Medals</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ 
        height: '650px', 
        width: '100%', 
        border: '1px solid #ccc', 
        borderRadius: '8px', 
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: '#F7F9FC'
      }}>
        <ReactTooltip 
          html={true}
          backgroundColor="#333"
          textColor="#fff"
        />
        <ComposableMap
          data-tip=""
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 150
          }}
          width={980}
          height={600}
          style={{ 
            width: "100%", 
            height: "100%"
          }}
        >
          <ZoomableGroup center={[0, 5]} zoom={1.4}>
            <Sphere stroke="#E4E5E6" strokeWidth={0.5} />
            <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
            
            <Geographies geography={geoData}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const id = geo.id;
                  const countryData = processedData[id] || { medals: 0, gold: 0, silver: 0, bronze: 0, total: 0, name: geo.properties?.name };
                  
                  const tooltipHtml = countryData.name ? 
                    `<div style="text-align:center;margin:0;padding:0">
                      <strong>${countryData.name}</strong><br/>
                      Gold: ${countryData.gold}<br/>
                      Silver: ${countryData.silver}<br/>
                      Bronze: ${countryData.bronze}<br/>
                      Total: ${countryData.total}
                    </div>` : "";
                  
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={countryData.medals > 0 ? colorScale(countryData.medals) : "#F5F4F6"}
                      stroke="#555"
                      strokeWidth={0.4}
                      style={{
                        default: {
                          outline: "none"
                        },
                        hover: {
                          fill: "#999", 
                          outline: "none",
                          stroke: "#333",
                          strokeWidth: 0.7
                        },
                        pressed: {
                          outline: "none"
                        }
                      }}
                      data-tip={tooltipHtml}
                      onMouseEnter={() => {
                      }}
                      onMouseLeave={() => {
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </Box>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          {medalType === 'total' ? 'Total Olympic Medals' : 
           medalType === 'gold' ? 'Gold Olympic Medals' : 
           medalType === 'silver' ? 'Silver Olympic Medals' : 'Bronze Olympic Medals'}
          {' '}by Country
        </Typography>
      </Box>
    </Box>
  );
};

export default MedalMap; 