import axios from "axios";
import {BASE_API_URL} from "./appServices";

const API_PATH_CATEGORIES = '/api/categorys/';
const API_PATH_PRODUCTS_INFO = '/api/products/info';
const API_PATH_PROD_VARIANT_AGGREGATION = '/api/products/variants/aggregation';

export const getCategories = (params) => {
	return axios.get(BASE_API_URL + API_PATH_CATEGORIES, {params});
}

export const getListProduct = (params) => {
	return axios.get(BASE_API_URL + API_PATH_PRODUCTS_INFO, {params});
}

export const getProductVariantAggregation = (params) => {
	return axios.get(BASE_API_URL + API_PATH_PROD_VARIANT_AGGREGATION, {params});
}
