import React, {useState, useEffect} from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import {Line, Bar, Pie} from 'react-chartjs-2';
import {Box, Paper, Typography, Grid} from '@mui/material';
import './dashboard.scss';
import {CATEGORY_DATA, REVENUE_DATA, SUMMARY_CARDS, TOP_PRODUCTS_DATA, WEEKLY_DATA} from "./consts";
import {
	createChartOptions,
	createRevenueTooltip,
	createMillionTickCallback,
	createOrdersTooltip,
	createSalesCountTooltip,
	createPercentageTooltip, commonLegendConfig,
} from "./chartConfig";
import {zoomOptions} from "./zoomConfig";
import {
	createCategoryData,
	createRevenueChartData,
	createRevenueData,
	createTopProductsData,
	createWeeklyData
} from "./helpers";
import {getOrders} from "../../services/dashboardServices";
import clsx from "clsx";


// Đăng ký các components của Chart.js
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	zoomPlugin
);

export const Dashboard = () => {
	// Dữ liệu mẫu cho doanh thu theo tháng
	const [revenueData, setRevenueData] = useState(REVENUE_DATA);
	const [topProductsData, setTopProductsData] = useState(TOP_PRODUCTS_DATA);
	const [categoryData, setCategoryData] = useState(CATEGORY_DATA);
	const [weeklyData, setWeeklyData] = useState(WEEKLY_DATA);
	
	const [stats, setStats] = useState({
		totalRevenue: '637,000,000',
		totalOrders: 2085,
		totalCustomers: 1543,
		avgOrderValue: '305,515'
	});
	
	// Cấu hình biểu đồ doanh thu theo tháng (Area Chart)
	const revenueChartData = createRevenueChartData({revenueData});
	const revenueChartOptions = createChartOptions({
		tooltipCallback: createRevenueTooltip,
		yAxisCallback: createMillionTickCallback,
		xAxisCallback: (value) => revenueData.map(item => item.month)[value],
		zoom: zoomOptions,
	});
	
	// Cấu hình biểu đồ doanh thu theo tuần
	const weeklyChartData = createWeeklyData({weeklyData});
	const weeklyChartOptions = createChartOptions({
		tooltipCallback: createRevenueTooltip,
		yAxisCallback: createMillionTickCallback,
		xAxisCallback: (v) => weeklyData.map(item => item.day)[v],
		zoom: zoomOptions,
	});
	
	// Cấu hình biểu đồ sản phẩm bán chạy (Horizontal Bar)
	const topProductsChartData = createTopProductsData({topProductsData})
	const topProductsChartOptions = createChartOptions({
		legend: {display: false},
		tooltipCallback: createSalesCountTooltip,
		indexAxis: 'y',
		zoom: zoomOptions,
	});
	
	// Cấu hình biểu đồ phân loại danh mục (Pie Chart)
	const categoryChartData = createCategoryData({categoryData});
	const categoryChartOptions = createChartOptions({
		legend: {
			position: 'right',
			labels: structuredClone(commonLegendConfig.labels),
		},
		tooltipCallback: createPercentageTooltip,
		scales: false
	});
	
	// Cấu hình biểu đồ đơn hàng theo tháng (Line Chart)
	const ordersChartData = createRevenueData({revenueData})
	const ordersChartOptions = createChartOptions({
		tooltipCallback: createOrdersTooltip,
		zoom: zoomOptions,
	});
	
	useEffect(() => {
		handleGetOrders().then(r => r);
	}, []);
	
	const handleGetOrders = async () => {
		try {
			const response = await getOrders();
			
		} catch (error) {
			console.error('Error fetching orders:', error);
		}
	}
	
	const renderSummaryCard = ({title, summaryValue, subtitle, icon, subtitleType = "positive"}) => {
		return (
			<Paper className="stat-card orders">
				<Box className="stat-icon">{icon}</Box>
				<Box className="stat-content">
					<Typography variant="subtitle2" className="stat-label">
						{title}
					</Typography>
					<Typography variant="h4" className="stat-value">
						{summaryValue}
					</Typography>
					<Typography variant="caption" className={clsx("stat-change", subtitleType)}>
						{subtitle}
					</Typography>
				</Box>
			</Paper>
		)
	}
	
	return (
		<div className="dashboard-container">
			<Box padding={4}>
				<Box className="dashboard-header">
					<Typography variant="h3" component="h1" className="dashboard-title">
						Dashboard Bán Hàng
					</Typography>
					<Typography variant="subtitle1" className="dashboard-subtitle">
						Tổng quan hoạt động kinh doanh
					</Typography>
				</Box>
				
				{/* Thẻ thống kê tổng quan */}
				<Grid container spacing={3} sx={{mb: 4}}>
					{SUMMARY_CARDS.map(card => {
						const subfix = ["totalRevenue", "avgOrderValue"].includes(card.valueKey) ? "₫" : ""
						return (
							<Grid size={{xs: 12, sm: 6, md: 3}}>
								{renderSummaryCard({
									title: card.title,
									summaryValue: stats[card.valueKey] + subfix,
									icon: card.icon,
									subtitle: card.subtitle,
									subtitleType: card.type,
								})}
							</Grid>
						)
					})}
				</Grid>
				
				{/* Biểu đồ */}
				<Grid container spacing={3}>
					{/* Biểu đồ doanh thu theo tháng */}
					<Grid size={{xs: 12, lg: 8}}>
						<Paper className="chart-card">
							<Typography variant="h6" className="chart-title">
								Doanh Thu Theo Tháng
							</Typography>
							<Box className="chart-wrapper">
								<Line data={revenueChartData} options={revenueChartOptions}/>
							</Box>
						</Paper>
					</Grid>
					
					{/* Biểu đồ doanh thu theo tuần */}
					<Grid size={{xs: 12, md: 6, lg: 4}}>
						<Paper className="chart-card">
							<Typography variant="h6" className="chart-title">
								Doanh Thu 7 Ngày Gần Nhất
							</Typography>
							<Box className="chart-wrapper">
								<Bar data={weeklyChartData} options={weeklyChartOptions}/>
							</Box>
						</Paper>
					</Grid>
					
					{/* Biểu đồ sản phẩm bán chạy */}
					<Grid size={{xs: 12, md: 6, lg: 6}}>
						<Paper className="chart-card">
							<Typography variant="h6" className="chart-title">
								Top Sản Phẩm Bán Chạy
							</Typography>
							<Box className="chart-wrapper">
								<Bar data={topProductsChartData} options={topProductsChartOptions}/>
							</Box>
						</Paper>
					</Grid>
					
					{/* Biểu đồ phân loại danh mục */}
					<Grid size={{xs: 12, md: 6, lg: 6}}>
						<Paper className="chart-card">
							<Typography variant="h6" className="chart-title">
								Doanh Thu Theo Danh Mục
							</Typography>
							<Box className="chart-wrapper">
								<Pie data={categoryChartData} options={categoryChartOptions}/>
							</Box>
						</Paper>
					</Grid>
					
					{/* Biểu đồ đơn hàng theo tháng */}
					<Grid size={{xs: 12}}>
						<Paper className="chart-card">
							<Typography variant="h6" className="chart-title">
								Số Lượng Đơn Hàng Theo Tháng
							</Typography>
							<Box className="chart-wrapper">
								<Line data={ordersChartData} options={ordersChartOptions}/>
							</Box>
						</Paper>
					</Grid>
				</Grid>
			</Box>
		</div>
	);
};