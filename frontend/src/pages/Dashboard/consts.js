export const REVENUE_DATA = [
	{ month: 'T1', revenue: 45000000, orders: 120 },
	{ month: 'T2', revenue: 52000000, orders: 145 },
	{ month: 'T3', revenue: 48000000, orders: 130 },
	{ month: 'T4', revenue: 61000000, orders: 170 },
	{ month: 'T5', revenue: 55000000, orders: 155 },
	{ month: 'T6', revenue: 67000000, orders: 190 },
	{ month: 'T7', revenue: 72000000, orders: 210 },
	{ month: 'T8', revenue: 68000000, orders: 195 },
	{ month: 'T9', revenue: 58000000, orders: 165 },
	{ month: 'T10', revenue: 63000000, orders: 180 },
	{ month: 'T11', revenue: 70000000, orders: 200 },
	{ month: 'T12', revenue: 78000000, orders: 225 }
];

// Dữ liệu sản phẩm bán chạy
export const TOP_PRODUCTS_DATA = [
	{ name: 'Áo thun', sales: 850 },
	{ name: 'Quần jean', sales: 620 },
	{ name: 'Áo khoác', sales: 580 },
	{ name: 'Váy', sales: 450 },
	{ name: 'Áo sơ mi', sales: 420 },
	{ name: 'Quần short', sales: 380 }
];

// Dữ liệu phân loại theo danh mục
export const CATEGORY_DATA = [
	{ name: 'Áo nam', value: 35, color: '#667eea' },
	{ name: 'Áo nữ', value: 30, color: '#764ba2' },
	{ name: 'Quần', value: 20, color: '#f093fb' },
	{ name: 'Phụ kiện', value: 10, color: '#a78bfa' },
	{ name: 'Khác', value: 5, color: '#c084fc' }
];

// Dữ liệu doanh thu theo tuần (7 ngày gần nhất)
export const WEEKLY_DATA = [
	{ day: 'CN', revenue: 8500000 },
	{ day: 'T2', revenue: 6200000 },
	{ day: 'T3', revenue: 7100000 },
	{ day: 'T4', revenue: 6800000 },
	{ day: 'T5', revenue: 7500000 },
	{ day: 'T6', revenue: 9200000 },
	{ day: 'T7', revenue: 10500000 }
];

export const SUMMARY_CARDS = [
	{title: "Tổng Doanh Thu", icon: "💰", valueKey: "totalRevenue", subtitle: "+12.5% so với tháng trước", type: "positive"},
	{title: "Tổng Đơn Hàng", icon: "📦", valueKey: "totalOrders", subtitle: "+8.3% so với tháng trước", type: "positive"},
	{title: "Khách Hàng", icon: "👥", valueKey: "totalCustomers", subtitle: "+15.2% khách hàng mới", type: "positive"},
	{title: "Giá Trị Trung Bình", icon: "💳", valueKey: "avgOrderValue", subtitle: "-2.1% so với tháng trước", type: "negative"},
]
