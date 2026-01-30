// App.jsx
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './App.css';

const EXCEL_FILE_PATH = '/data/players.xlsx';

function App() {
  const [allData, setAllData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [sortCol, setSortCol] = useState(-1);
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Find keys for specific columns
  const roleKey = headers.find(h => h.toLowerCase().includes('role')) || '';
  const teamKey = headers.find(h => h.toLowerCase().includes('team')) || '';
  const regionKey = headers.find(h => h.toLowerCase().includes('region')) || '';

  // Load Excel file on mount
  useEffect(() => {
    async function loadExcelFile() {
      try {
        const response = await fetch(EXCEL_FILE_PATH);
        if (!response.ok) throw new Error(`Could not load file: ${EXCEL_FILE_PATH}`);
        
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (json.length > 0) {
          const hdrs = json[0].map(h => String(h || '').trim());
          setHeaders(hdrs);
          
          const rows = json.slice(1).map(row => {
            const obj = {};
            hdrs.forEach((h, i) => obj[h] = row[i] || '');
            return obj;
          }).filter(row => Object.values(row).some(v => v !== ''));
          
          setAllData(rows);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    loadExcelFile();
  }, []);

  // Get unique values for filters
  const roles = [...new Set(allData.map(d => d[roleKey]).filter(Boolean))].sort();
  const teams = [...new Set(allData.map(d => d[teamKey]).filter(Boolean))].sort();
  const regions = [...new Set(allData.map(d => d[regionKey]).filter(Boolean))].sort();

  // Filter data
  const filteredData = allData.filter(row => {
    const matchSearch = !search || Object.values(row).some(v => 
      String(v).toLowerCase().includes(search.toLowerCase())
    );
    const matchRole = !roleFilter || row[roleKey] === roleFilter;
    const matchTeam = !teamFilter || row[teamKey] === teamFilter;
    const matchRegion = !regionFilter || row[regionKey] === regionFilter;
    return matchSearch && matchRole && matchTeam && matchRegion;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortCol < 0) return 0;
    const key = headers[sortCol];
    let va = a[key], vb = b[key];
    if (!isNaN(va) && !isNaN(vb)) { va = Number(va); vb = Number(vb); }
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  // Handle sort click
  const handleSort = (colIndex) => {
    if (sortCol === colIndex) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
  };

function parseGoogleSheetsDate(serialNumber) {
  if (!serialNumber) return '';
  
  // Google Sheets epoch is December 30, 1899
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serialNumber * 86400000);
  
  return date.toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
}

  // Get role badge class
  const getRoleClass = (role) => {
    return 'role-' + role.toLowerCase().replace(/[^a-z]/g, '');
  };

  if (loading) {
    return <div className="container"><div className="no-data">Loading data...</div></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <strong>Error loading file:</strong> {error}<br /><br />
          <strong>Tips:</strong><br />
          • Make sure the file exists at: <code>{EXCEL_FILE_PATH}</code><br />
          • Place your Excel file in the <code>public/data/</code> folder
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>🎮 Danish LoL Players</h1>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <div className="number">{allData.length}</div>
          <div className="label">Total Players</div>
        </div>
        <div className="stat-card">
          <div className="number">{teams.length}</div>
          <div className="label">Teams</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>🔍 Search</label>
          <input
            type="text"
            placeholder="Search players, teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>🎯 Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {roles.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>👥 Team</label>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All Teams</option>
            {teams.map(team => <option key={team} value={team}>{team}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>🌍 Region</label>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="">All Regions</option>
            {regions.map(region => <option key={region} value={region}>{region}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={header}
                  onClick={() => handleSort(i)}
                  className={sortCol === i ? (sortAsc ? 'sort-asc' : 'sort-desc') : ''}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr><td className="no-data" colSpan={headers.length}>No matching records found</td></tr>
            ) : (
              sortedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map(header => {
                    let val = row[header] || '';
                    
                    // Role badge
                    if (header === roleKey && val) {
                      return (
                        <td key={header}>
                          <span className={`role-badge ${getRoleClass(val)}`}>{val}</span>
                        </td>
                      );
                    }

                    if (header=="Birthday") {
                      return (
                        <td key={header}>
                          {parseGoogleSheetsDate(val)}
                        </td>
                      )
                    }
                    
                    return <td key={header}>{val}</td>; 
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;