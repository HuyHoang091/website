
export const createTopProductsData = ({topProductsData}) => {
	return {
		labels: topProductsData.map(item => item.name),
		datasets: [
			{
				label: 'Số lượng bán',
				data: topProductsData.map(item => item.sales),
				backgroundColor: [
					'rgba(102, 126, 234, 0.8)',
					'rgba(118, 75, 162, 0.8)',
					'rgba(240, 147, 251, 0.8)',
					'rgba(167, 139, 250, 0.8)',
					'rgba(192, 132, 252, 0.8)',
					'rgba(139, 92, 246, 0.8)'
				],
				borderColor: 'rgba(255, 255, 255, 0.3)',
				borderWidth: 1,
			}
		]
	};
}

export const createCategoryData = ({categoryData}) => {
	return {
		labels: categoryData.map(item => item.name),
		datasets: [
			{
				label: 'Phần trăm',
				data: categoryData.map(item => item.value),
				backgroundColor: categoryData.map(item => item.color),
				borderColor: 'rgba(255, 255, 255, 0.8)',
				borderWidth: 2,
			}
		]
	};
}

export const createRevenueData = ({revenueData}) => {
	return {
		labels: revenueData.map(item => item.month),
		datasets: [
			{
				label: 'Số đơn hàng',
				data: revenueData.map(item => item.orders),
				fill: false,
				borderColor: '#f093fb',
				backgroundColor: 'rgba(240, 147, 251, 0.5)',
				tension: 0.1,
				borderWidth: 3,
				pointRadius: 5,
				pointHoverRadius: 7,
				pointBackgroundColor: '#f093fb',
				pointBorderColor: '#fff',
				pointBorderWidth: 2,
			}
		]
	};
}

export const createWeeklyData = ({weeklyData}) => {
	return {
		labels: weeklyData.map(item => item.day),
		datasets: [
			{
				label: 'Doanh thu (₫)',
				data: weeklyData.map(item => item.revenue),
				backgroundColor: [
					'rgba(102, 126, 234, 0.8)',
					'rgba(118, 75, 162, 0.8)',
					'rgba(240, 147, 251, 0.8)',
					'rgba(167, 139, 250, 0.8)',
					'rgba(192, 132, 252, 0.8)',
					'rgba(102, 126, 234, 0.8)',
					'rgba(118, 75, 162, 0.8)',
				],
				borderColor: 'rgba(255, 255, 255, 0.3)',
				borderWidth: 1,
			}
		]
	};
}

export const createRevenueChartData = ({revenueData}) => {
	return {
		labels: revenueData.map(item => item.month),
		datasets: [
			{
				label: 'Doanh thu (₫)',
				data: revenueData.map(item => item.revenue),
				fill: true,
				backgroundColor: 'rgba(120,75,162,0.2)',
				borderColor: '#4e2773',
				borderWidth: 2,
				tension: 0.4,
				pointRadius: 4,
				pointHoverRadius: 6,
				pointBackgroundColor: '#764ba2',
			}
		]
	};
}
