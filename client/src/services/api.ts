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

export const register = async (formData: FormData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw new Error("Error registering.");
    }
  };

export const validateSignature = async (pngBlob: Blob, userName: string) => {
    const formData = new FormData();
    formData.append('username', userName);
    formData.append('test_signature', pngBlob, 'test_signature.png');
    try {
        const response = await axios.post(`${API_BASE_URL}/validate-signature`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Validation error:", error);
        throw new Error("Error validating signature.");
    }
};