import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  AxiosError,
} from "axios";
import axiosRetry from "axios-retry";

/**
 * @class HttpClientService
 * @description A robust, retry-enabled HTTP client built on top of Axios.
 * This service provides a standardized way to make HTTP requests with
 * configurable automatic retries, exponential backoff, and centralized
 * error handling. It's designed to be extended for specific API clients.
 */
export class HttpClientService {
  /**
   * The underlying Axios instance used for all HTTP requests.
   * @protected
   * @type {AxiosInstance}
   */
  protected instance: AxiosInstance;

  /**
   * The maximum number of retry attempts for failed requests.
   * @private
   * @type {number}
   */
  private maxRetries: number;

  /**
   * A list of HTTP status codes that should trigger a retry.
   * @private
   * @type {number[]}
   */
  private retriableStatusCodes: number[];

  /**
   * A list of network error codes (e.g., 'ECONNRESET') that should trigger a retry.
   * @private
   * @type {string[]}
   */
  private retriableErrorCodes: string[];

  /**
   * The exponential factor to use for calculating retry delays.
   * @private
   * @type {number}
   */
  private exponential: number;

  /**
   * Creates an instance of HttpClientService.
   * @param {string} baseURL The base URL for all requests made by this client.
   * @param {number} [timeout=15000] The request timeout in milliseconds.
   * @param {number} [maxRetries=3] The maximum number of times to retry a failed request.
   * @param {number[]} [retriableStatusCodes=[408, 429, 500, 502, 503, 504]] A list of HTTP status codes that will trigger a retry.
   * @param {string[]} [retriableErrorCodes=[...]] A list of system/network error codes that will trigger a retry.
   * @param {number} [exponential=2] The base for the exponential backoff calculation (delay = 1000 * exponential^retryCount).
   */
  constructor(
    baseURL: string,
    timeout = 15000,
    maxRetries = 3,
    retriableStatusCodes = [408, 429, 500, 502, 503, 504],
    retriableErrorCodes = [
      "ETIMEDOUT",
      "ECONNREFUSED",
      "ECONNRESET",
      "ENOTFOUND",
      "ENETUNREACH",
      "EHOSTUNREACH",
      "ECONNABORTED",
      "EADDRINUSE",
      "EADDRNOTAVAIL",
      "EPIPE",
      "EMFILE",
      "ENFILE",
      "EAI_AGAIN",
      "ENETDOWN",
      "ENONET",
      "EHOSTDOWN",
      "EPROTO",
      "ENOPROTOOPT",
      "ENOTSOCK",
      "ESOCKTNOSUPPORT",
    ],
    exponential = 2
  ) {
    this.maxRetries = maxRetries;
    this.retriableStatusCodes = retriableStatusCodes;
    this.retriableErrorCodes = retriableErrorCodes;
    this.exponential = exponential;

    this.instance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    this.initializeInterceptors();
  }

  /**
   * @private
   * @method initializeInterceptors
   * @description Sets up the axios-retry mechanism and request/response interceptors for the Axios instance.
   * This includes configuring the retry delay logic and the conditions under which a request should be retried.
   */
  private initializeInterceptors(): void {
    axiosRetry(this.instance, {
      retries: this.maxRetries,
      retryDelay: (retryCount: number) => {
        // Exponential backoff delay
        return 1000 * Math.pow(this.exponential, retryCount);
      },
      retryCondition: (error: AxiosError) => {
        // Retry on specific HTTP status codes
        if (
          error.response &&
          this.retriableStatusCodes.includes(error.response.status)
        ) {
          return true;
        }

        // Retry on specific network/system error codes
        if (error.code && this.retriableErrorCodes.includes(error.code)) {
          return true;
        }

        // Retry on content length errors
        if (
          error.message?.includes("maxContentLength") ||
          error.code === "ERR_FR_MAX_CONTENT_LENGTH_EXCEEDED"
        ) {
          return true;
        }

        return false;
      },
    });

    // Standard request/response interceptors
    this.instance.interceptors.request.use(
      this.handleRequest,
      this.handleError
    );

    this.instance.interceptors.response.use(
      this.handleResponse,
      this.handleError
    );
  }

  /**
   * @protected
   * @method handleRequest
   * @description A request interceptor that can be overridden by child classes to modify the request config before it is sent.
   * For example, to inject an authentication token.
   * @param {AxiosRequestConfig | any} config The outgoing request configuration.
   * @returns {AxiosRequestConfig | any} The potentially modified configuration.
   */
  protected handleRequest = (
    config: AxiosRequestConfig
  ): AxiosRequestConfig | any => {
    // Child classes can override this to add custom logic, e.g., adding auth headers
    return config;
  };

  /**
   * @protected
   * @method handleResponse
   * @description A response interceptor that processes the response before it is returned to the caller.
   * Child classes can override this to perform custom response handling.
   * @param {AxiosResponse} response The incoming response object.
   * @returns {AxiosResponse} The response object.
   */
  protected handleResponse = (response: AxiosResponse): AxiosResponse => {
    // Child classes can override this to add custom logic
    return response;
  };

  /**
   * @protected
   * @method handleError
   * @description A centralized error handler for all failed requests. It logs detailed information about the error
   * and then rejects the promise to propagate the error.
   * @param {AxiosError} error The error object caught by Axios.
   * @returns {Promise<never>} A promise that is always rejected with the original error.
   */
  protected handleError = (error: AxiosError): Promise<never> => {
    console.log(`Error Type: ${error.code || "No Code"}`);
    console.log(`Error Message: ${error.message}`);

    if (error.response) {
      console.log(`Response Status: ${error.response.status}`);
      console.log(`Response Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log("No HTTP response was received.");
    }

    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.log("Timeout: Request timed out.");
    }

    if (!error.response && error.request) {
      console.log(
        "Network Error: The request was made but no response was received"
      );
    } else if (!error.response && !error.request) {
      console.log(
        "Request Setup Error: An error occurred setting up the request."
      );
    }

    console.log("Complete Error Object:", JSON.stringify(error, null, 2));
    console.log("error.response", error.response);

    return Promise.reject(error);
  };

  /**
   * @public
   * @method get
   * @description Sends a GET request to the specified URL.
   * @template T The expected type of the response data.
   * @param {string} url The URL path for the request.
   * @param {AxiosRequestConfig} [config] Optional Axios request configuration.
   * @returns {Promise<AxiosResponse<T>>} A promise that resolves with the Axios response.
   */
  public async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return await this.instance.get(url, config);
  }

  /**
   * @public
   * @method post
   * @description Sends a POST request to the specified URL.
   * @template T The expected type of the response data.
   * @param {string} url The URL path for the request.
   * @param {any} [data] The request payload.
   * @param {AxiosRequestConfig} [config] Optional Axios request configuration.
   * @returns {Promise<AxiosResponse<T>>} A promise that resolves with the Axios response.
   */
  public async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return await this.instance.post(url, data, config);
  }

  /**
   * @public
   * @method put
   * @description Sends a PUT request to the specified URL.
   * @template T The expected type of the response data.
   * @param {string} url The URL path for the request.
   * @param {any} [data] The request payload.
   * @param {AxiosRequestConfig} [config] Optional Axios request configuration.
   * @returns {Promise<AxiosResponse<T>>} A promise that resolves with the Axios response.
   */
  public async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return await this.instance.put(url, data, config);
  }

  /**
   * @public
   * @method delete
   * @description Sends a DELETE request to the specified URL.
   * @template T The expected type of the response data.
   * @param {string} url The URL path for the request.
   * @param {any} [data] The request payload, sent in the `data` property of the config.
   * @param {AxiosRequestConfig} [config] Optional Axios request configuration.
   * @returns {Promise<AxiosResponse<T>>} A promise that resolves with the Axios response.
   */
  public async delete<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    const finalConfig: AxiosRequestConfig = {
      ...config,
      data,
    };
    return await this.instance.delete(url, finalConfig);
  }

  /**
   * @public
   * @method patch
   * @description Sends a PATCH request to the specified URL.
   * @template T The expected type of the response data.
   * @param {string} url The URL path for the request.
   * @param {any} [data] The request payload.
   * @param {AxiosRequestConfig} [config] Optional Axios request configuration.
   * @returns {Promise<AxiosResponse<T>>} A promise that resolves with the Axios response.
   */
  public async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return await this.instance.patch(url, data, config);
  }
}
