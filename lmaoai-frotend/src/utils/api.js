import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

export const emailApi = axios.create({
    baseURL: 'https://script.google.com/macros/s/AKfycbxytv-5JS8Rb7vz5gOCT0cWCImItb8QQhb9VdYagxdXgPBmy7UKV-NtQLDIhJIopuISXQ/exec'
})

export default api;