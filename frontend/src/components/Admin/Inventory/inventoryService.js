import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Get JWT token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('tokenJWT');
};

// Configure axios with auth header
const getAuthConfig = () => ({
    headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
    }
});

/**
 * Get inventory data
 */
export const getInventoryData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/inventory`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }
};

/**
 * Get all categories
 */
export const getCategories = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/categorys/`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

/**
 * Get all brands
 */
export const getBrands = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/brands/`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching brands:', error);
        throw error;
    }
};

/**
 * Get product for editing
 */
export const getProductForEdit = async (productId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/products/${productId}/edit`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

/**
 * Create new product
 */
export const createProduct = async (productData) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/products/create`,
            productData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

/**
 * Update existing product
 */
export const updateProduct = async (productId, productData) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/products/update/${productId}`,
            productData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (productId) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/products/${productId}`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

/**
 * Delete variant
 */
export const deleteVariant = async (variantId) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/products/variant/${variantId}`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting variant:', error);
        throw error;
    }
};

/**
 * Upload image
 */
export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(
            `${API_BASE_URL}/upload/image`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${getAuthToken()}`
                }
            }
        );

        return response.data.url;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

/**
 * Create new brand
 */
export const createBrand = async (brandName) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/brands/create`,
            { name: brandName },
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error creating brand:', error);
        throw error;
    }
};

/**
 * Update brand
 */
export const updateBrand = async (brandId, brandData) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/brands/${brandId}/update`,
            brandData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error updating brand:', error);
        throw error;
    }
};

/**
 * Delete brand
 */
export const deleteBrand = async (brandId) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/brands/${brandId}/delete`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting brand:', error);
        throw error;
    }
};

/**
 * Create new category
 */
export const createCategory = async (categoryData) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/categorys/create`,
            categoryData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

/**
 * Update category
 */
export const updateCategory = async (categoryId, categoryData) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/categorys/${categoryId}/update`,
            categoryData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error updating category:', error);
        throw error;
    }
};

/**
 * Delete category
 */
export const deleteCategory = async (categoryId) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/categorys/${categoryId}/delete`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
};

/**
 * Get all color codes
 */
export const getColorCodes = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/colors/`, getAuthConfig());
        return response.data;
    } catch (error) {
        console.error('Error fetching colors:', error);
        throw error;
    }
};

/**
 * Create new color code
 */
export const createColorCode = async (colorData) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/colors/`,
            colorData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error creating color:', error);
        throw error;
    }
};

/**
 * Update color code
 */
export const updateColorCode = async (colorId, colorData) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/colors/${colorId}`,
            colorData,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error updating color:', error);
        throw error;
    }
};

/**
 * Delete color code
 */
export const deleteColorCode = async (colorId) => {
    try {
        const response = await axios.delete(
            `${API_BASE_URL}/colors/${colorId}`,
            getAuthConfig()
        );
        return response.data;
    } catch (error) {
        console.error('Error deleting color:', error);
        throw error;
    }
};