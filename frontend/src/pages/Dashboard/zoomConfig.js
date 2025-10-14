export const zoomOptions = {
	zoom: {
		wheel: {
			enabled: true, // Zoom bằng scroll chuột
			speed: 0.1,
		},
		pinch: {
			enabled: true, // Zoom bằng pinch trên mobile
		},
		mode: 'xy', // Zoom cả 2 trục (x, y), hoặc 'x', 'y'
	},
	pan: {
		enabled: true, // Kéo để di chuyển
		mode: 'xy', // Pan cả 2 trục
		modifierKey: 'ctrl', // Giữ Ctrl để pan (tránh conflict với scroll)
	},
	limits: {
		x: { min: 'original', max: 'original' }, // Giới hạn zoom
		y: { min: 'original', max: 'original' },
	},
};

// Zoom options cho chỉ trục X (phù hợp với time series)
export const zoomXOptions = {
	zoom: {
		wheel: {
			enabled: true,
			speed: 0.1,
		},
		pinch: {
			enabled: true,
		},
		mode: 'x', // Chỉ zoom trục X
	},
	pan: {
		enabled: true,
		mode: 'x', // Chỉ pan trục X
	},
	limits: {
		x: { min: 'original', max: 'original' },
	},
};

// Zoom options cho chỉ trục Y
export const zoomYOptions = {
	zoom: {
		wheel: {
			enabled: true,
			speed: 0.1,
		},
		pinch: {
			enabled: true,
		},
		mode: 'y', // Chỉ zoom trục Y
	},
	pan: {
		enabled: true,
		mode: 'y',
	},
	limits: {
		y: { min: 'original', max: 'original' },
	},
};