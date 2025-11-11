// src/http/client.ts
import axios from "axios";

// src/types.ts
var TransVoucherError = class extends Error {
  constructor(message, code, statusCode, response) {
    super(message);
    this.name = "TransVoucherError";
    this.code = code;
    this.statusCode = statusCode;
    this.response = response;
  }
};
var ValidationError = class extends TransVoucherError {
  constructor(message, errors, statusCode, response) {
    super(message, "VALIDATION_ERROR", statusCode, response);
    this.name = "ValidationError";
    this.errors = errors;
  }
};
var AuthenticationError = class extends TransVoucherError {
  constructor(message = "Authentication failed", statusCode, response) {
    super(message, "AUTHENTICATION_ERROR", statusCode, response);
    this.name = "AuthenticationError";
  }
};
var ApiError = class extends TransVoucherError {
  constructor(message, statusCode, response) {
    super(message, "API_ERROR", statusCode, response);
    this.name = "ApiError";
  }
};
var NetworkError = class extends TransVoucherError {
  constructor(message, originalError) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
};

// src/http/client.ts
var HttpClient = class {
  constructor(config) {
    this.config = config;
    this.client = this.createAxiosInstance();
  }
  createAxiosInstance() {
    const baseURL = this.config.baseUrl || this.getDefaultBaseUrl();
    const instance = axios.create({
      baseURL,
      timeout: this.config.timeout || 3e4,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Key": this.config.apiKey,
        "X-API-Secret": this.config.apiSecret,
        "User-Agent": "TransVoucher-JavaScript-SDK/1.1.0"
      }
    });
    instance.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
    return instance;
  }
  getDefaultBaseUrl() {
    const subdomain = this.config.environment === "production" ? "api" : "api-sandbox";
    return `https://${subdomain}.transvoucher.com/v1.0`;
  }
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message || "An API error occurred";
      switch (status) {
        case 401:
          return new AuthenticationError(message, status, data);
        case 422:
          return new ValidationError(
            message,
            data?.errors || {},
            status,
            data
          );
        case 400:
        case 403:
        case 404:
        case 409:
        case 429:
          return new ApiError(message, status, data);
        default:
          return new TransVoucherError(message, "API_ERROR", status, data);
      }
    } else if (error.request) {
      return new NetworkError("Network error: No response received", error);
    } else {
      return new NetworkError(`Request error: ${error.message}`, error);
    }
  }
  async get(url, params, options) {
    try {
      const config = {
        params,
        ...this.buildRequestConfig(options)
      };
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      throw error instanceof TransVoucherError ? error : this.handleError(error);
    }
  }
  async post(url, data, options) {
    try {
      const config = this.buildRequestConfig(options);
      const response = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error instanceof TransVoucherError ? error : this.handleError(error);
    }
  }
  async put(url, data, options) {
    try {
      const config = this.buildRequestConfig(options);
      const response = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error instanceof TransVoucherError ? error : this.handleError(error);
    }
  }
  async patch(url, data, options) {
    try {
      const config = this.buildRequestConfig(options);
      const response = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error instanceof TransVoucherError ? error : this.handleError(error);
    }
  }
  async delete(url, options) {
    try {
      const config = this.buildRequestConfig(options);
      const response = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw error instanceof TransVoucherError ? error : this.handleError(error);
    }
  }
  buildRequestConfig(options) {
    const config = {};
    if (options?.timeout) {
      config.timeout = options.timeout;
    }
    if (options?.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }
    return config;
  }
  getBaseUrl() {
    return this.client.defaults.baseURL || "";
  }
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.client = this.createAxiosInstance();
  }
};

// src/services/payment.ts
var PaymentService = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * Create a new payment
   */
  async create(data, options) {
    this.validateCreatePaymentRequest(data);
    const response = await this.httpClient.post("/payment/create", data, options);
    if (!response.success || !response.data) {
      throw new ValidationError("Invalid response from payment creation", {});
    }
    return response.data;
  }
  /**
   * Get payment status by ID
   */
  async getTransactionStatus(transactionId, options) {
    if (!transactionId) {
      throw new ValidationError("Transaction ID is required", {
        transactionId: ["Transaction ID is required"]
      });
    }
    const response = await this.httpClient.get(`/payment/status/${transactionId}`, void 0, options);
    if (!response.success || !response.data) {
      throw new ValidationError("Invalid response from payment status check", {});
    }
    return response.data;
  }
  /**
  * Get payment status by ID
  */
  async getPaymentLinkStatus(paymentLinkId, options) {
    if (!paymentLinkId) {
      throw new ValidationError("Payment Link ID is required and must be a number", {
        paymentId: ["Payment Link ID is required and must be a number"]
      });
    }
    const response = await this.httpClient.get(`/payment-link/status/${paymentLinkId}`, void 0, options);
    if (!response.success || !response.data) {
      throw new ValidationError("Invalid response from payment status check", {});
    }
    return response.data;
  }
  /**
   * Check if the payment is completed
   */
  isCompleted(payment) {
    return payment.status === "completed";
  }
  /**
   * Check if the payment is attempting
   */
  isAttempting(payment) {
    return payment.status === "attempting";
  }
  /**
   * Check if the payment is processing
   */
  isProcessing(payment) {
    return payment.status === "processing";
  }
  /**
   * Check if the payment is pending
   */
  isPending(payment) {
    return payment.status === "pending";
  }
  /**
   * Check if the payment has failed
   */
  isFailed(payment) {
    return payment.status === "failed";
  }
  /**
   * Check if the payment has expired
   */
  isExpired(payment) {
    return payment.status === "expired";
  }
  /**
   * Check if the payment has been cancelled
   */
  isCancelled(payment) {
    return payment.status === "cancelled";
  }
  /**
   * List payments with optional filters
   */
  async list(params = {}, options) {
    this.validateListRequest(params);
    const queryParams = {};
    if (params.limit !== void 0) queryParams.limit = params.limit;
    if (params.page_token) queryParams.page_token = params.page_token;
    if (params.status) queryParams.status = params.status;
    if (params.from_date) queryParams.from_date = params.from_date;
    if (params.to_date) queryParams.to_date = params.to_date;
    const response = await this.httpClient.get("/payments", queryParams, options);
    if (!response.success || !response.data) {
      throw new ValidationError("Invalid response from payment list", {});
    }
    return response.data;
  }
  validateCreatePaymentRequest(data) {
    const errors = {};
    const isPriceDynamic = data.is_price_dynamic === true;
    if (data.is_price_dynamic !== void 0 && typeof data.is_price_dynamic !== "boolean") {
      errors.is_price_dynamic = ["is_price_dynamic must be a boolean"];
    }
    if (!isPriceDynamic) {
      if (!data.amount) {
        errors.amount = ["Amount is required"];
      } else if (typeof data.amount !== "number" || data.amount <= 0) {
        errors.amount = ["Amount must be a positive number"];
      }
    } else if (data.amount !== void 0) {
      if (typeof data.amount !== "number" || data.amount <= 0) {
        errors.amount = ["Amount must be a positive number"];
      }
    }
    if (!data.currency) {
      errors.currency = ["Currency is required"];
    } else if (typeof data.currency !== "string" || data.currency.trim().length === 0) {
      errors.currency = ["Currency must be a valid currency code"];
    }
    if (data.title && (typeof data.title !== "string" || data.title.length > 255)) {
      errors.title = ["Title must be a string with maximum 255 characters"];
    }
    if (data.description && (typeof data.description !== "string" || data.description.length > 1e3)) {
      errors.description = ["Description must be a string with maximum 1000 characters"];
    }
    if (data.multiple_use !== void 0 && typeof data.multiple_use !== "boolean") {
      errors.multiple_use = ["Multiple use must be a boolean"];
    }
    if (data.cancel_on_first_fail !== void 0 && typeof data.cancel_on_first_fail !== "boolean") {
      errors.cancel_on_first_fail = ["cancel_on_first_fail must be a boolean"];
    }
    if (data.expires_at && !this.isValidDate(data.expires_at)) {
      errors.expires_at = ["Expires at must be a valid date"];
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }
  }
  validateListRequest(params) {
    const errors = {};
    if (params.limit !== void 0 && (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > 100)) {
      errors.limit = ["Limit must be an integer between 1 and 100"];
    }
    if (params.page_token !== void 0 && typeof params.page_token !== "string") {
      errors.page_token = ["Page token must be a string"];
    }
    if (params.status && !["pending", "attempting", "processing", "completed", "failed", "expired", "cancelled"].includes(params.status)) {
      errors.status = ["Status must be one of: pending, attempting, processing, completed, failed, expired, cancelled"];
    }
    if (params.from_date && !this.isValidDate(params.from_date)) {
      errors.from_date = ["From date must be a valid date in YYYY-MM-DD format"];
    }
    if (params.to_date && !this.isValidDate(params.to_date)) {
      errors.to_date = ["To date must be a valid date in YYYY-MM-DD format"];
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Validation failed", errors);
    }
  }
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  isValidDate(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
};

// src/services/currency.ts
var CurrencyService = class {
  constructor(httpClient) {
    this.httpClient = httpClient;
  }
  /**
   * Get all active processing currencies
   */
  async all(options) {
    const response = await this.httpClient.get("/currencies", void 0, options);
    if (!response.success || !response.data) {
      throw new ValidationError("Invalid response from currencies endpoint", {});
    }
    return response.data;
  }
  /**
   * Check if a currency is processed via another currency
   */
  isProcessedViaAnotherCurrency(currency) {
    return currency.processed_via_currency_code !== null && currency.processed_via_currency_code !== void 0;
  }
  /**
   * Get currency by short code
   */
  async findByCode(shortCode, options) {
    const currencies = await this.all(options);
    return currencies.find((currency) => currency.short_code.toUpperCase() === shortCode.toUpperCase());
  }
  /**
   * Check if a currency code is supported
   */
  async isSupported(shortCode, options) {
    const currency = await this.findByCode(shortCode, options);
    return currency !== void 0;
  }
};

// src/utils/webhook.ts
import * as crypto from "crypto";
var WebhookUtils = class {
  /**
   * Verify webhook signature
   */
  static verifySignature(payload, signature, secret) {
    try {
      const expectedSignature = this.generateSignature(payload, secret);
      return this.secureCompare(signature, expectedSignature);
    } catch (error) {
      return false;
    }
  }
  /**
   * Parse and verify webhook event
   */
  static parseEvent(payload, signature, secret) {
    try {
      if (!this.verifySignature(payload, signature, secret)) {
        return {
          isValid: false,
          error: "Invalid webhook signature"
        };
      }
      const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
      const eventData = JSON.parse(payloadString);
      const validationResult = this.validateEventStructure(eventData);
      if (!validationResult.isValid) {
        return validationResult;
      }
      return {
        isValid: true,
        event: eventData
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Failed to parse webhook event"
      };
    }
  }
  /**
   * Generate webhook signature
   */
  static generateSignature(payload, secret) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    return `sha256=${hmac.digest("hex")}`;
  }
  /**
   * Secure string comparison to prevent timing attacks
   */
  static secureCompare(a, b) {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }
  /**
   * Validate webhook event structure
   */
  static validateEventStructure(eventData) {
    if (!eventData || typeof eventData !== "object") {
      return {
        isValid: false,
        error: "Event data must be an object"
      };
    }
    if (!eventData.event || typeof eventData.event !== "string") {
      return {
        isValid: false,
        error: "Event must have a valid type"
      };
    }
    const validEventTypes = [
      "payment_intent.created",
      "payment_intent.attempting",
      "payment_intent.processing",
      "payment_intent.succeeded",
      "payment_intent.failed",
      "payment_intent.cancelled",
      "payment_intent.expired"
    ];
    if (!validEventTypes.includes(eventData.event)) {
      return {
        isValid: false,
        error: `Invalid event type: ${eventData.type}`
      };
    }
    if (!eventData.data || typeof eventData.data !== "object") {
      return {
        isValid: false,
        error: "Event must have valid data"
      };
    }
    if (!eventData.timestamp || typeof eventData.timestamp !== "string") {
      return {
        isValid: false,
        error: "Event must have a valid timestamp"
      };
    }
    if (!eventData.data || typeof eventData.data !== "object") {
      return {
        isValid: false,
        error: "Event must have valid data"
      };
    }
    const transaction = eventData.data.transaction;
    if (!transaction || typeof transaction !== "object") {
      return {
        isValid: false,
        error: "Event data must have a valid transaction object"
      };
    }
    if (!transaction.id || typeof transaction.id !== "string") {
      return {
        isValid: false,
        error: "Transaction must have a valid ID"
      };
    }
    if (typeof transaction.commodity_amount !== "number" || transaction.commodity_amount <= 0) {
      return {
        isValid: false,
        error: "Transaction must have a valid commodity_amount"
      };
    }
    if (!transaction.commodity || typeof transaction.commodity !== "string") {
      return {
        isValid: false,
        error: "Transaction must have a valid commodity"
      };
    }
    if (!transaction.status || typeof transaction.status !== "string") {
      return {
        isValid: false,
        error: "Transaction must have a valid status"
      };
    }
    return { isValid: true };
  }
  /**
   * Extract signature from header
   */
  static extractSignature(signatureHeader) {
    if (!signatureHeader) {
      throw new TransVoucherError("Signature header is required");
    }
    if (signatureHeader.startsWith("sha256=")) {
      return signatureHeader;
    }
    const parts = signatureHeader.split(",");
    for (const part of parts) {
      if (part.startsWith("v1=")) {
        return `sha256=${part.substring(3)}`;
      }
    }
    throw new TransVoucherError("Invalid signature header format");
  }
  /**
   * Check if webhook event is recent (within tolerance)
   */
  static isEventRecent(timestamp, toleranceInSeconds = 300) {
    try {
      const eventTime = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp * 1e3;
      const currentTime = Date.now();
      const timeDifference = Math.abs(currentTime - eventTime) / 1e3;
      return timeDifference <= toleranceInSeconds;
    } catch {
      return false;
    }
  }
  /**
   * Create a webhook event handler function
   */
  static createHandler(secret, handlers) {
    return async (payload, signature) => {
      const result = this.parseEvent(payload, signature, secret);
      if (!result.isValid || !result.event) {
        throw new TransVoucherError(result.error || "Invalid webhook event");
      }
      const handler = handlers[result.event.event];
      if (handler) {
        await handler(result.event);
      }
    };
  }
};

// src/transvoucher.ts
var TransVoucher = class _TransVoucher {
  constructor(config) {
    this.webhooks = WebhookUtils;
    this.validateConfig(config);
    this.config = { ...config };
    this.httpClient = new HttpClient(this.config);
    this.payments = new PaymentService(this.httpClient);
    this.currencies = new CurrencyService(this.httpClient);
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    if (newConfig.apiKey !== void 0 || newConfig.environment !== void 0 || newConfig.baseUrl !== void 0) {
      const updatedConfig = { ...this.config, ...newConfig };
      this.validateConfig(updatedConfig);
      this.config = updatedConfig;
      this.httpClient.updateConfig(updatedConfig);
    } else {
      this.config = { ...this.config, ...newConfig };
    }
  }
  /**
   * Get the current environment
   */
  getEnvironment() {
    return this.config.environment || "sandbox";
  }
  /**
   * Switch environment
   */
  switchEnvironment(environment) {
    this.updateConfig({ environment });
  }
  /**
   * Get current base URL
   */
  getBaseUrl() {
    return this.httpClient.getBaseUrl();
  }
  /**
   * Check if SDK is configured for production
   */
  isProduction() {
    return this.getEnvironment() === "production";
  }
  /**
   * Check if SDK is configured for sandbox
   */
  isSandbox() {
    return this.getEnvironment() === "sandbox";
  }
  /**
   * Validate API key format
   */
  static validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== "string") {
      return false;
    }
    return apiKey.trim().length >= 10;
  }
  /**
   * Create a new TransVoucher instance for sandbox
   */
  static sandbox(apiKey, apiSecret, options) {
    return new _TransVoucher({
      apiKey,
      apiSecret,
      environment: "sandbox",
      ...options
    });
  }
  /**
   * Create a new TransVoucher instance for production
   */
  static production(apiKey, apiSecret, options) {
    return new _TransVoucher({
      apiKey,
      apiSecret,
      environment: "production",
      ...options
    });
  }
  validateConfig(config) {
    const errors = {};
    if (!config.apiKey) {
      errors.apiKey = ["API key is required"];
    } else if (typeof config.apiKey !== "string") {
      errors.apiKey = ["API key must be a string"];
    } else if (!_TransVoucher.validateApiKey(config.apiKey)) {
      errors.apiKey = ["API key format is invalid"];
    }
    if (!config.apiSecret) {
      errors.apiSecret = ["API secret is required"];
    } else if (typeof config.apiSecret !== "string") {
      errors.apiSecret = ["API secret must be a string"];
    } else if (config.apiSecret.trim().length < 10) {
      errors.apiSecret = ["API secret format is invalid"];
    }
    if (config.environment && !["sandbox", "production"].includes(config.environment)) {
      errors.environment = ['Environment must be either "sandbox" or "production"'];
    }
    if (config.baseUrl) {
      try {
        new URL(config.baseUrl);
      } catch {
        errors.baseUrl = ["Base URL must be a valid URL"];
      }
    }
    if (config.timeout !== void 0) {
      if (typeof config.timeout !== "number" || config.timeout <= 0) {
        errors.timeout = ["Timeout must be a positive number"];
      }
    }
    if (Object.keys(errors).length > 0) {
      throw new ValidationError("Invalid configuration", errors);
    }
  }
};

// src/index.ts
var index_default = TransVoucher;
export {
  ApiError,
  AuthenticationError,
  CurrencyService,
  HttpClient,
  NetworkError,
  PaymentService,
  TransVoucher,
  TransVoucherError,
  ValidationError,
  WebhookUtils,
  index_default as default
};
