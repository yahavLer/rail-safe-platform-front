import axios from "axios";

export const userHttp = axios.create({ baseURL: import.meta.env.VITE_USER_API });
export const orgHttp  = axios.create({ baseURL: import.meta.env.VITE_ORG_API });
export const riskHttp = axios.create({ baseURL: import.meta.env.VITE_RISK_API });
export const taskHttp = axios.create({ baseURL: import.meta.env.VITE_TASK_API });
export const imageHttp = axios.create({ baseURL: import.meta.env.VITE_IMAGE_API });
