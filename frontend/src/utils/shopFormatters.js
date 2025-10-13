export const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
export const getBrandName = (brand) => ({ zara: 'ZARA', hm: 'H&M', uniqlo: 'UNIQLO', mango: 'MANGO', local: 'LOCAL BRAND' }[brand] || brand?.toUpperCase?.() || '');
export const generateStars = (rating) => { const stars = Math.round(rating); return '★'.repeat(stars) + '☆'.repeat(5 - stars); };
export const getColorCode = (color) => ({ red: '#ff0000', green: '#00ff00', blue: '#0000ff', black: '#000000', white: '#ffffff' })[color] || '#cccccc';