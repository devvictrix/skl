// frontend/src/api/libraryApi.ts

import { HttpClientService } from "./httpClient";
import type { AxiosRequestConfig } from "axios";

class LibraryApiService extends HttpClientService {
  protected handleRequest = (
    config: AxiosRequestConfig
  ): AxiosRequestConfig => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };
}

const libraryApi = new LibraryApiService("http://localhost:3000");

export default libraryApi;
