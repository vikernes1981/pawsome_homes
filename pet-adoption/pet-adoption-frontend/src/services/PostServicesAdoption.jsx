import axios from 'axios';

const API_URL_ADOPTION ='http://localhost:5000/admin/adoption-requests';

export const getAllRequest = async () => {
    try {
        const response = await axios.get(API_URL_ADOPTION);
        return response.data;
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

export const getRequestById = async (id) => {
    try {
        const response = await axios.get(`${API_URL_ADOPTION}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching post with id ${id}:`, error);
        throw error;
    }
};

export const createRequest = async (post) => {
    try {
        const response = await axios.post(API_URL_ADOPTION, post, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating post:', error);
        throw error;
    }
};

export const deleteRequest = async (id) => {
    try {
        const response = await axios.delete(`${API_URL_ADOPTION}/${id}`);
        return response.data; // Optionally return the deleted post or a success message
    } catch (error) {
        console.error(`Error deleting post with id ${id}:`, error);
        throw error;
    }
};

export const updateRequest = async (id, updatedFields) => {
    try {
        const response = await axios.patch(`${API_URL_ADOPTION}/${id}`, updatedFields, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating request with id ${id}:`, error);
        throw error;
    }
};
