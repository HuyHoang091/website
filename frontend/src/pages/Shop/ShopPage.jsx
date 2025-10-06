import React from "react";

const initialProducts = [
    {
        id: 1,
        name: "Áo Sơ Mi Oxford Premium",
        category: "ao-so-mi",
        brand: "zara",
        price: 450000,
        originalPrice: 600000,
        image: "👔",
        rating: 4.5,
        reviews: 128,
        badge: "sale",
        isNew: false,
        colors: ["white", "blue", "black"],
        sizes: ["S", "M", "L", "XL"],
        description: "Áo sơ mi Oxford cao cấp, chất liệu cotton 100%"
    },
    {
        id: 2,
        name: "Quần Jean Slim Fit Dark Blue",
        category: "quan-jean",
        brand: "uniqlo",
        price: 750000,
        originalPrice: null,
        image: "👖",
        rating: 4.8,
        reviews: 95,
        badge: null,
        isNew: true,
        colors: ["blue", "black"],
        sizes: ["29", "30", "31", "32", "33"],
        description: "Quần jean slim fit co giãn, phù hợp mọi dáng người"
    },
    {
        id: 3,
        name: "Áo Thun Cotton Organic",
        category: "ao-thun",
        brand: "hm",
        price: 320000,
        originalPrice: 400000,
        image: "👕",
        rating: 4.3,
        reviews: 203,
        badge: "sale",
        isNew: false,
        colors: ["white", "black", "gray", "navy"],
        sizes: ["XS", "S", "M", "L", "XL"],
        description: "Áo thun cotton organic, thân thiện với môi trường"
    },
    {
        id: 4,
        name: "Váy Đầm Hoa Vintage",
        category: "vay-dam",
        brand: "mango",
        price: 890000,
        originalPrice: null,
        image: "👗",
        rating: 4.7,
        reviews: 67,
        badge: null,
        isNew: true,
        colors: ["pink", "yellow", "green"],
        sizes: ["XS", "S", "M", "L"],
        description: "Váy đầm họa tiết hoa vintage, phong cách nữ tính"
    }
];

// Utility functions
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

const getBrandName = (brand) => {
    const brandNames = {
        'zara': 'ZARA',
        'hm': 'H&M',
        'uniqlo': 'UNIQLO',
        'mango': 'MANGO',
        'local': 'LOCAL BRAND'
    };
    return brandNames[brand] || brand.toUpperCase();
};

const generateStars = (rating) => {
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

const getColorCode = (color) => {
    const colorCodes = {
        'black': '#000000',
        'white': '#ffffff',
        'red': '#ef4444',
        'blue': '#3b82f6',
        'green': '#10b981',
        'yellow': '#f59e0b',
        'purple': '#8b5cf6',
        'pink': '#ec4899',
        'gray': '#6b7280',
        'brown': '#92400e',
        'navy': '#1e40af',
        'maroon': '#be185d',
        'beige': '#d2b48c'
    };
    return colorCodes[color] || '#cccccc';
};

const ShopPage = () => {
    return (
        <Headers></Headers>
    )
}