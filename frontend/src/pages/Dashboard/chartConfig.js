import {formatCurrency} from "../../utils/formatUtils";

export const commonChartOptions = {
	responsive: true,
	maintainAspectRatio: false,
};

export const commonLegendConfig = {
	display: true,
	position: 'top',
	labels: {
		color: '#fff',
		font: {
			size: 12,
			weight: '500'
		}
	}
};

export const commonAxisConfig = {
	ticks: {
		color: '#fff',
		callback: null,
	},
	grid: {
		color: 'rgba(255, 255, 255, 0.1)'
	}
};

export const commonYAxisConfig = {
	...commonAxisConfig,
	beginAtZero: true,
};

export const createRevenueTooltip = (context) => {
	return 'Doanh thu: ' + formatCurrency(context.parsed.y);
};

export const createMillionTickCallback = (value) => {
	return (value / 1000000).toFixed(2) + 'M';
};

export const createOrdersTooltip = (context) => {
	return 'Số đơn: ' + context.parsed.y;
};

export const createSalesCountTooltip = (context) => {
	return 'Đã bán: ' + context.parsed.x + ' sản phẩm';
};

export const createPercentageTooltip = (context) => {
	const label = context.label || '';
	const value = context.parsed || 0;
	return label + ': ' + value + '%';
};

export const createMonthTickCallback = (value, index, ticks) => {
	return 'T' + value;
};

export const createFullMonthTickCallback = (value, index, ticks) => {
	const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
	return this.chart.data.labels[value] || value;
};

export const createChartOptions = (config = defaultChartConfig) => {
	const {
		legend = commonLegendConfig,
		tooltipCallback = null,
		yAxisCallback = null,
		xAxisCallback = null,
		indexAxis = null,
		scales = true,
		zoom = null,
	} = config;
	
	// Sử dụng structuredClone (modern browsers)
	const options = structuredClone(commonChartOptions);
	
	options.plugins = {
		legend: structuredClone(legend),
	};
	
	if (tooltipCallback) {
		options.plugins.tooltip = {
			callbacks: {
				label: tooltipCallback
			}
		};
	}
	
	if (zoom) {
		options.plugins.zoom = structuredClone(zoom);
	}
	
	if (scales) {
		options.scales = {
			y: structuredClone(commonYAxisConfig),
			x: structuredClone(commonAxisConfig),
		};
		
		if (xAxisCallback) {
			console.log(options.scales.x.ticks)
			options.scales.x.ticks.callback = xAxisCallback;
		}
		
		if (yAxisCallback) {
			options.scales.y.ticks.callback = yAxisCallback;
		}
	}
	
	if (indexAxis) {
		options.indexAxis = indexAxis;
	}
	
	return options;
};

const defaultChartConfig = {
	legend: commonLegendConfig,
	scales: true,
	tooltipCallback: null,
	yAxisCallback: null,
	xAxisCallback: null,
	indexAxis: null,
	zoom: null,
};
