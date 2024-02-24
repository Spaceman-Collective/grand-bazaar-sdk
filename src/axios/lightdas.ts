import axios from 'axios';


const env = process.env.NODE_ENV;

const lightDasApi = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
      "Content-Type": "application/json",
    }
});

export default lightDasApi;