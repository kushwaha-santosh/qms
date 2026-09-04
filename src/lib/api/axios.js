import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    /*
     * Do NOT force application/json when sending FormData.
     *
     * Axios/browser will automatically set:
     *
     * multipart/form-data; boundary=...
     *
     * This boundary is required for Next.js request.formData()
     * to correctly receive the uploaded File.
     */
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    } else {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const response = error?.response;

    const message =
      response?.data?.message || error?.message || "Something went wrong.";

    error.apiMessage = message;

    return Promise.reject(error);
  },
);

export default api;
