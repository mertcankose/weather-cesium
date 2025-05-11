import axios from 'axios';

const API_URL = 'https://weather-app-java-spring-boot-production-ad40.up.railway.app/api';

// Function to register a new user
export const register = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      username,
      password
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to login a user
export const login = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    
    // Save token to localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('username', username);
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// Function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

// Function to get weather data
export const getWeatherData = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await axios.get(`${API_URL}/weather`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Function to get auth token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Function to get username
export const getUsername = () => {
  return localStorage.getItem('username');
};