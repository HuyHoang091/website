import axios from "axios";
import {BASE_API_URL} from "./appServices";

const API_PATH_ORDER = "/api/orders/details/all";

export const getOrders = (params) => {
	return axios.get(BASE_API_URL + API_PATH_ORDER, {params});
}
