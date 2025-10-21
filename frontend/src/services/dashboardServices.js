import axios from "axios";
import {BASE_API_URL} from "./appServices";

const API_PATH_ORDER = "/api/chat/dashboard";

const getAuthToken = () => {
	return localStorage.getItem("tokenJWT");
}

const getAuthHeaders = () => {
	const token = getAuthToken();
	return {
		Authorization: `Bearer ${token}`,
	};
}

export const getOrders = async () => {
    const response = await axios.get(BASE_API_URL + API_PATH_ORDER, {
        headers: getAuthHeaders(),
    });
    return response.data;
};
