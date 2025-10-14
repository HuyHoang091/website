export const formatCurrency = (value, locales) => {
	return new Intl.NumberFormat(locales || 'vi-VN', {
		style: 'currency',
		currency: 'VND',
		maximumFractionDigits: 0
	}).format(value);
};