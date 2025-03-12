import axios from "axios";

export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    createdAt: string;
    updatedAt: string;
    fullName: string;

}

export interface response {
    token: string;
    user: User
}

const API_BASE_URL = 'http://127.0.0.1:8000/user'; 

export const login = async (username: string, password: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            username: username,
            password: password
        });

        const data: response = response.data;

        return data; 
    } catch (error) {
        console.error("Login error:", error);
        throw new Error("Error logging in.")
    }
};

export const register2 = async (formdata: FormData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/register`, formdata);

        const data: response = response.data;

        return data; 
    } catch (error) {
        console.error("Login error:", error);
        throw new Error("Error logging in.")
    }
};

export const register = async (username: string, password: string,  email: string, fullName: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api`, {
            username: username,
            password: password,
            email: email,
            fullName: fullName
        });

        const data: response = response.data;

        return data; 
    } catch (error) {
        console.error("Login error:", error);
        throw new Error("Error logging in.")
    }
};