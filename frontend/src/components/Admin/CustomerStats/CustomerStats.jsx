import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Paper, Typography, Grid, FormControl, InputLabel, 
  Select, MenuItem, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as XLSX from 'xlsx';
import styles from './CustomerStats.module.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

const CustomerStats = () => {
  // States for data and UI
  const [customerStats, setCustomerStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for filters
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'

  // Fetch customer stats data from API
  const fetchCustomerStats = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('tokenJWT');
    const headerAuth = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/chat/customer-stats`, headerAuth);

      // Transform data - ensure date objects are properly created
      const transformedData = response.data.map(item => ({
        ...item,
        date: item.date,
        dateObj: new Date(item.date),
        totalCustomers: Number(item.totalCustomers),
        newCustomers: Number(item.newCustomers),
        growthPercentage: Number(item.growthPercentage)
      }));
      
      setCustomerStats(transformedData);
      setFilteredStats(transformedData);
    } catch (err) {
      console.error("Error fetching customer stats:", err);
      setError("Không thể tải dữ liệu thống kê khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchCustomerStats();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, viewMode, customerStats]);

  // Function to apply filters
  const applyFilters = () => {
    let filtered = [...customerStats];
    
    // Apply date range filter
    if (startDate) {
      filtered = filtered.filter(item => item.dateObj >= startDate);
    }
    
    if (endDate) {
      const endDatePlusOne = new Date(endDate);
      endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
      filtered = filtered.filter(item => item.dateObj < endDatePlusOne);
    }
    
    // Apply view mode (daily or monthly)
    if (viewMode === 'monthly' && filtered.length > 0) {
      // Group by month
      const monthlyData = {};
      
      filtered.forEach(item => {
        const date = item.dateObj;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            date: monthKey,
            dateObj: new Date(date.getFullYear(), date.getMonth(), 1),
            totalCustomers: 0,
            newCustomers: 0,
            growthPercentage: 0,
            daysCount: 0
          };
        }
        
        monthlyData[monthKey].totalCustomers = Math.max(monthlyData[monthKey].totalCustomers, item.totalCustomers);
        monthlyData[monthKey].newCustomers += item.newCustomers;
        monthlyData[monthKey].daysCount += 1;
      });
      
      // Calculate monthly growth percentages
      const monthlyArray = Object.values(monthlyData);
      monthlyArray.sort((a, b) => a.dateObj - b.dateObj);
      
      // Calculate growth percentage for monthly data
      monthlyArray.forEach((item, index) => {
        if (index > 0) {
          const prevMonth = monthlyArray[index - 1];
          item.growthPercentage = prevMonth.totalCustomers 
            ? ((item.totalCustomers - prevMonth.totalCustomers) / prevMonth.totalCustomers) * 100 
            : 0;
        } else {
          item.growthPercentage = 0;
        }
      });
      
      filtered = monthlyArray;
    }
    
    setFilteredStats(filtered);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return viewMode === 'daily' 
        ? format(date, 'dd/MM/yyyy')
        : format(date, 'MM/yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    // Format data for Excel
    const excelData = filteredStats.map(item => ({
      'Ngày': formatDate(item.date),
      'Tổng số khách': item.totalCustomers,
      'Khách hàng mới': item.newCustomers,
      '% Tăng trưởng': `${item.growthPercentage?.toFixed(2)}%`
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống kê khách hàng');
    
    // Generate Excel file
    XLSX.writeFile(workbook, `Thong_Ke_Khach_Hang_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  // Calculate summary metrics
  const totalCustomers = customerStats.length > 0
    ? customerStats[customerStats.length - 1].totalCustomers - 1
    : 0;
    
  const totalNewCustomers = filteredStats.reduce(
    (sum, item) => sum + item.newCustomers, 0
  );
  
  const avgGrowthRate = filteredStats.length > 0 
    ? filteredStats.reduce((sum, item) => sum + (item.growthPercentage || 0), 0) / filteredStats.length 
    : 0;

  // Calculate new customers today
  const today = new Date();
  const newCustomersToday = customerStats.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  }).reduce((sum, item) => sum + item.newCustomers, 0);

  // Calculate growth rate compared to yesterday
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const newCustomersYesterday = customerStats.filter((item) => {
    const itemDate = new Date(item.date);
    return (
      itemDate.getDate() === yesterday.getDate() &&
      itemDate.getMonth() === yesterday.getMonth() &&
      itemDate.getFullYear() === yesterday.getFullYear()
    );
  }).reduce((sum, item) => sum + item.newCustomers, 0);

  const growthRate = newCustomersYesterday > 0
    ? ((newCustomersToday - newCustomersYesterday) / newCustomersYesterday) * 100
    : 0;

  // Prepare chart data
  const chartData = {
    labels: filteredStats.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Tổng số khách',
        data: filteredStats.map(item => item.totalCustomers),
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.1)',
        fill: true,
        tension: 0.3
      },
      {
        label: 'Khách hàng mới',
        data: filteredStats.map(item => item.newCustomers),
        borderColor: '#7209b7',
        backgroundColor: 'rgba(114, 9, 183, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className={styles.customerStats}>
      <Box padding={4}>
        {/* Header */}
        <Box className={styles.header}>
          <Typography variant="h3" component="h1" className={styles.title}>
            Thống Kê Khách Hàng
          </Typography>
          <Typography variant="subtitle1" className={styles.subtitle}>
            Phân tích dữ liệu khách hàng tương tác qua chat
          </Typography>
        </Box>
        
        {/* Filters */}
        <Paper elevation={3} className={styles.filterPaper}>
            <Grid container spacing={3} alignItems="center">
            <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Từ ngày</Typography>
                <DatePicker 
                selected={startDate} 
                onChange={date => setStartDate(date)} 
                dateFormat="dd/MM/yyyy"
                className={styles.datePicker}
                placeholderText="Chọn ngày bắt đầu"
                />
            </Grid>
            <Grid item size={{ xs: 12, md: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Đến ngày</Typography>
                <DatePicker 
                selected={endDate} 
                onChange={date => setEndDate(date)} 
                dateFormat="dd/MM/yyyy"
                className={styles.datePicker}
                placeholderText="Chọn ngày kết thúc"
                />
            </Grid>
            <Grid item size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                <InputLabel>Hiển thị theo</InputLabel>
                <Select
                    value={viewMode}
                    label="Hiển thị theo"
                    onChange={(e) => setViewMode(e.target.value)}
                >
                    <MenuItem value="daily">Ngày</MenuItem>
                    <MenuItem value="monthly">Tháng</MenuItem>
                </Select>
                </FormControl>
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
                <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={exportToExcel}
                    startIcon={<FileDownloadIcon />}
                >
                    Xuất Excel
                </Button>
                <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={fetchCustomerStats}
                    startIcon={<RefreshIcon />}
                    disabled={loading}
                >
                    Làm mới
                </Button>
                </Box>
            </Grid>
            </Grid>
        </Paper>

        <Grid container spacing={3} sx={{ my: 3 }}>
            {/* Tổng số khách */}
            <Grid item xs={12} md={4}>
                <Paper className="stat-card">
                    <Box className="stat-icon" style={{ color: '#1d4ed8', background: '#dbeafe' }}>
                        <i className="fas fa-users"></i>
                    </Box>
                    <Box className="stat-content">
                        <Typography variant="subtitle2" className="stat-label">
                            Tổng số khách
                        </Typography>
                        <Typography variant="h4" className="stat-value">
                            {totalCustomers}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>

            {/* Khách hàng mới */}
            <Grid item xs={12} md={4}>
                <Paper className="stat-card">
                    <Box className="stat-icon" style={{ color: '#15803d', background: '#dcfce7' }}>
                        <i className="fas fa-user-plus"></i>
                    </Box>
                    <Box className="stat-content">
                        <Typography variant="subtitle2" className="stat-label">
                            Khách hàng mới
                        </Typography>
                        <Typography variant="h4" className="stat-value">
                            {newCustomersToday}
                        </Typography>
                    </Box>
                </Paper>
            </Grid>

            {/* Tỷ lệ tăng */}
            <Grid item xs={12} md={4}>
                <Paper className="stat-card">
                    <Box className="stat-icon" style={{ color: '#b91c1c', background: '#fee2e2' }}>
                        <i className="fas fa-chart-line"></i>
                    </Box>
                    <Box className="stat-content">
                        <Typography variant="subtitle2" className="stat-label">
                            Tỷ lệ tăng trưởng
                        </Typography>
                        <Typography
                            variant="h4"
                            className="stat-value"
                            style={{
                                color: growthRate > 0 ? 'green' : growthRate < 0 ? 'red' : 'inherit',
                                fontSize: '1.5rem',
                            }}
                        >
                            {growthRate.toFixed(2)}%
                        </Typography>
                    </Box>
                </Paper>
            </Grid>
        </Grid>
        
        {/* Display loading or error states */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box className={styles.errorMessage}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            {/* Chart */}
            <Paper elevation={3} className={styles.chartCard}>
              <Typography variant="h6" className={styles.chartTitle}>
                Biểu Đồ Khách Hàng Theo {viewMode === 'daily' ? 'Ngày' : 'Tháng'}
              </Typography>
              <Box className={styles.chartWrapper}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </Paper>
            
            {/* Data Table */}
            <Paper elevation={3} className={styles.tablePaper}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Dữ Liệu Chi Tiết
                </Typography>
                <Typography variant="body2">
                  Tổng số: {filteredStats.length} bản ghi
                </Typography>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{viewMode === 'daily' ? 'Ngày' : 'Tháng'}</TableCell>
                      <TableCell align="right">Tổng số khách</TableCell>
                      <TableCell align="right">Khách hàng mới</TableCell>
                      <TableCell align="right">% Tăng trưởng</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStats.length > 0 ? (
                      filteredStats.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {formatDate(item.date)}
                          </TableCell>
                          <TableCell align="right">{item.totalCustomers}</TableCell>
                          <TableCell align="right">{item.newCustomers}</TableCell>
                          <TableCell 
                            align="right"
                            style={{
                              color: item.growthPercentage > 0 
                                ? 'green' 
                                : item.growthPercentage < 0 
                                  ? 'red' 
                                  : 'inherit'
                            }}
                          >
                            {item.growthPercentage !== null && item.growthPercentage !== undefined
                              ? `${item.growthPercentage.toFixed(2)}%`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">Không có dữ liệu</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
      </Box>
    </div>
  );
};

export default CustomerStats;