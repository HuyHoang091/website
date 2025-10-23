import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Box, Paper, Typography, Grid, FormControl, InputLabel, Select, MenuItem, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import * as XLSX from 'xlsx';
import styles from './OrderStatistics.module.scss';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const OrderStatistics = () => {
  // State for storing data
  const [orderStats, setOrderStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State for filters
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'
  
  // Fetch data from API
  const fetchOrderStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/orders/stats/daily`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Transform dates to be consistent
      const transformedData = data.map(item => ({
        ...item,
        date: item.date,
        dateObj: new Date(item.date) 
      }));
      
      setOrderStats(transformedData);
      setFilteredStats(transformedData);
    } catch (error) {
      console.error('Error fetching order stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to fetch data on component mount
  useEffect(() => {
    fetchOrderStats();
  }, []);
  
  // Effect to apply filters when filter values change
  useEffect(() => {
    applyFilters();
  }, [startDate, endDate, viewMode, orderStats]);
  
  // Function to apply filters to data
  const applyFilters = () => {
    let filtered = [...orderStats];

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
            confirmedOrders: 0,
            returnedOrders: 0,
            revenue: 0,
            count: 0
          };
        }

        monthlyData[monthKey].confirmedOrders += item.confirmedOrders;
        monthlyData[monthKey].returnedOrders += item.returnedOrders;
        monthlyData[monthKey].revenue += item.revenue;
        monthlyData[monthKey].count += 1;
      });

      filtered = Object.values(monthlyData).sort((a, b) => a.dateObj - b.dateObj);
    }

    // Calculate average and percentage change
    filtered.forEach((item, index) => {
      const successfulOrders = item.confirmedOrders - item.returnedOrders; // Tổng đơn thực tế
      item.averageRevenue = successfulOrders > 0 ? item.revenue / successfulOrders : 0; // Giá trị trung bình

      if (index > 0) {
        const prevItem = filtered[index - 1];
        const prevSuccessfulOrders = prevItem.confirmedOrders - prevItem.returnedOrders;
        const prevAverageRevenue = prevSuccessfulOrders > 0 ? prevItem.revenue / prevSuccessfulOrders : 0;

        item.revenueChange = prevAverageRevenue > 0
          ? ((item.averageRevenue - prevAverageRevenue) / prevAverageRevenue) * 100
          : null;
      } else {
        item.revenueChange = null;
      }
    });


    setFilteredStats(filtered);
  };
  
  // Function to export data to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const timeFrame = viewMode === 'daily' ? 'hôm' : 'tháng';
    
    // Format data for Excel
    const formattedData = filteredStats.map(item => ({
      'Ngày': formatDate(item.date),
      'Số đơn chốt': item.confirmedOrders,
      'Số đơn hoàn': item.returnedOrders,
      'Doanh thu': item.revenue,
      'Giá trị trung bình': item.averageRevenue,
      [`So với ${timeFrame} trước`]: 
      item.revenueChange !== null && item.revenueChange !== undefined
      ? `${item.revenueChange.toFixed(2)}%`
      : '-'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // Format currency column
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 3 }); // Column index 3 (Tiền hàng)
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].z = '#,##0 [$₫-vi-VN]';
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thống Kê Đơn Hàng');
    XLSX.writeFile(workbook, `Thong_Ke_Don_Hang_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = viewMode === 'daily' 
      ? { year: 'numeric', month: '2-digit', day: '2-digit' } 
      : { year: 'numeric', month: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };
  
  // Prepare data for revenue chart
  const revenueChartData = {
    labels: filteredStats.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Doanh thu',
        data: filteredStats.map(item => item.revenue),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };
  
  // Prepare data for orders chart
  const ordersChartData = {
    labels: filteredStats.map(item => formatDate(item.date)),
    datasets: [
      {
        label: 'Số đơn chốt',
        data: filteredStats.map(item => item.confirmedOrders),
        backgroundColor: 'rgba(33, 150, 243, 0.7)'
      },
      {
        label: 'Số đơn hoàn',
        data: filteredStats.map(item => item.returnedOrders),
        backgroundColor: 'rgba(244, 67, 54, 0.7)'
      }
    ]
  };
  
  // Chart options for revenue chart
  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            return `Doanh thu: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };
  
  // Chart options for orders chart
  const ordersChartOptions = {
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

  // Calculate summary data
  const totalConfirmedOrders = filteredStats.reduce((sum, item) => sum + item.confirmedOrders, 0);
  const totalReturnedOrders = filteredStats.reduce((sum, item) => sum + item.returnedOrders, 0);
  const totalRevenue = filteredStats.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className={styles["order-statistics-container"]}>
      <Box padding={4}>
        <Box className={styles["dashboard-header"]}>
          <Typography variant="h3" component="h1" className={styles["dashboard-title"]}>
            Thống Kê Đơn Hàng
          </Typography>
          <Typography variant="subtitle1" className={styles["dashboard-subtitle"]}>
            Phân tích dữ liệu đơn hàng theo thời gian
          </Typography>
        </Box>
        
        {/* Filters */}
        <Paper elevation={3} className={styles["filter-paper"]}>
          <Grid container spacing={3} alignItems="center">
            <Grid item size={{ xs: 12, md: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Từ ngày</Typography>
              <DatePicker 
                selected={startDate} 
                onChange={date => setStartDate(date)} 
                dateFormat="dd/MM/yyyy"
                className={styles["date-picker"]}
                placeholderText="Chọn ngày bắt đầu"
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Đến ngày</Typography>
              <DatePicker 
                selected={endDate} 
                onChange={date => setEndDate(date)} 
                dateFormat="dd/MM/yyyy"
                className={styles["date-picker"]}
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
                  onClick={fetchOrderStats}
                  startIcon={<RefreshIcon />}
                  disabled={loading}
                >
                  Làm mới
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ my: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper className="stat-card">
              <Box className="stat-icon" style={{ color: '#065f46', background: '#d1fae5' }}><i className="fas fa-check-circle"></i></Box>
              <Box className="stat-content">
                <Typography variant="subtitle2" className="stat-label">
                  Tổng số đơn chốt
                </Typography>
                <Typography variant="h4" className="stat-value">
                  {totalConfirmedOrders}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className="stat-card">
              <Box className="stat-icon" style={{ color: '#991b1b', background: '#fee2e2' }}><i className="fas fa-times-circle"></i></Box>
              <Box className="stat-content">
                <Typography variant="subtitle2" className="stat-label">
                  Tổng số đơn hoàn
                </Typography>
                <Typography variant="h4" className="stat-value">
                  {totalReturnedOrders}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper className="stat-card">
              <Box className="stat-icon">💰</Box>
              <Box className="stat-content">
                <Typography variant="subtitle2" className="stat-label">
                  Tổng doanh thu
                </Typography>
                <Typography variant="h4" className="stat-value">
                  {formatCurrency(totalRevenue)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Charts */}
            <Grid container spacing={3}>
              {/* Revenue Chart */}
              <Grid item xs={12} lg={6} style={{ width: '100%' }}>
                <Paper elevation={3} className={styles["chart-card"]}>
                  <Typography variant="h6" className={styles["chart-title"]}>
                    Doanh Thu Theo {viewMode === 'daily' ? 'Ngày' : 'Tháng'}
                  </Typography>
                  <Box className={styles["chart-wrapper"]}>
                    <Line data={revenueChartData} options={revenueChartOptions} />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Orders Chart */}
              <Grid item xs={12} lg={6} style={{ width: '100%' }}>
                <Paper elevation={3} className={styles["chart-card"]}>
                  <Typography variant="h6" className={styles["chart-title"]}>
                    Số Lượng Đơn Hàng Theo {viewMode === 'daily' ? 'Ngày' : 'Tháng'}
                  </Typography>
                  <Box className={styles["chart-wrapper"]}>
                    <Bar data={ordersChartData} options={ordersChartOptions} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Data Table */}
            <Paper elevation={3} className={styles["table-paper"]}>
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
                      <TableCell align="right">Số đơn chốt</TableCell>
                      <TableCell align="right">Số đơn hoàn</TableCell>
                      <TableCell align="right">Doanh thu</TableCell>
                      <TableCell align="right">Giá trị trung bình</TableCell>
                      <TableCell align="right">So với {viewMode === 'daily' ? 'hôm' : 'tháng'} trước</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStats.length > 0 ? (
                      filteredStats.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {formatDate(row.date)}
                          </TableCell>
                          <TableCell align="right">{row.confirmedOrders}</TableCell>
                          <TableCell align="right">{row.returnedOrders}</TableCell>
                          <TableCell align="right">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.averageRevenue)}</TableCell>
                          <TableCell
                            align="right"
                            style={{
                              color: row.revenueChange > 0 ? 'green' : row.revenueChange < 0 ? 'red' : 'black',
                            }}
                          >
                            {row.revenueChange !== null && row.revenueChange !== undefined
                              ? `${row.revenueChange.toFixed(2)}%`
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">Không có dữ liệu</TableCell>
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

export default OrderStatistics;