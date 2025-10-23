import {BRAND_NAMES, COLOR_CODES} from "./consts";

export const filterProduct = (props) => {
	let {products = [], searchTerm = [], filters = []} = props;
	console.log(products)
	return products?.filter(product => {
		// Search filter
		if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
			return false;
		}
		
		// Category filter
		if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
			return false;
		}
		
		// Brand filter
		if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
			return false;
		}
		
		// Price filter
		if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
			return false;
		}
		
		// Size filter
		if (filters.sizes.length > 0 && !filters.sizes.some(size => product.sizes.includes(size))) {
			return false;
		}
		
		// Color filter
		if (filters.colors.length > 0 && !filters.colors.some(color => product.colors.includes(color))) {
			return false;
		}
		
		return true;
	}) || [];
}

export const formatPrice = (price) => {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(price);
};

export const getBrandName = (brand) => {
	return BRAND_NAMES[brand] || brand.toUpperCase();
};

export const generateStars = (rating) => {
	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 !== 0;
	let stars = '';
	
	for (let i = 0; i < fullStars; i++) {
		stars += '★';
	}
	if (hasHalfStar) {
		stars += '☆';
	}
	for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
		stars += '☆';
	}
	
	return stars;
};

export const getColorCode = (color) => {
	if (color.startsWith('#')) return color;
	return COLOR_CODES[color] || '#cccccc';
};

// Hàm lấy tất cả ID danh mục con (bao gồm cả danh mục cha)
export const getAllChildCategoryIds = (categories, parentId) => {
    if (!categories || !parentId) return [parentId];
    
    // Thêm danh mục cha vào danh sách
    const result = [parentId];
    
    // Tìm tất cả danh mục con trực tiếp
    const directChildren = categories.filter(cat => cat.parentId === parentId);
    
    // Đệ quy để lấy tất cả danh mục con của mỗi danh mục con trực tiếp
    directChildren.forEach(child => {
        const childIds = getAllChildCategoryIds(categories, child.id);
        result.push(...childIds);
    });
    
    return [...new Set(result)]; // Loại bỏ các ID trùng lặp
};

// Kiểm tra xem sản phẩm có phải là sản phẩm mới hay không (trong vòng 30 ngày)
export const isNewProduct = (createAtStr) => {
    if (!createAtStr) return false;
    
    const createAt = new Date(createAtStr);
    const now = new Date();
    
    // Tính số ngày giữa hai ngày
    const diffTime = Math.abs(now - createAt);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Sản phẩm được coi là mới nếu được tạo trong vòng 30 ngày
    return diffDays <= 30;
};

// Hàm kiểm tra giá sản phẩm có nằm trong khoảng giá hay không
export const checkPriceRange = (product, priceRange) => {
    // Lấy giá hiện tại (ưu tiên giá giảm nếu có)
    const currentPrice = product.priceNow || product.price;
    
    // Parse khoảng giá "min-max" hoặc "min-" (không giới hạn trên)
    const [min, max] = priceRange.split('-').map(val => val === '' ? Infinity : Number(val));
    
    // Kiểm tra giá có nằm trong khoảng
    return currentPrice >= min && currentPrice <= (max || Infinity);
};

// Hàm tính số sản phẩm trong mỗi khoảng giá
export const countProductsByPriceRange = (products, priceRanges) => {
    if (!products || !Array.isArray(products) || !priceRanges) return {};
    
    const countMap = {};
    
    priceRanges.forEach(range => {
        countMap[range.value] = products.filter(product => 
            checkPriceRange(product, range.value)
        ).length;
    });
    
    return countMap;
};

// Hàm tính số sản phẩm trong mỗi danh mục
export const countProductsByCategory = (products, categories) => {
    if (!products || !Array.isArray(products) || !categories) return {};
    
    const countMap = {};
    
    categories.forEach(category => {
        // Lấy tất cả ID danh mục con
        const categoryIds = getAllChildCategoryIds(categories, category.id);
        
        // Đếm số sản phẩm thuộc danh mục này hoặc các danh mục con
        countMap[category.id] = products.filter(product => 
            categoryIds.includes(product.categoriesId)
        ).length;
    });
    
    return countMap;
};

// Hàm đếm số sản phẩm theo thương hiệu
export const countProductsByBrand = (products, brands) => {
    if (!products || !Array.isArray(products) || !brands) return {};
    
    const countMap = {};
    
    brands.forEach(brand => {
        countMap[brand.name] = products.filter(product => 
            product.brand === brand.name
        ).length;
    });
    
    return countMap;
};
