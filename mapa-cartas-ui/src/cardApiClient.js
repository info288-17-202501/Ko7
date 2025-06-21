import axios from 'axios';

const API_BASE_URL = 'http://localhost:3030/api';

export const getCards = async () => {
    const response = await axios.get(`${API_BASE_URL}/cards`);
    return response.data;
};