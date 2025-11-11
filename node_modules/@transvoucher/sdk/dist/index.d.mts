interface TransVoucherConfig {
    apiKey: string;
    apiSecret: string;
    environment?: 'sandbox' | 'production';
    baseUrl?: string;
    timeout?: number;
}
interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
}
interface PaginationMeta {
    has_more: boolean;
    next_page_token?: string;
    count: number;
}
interface CreatePaymentRequest {
    amount?: number;
    currency?: string;
    title: string;
    description?: string;
    redirect_url?: string;
    success_url?: string;
    cancel_url?: string;
    metadata?: Record<string, any>;
    customer_details?: CustomerDetails;
    theme?: 'dark' | 'light';
    lang?: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'tr' | 'ka';
    expires_at?: string;
    custom_fields?: Record<string, any>;
    multiple_use?: boolean;
    cancel_on_first_fail?: boolean;
    is_price_dynamic?: boolean;
    [key: string]: any;
}
interface Payment {
    id: string;
    reference_id: string;
    flow_type?: string;
    transaction_id?: string;
    payment_link_id?: string;
    payment_url?: string;
    title?: string;
    description?: string;
    amount: number;
    currency: string;
    fiat_base_amount?: number;
    fiat_total_amount?: number;
    fiat_currency?: string;
    commodity?: string;
    commodity_amount?: number;
    settled_amount?: number;
    metadata?: Record<string, any>;
    customer_details?: CustomerDetails;
    status: PaymentStatus;
    fail_reason?: string;
    created_at?: string;
    updated_at?: string;
    paid_at?: string;
    payment_method?: {
        card_id?: string;
        card_brand?: string;
        payment_type?: string;
        processed_through?: string;
    };
    payment_details?: Record<string, any>;
    blockchain_tx_hash?: string | null;
    [key: string]: any;
}
type PaymentStatus = 'pending' | 'attempting' | 'processing' | 'completed' | 'failed' | 'expired' | 'cancelled';
interface PaymentListRequest {
    limit?: number;
    page_token?: string;
    status?: PaymentStatus;
    from_date?: string;
    to_date?: string;
}
interface PaymentList {
    payments: Payment[];
    has_more: boolean;
    next_page_token?: string;
    count: number;
}
interface TransactionData {
    id: string;
    reference_id: string;
    fiat_base_amount: number;
    fiat_total_amount: number;
    fiat_currency: string;
    commodity_amount: number;
    settled_amount?: number;
    commodity: string;
    network: string;
    status: PaymentStatus;
    created_at: string;
    updated_at: string;
    paid_at?: string;
    blockchain_tx_hash?: string | null;
}
interface SalesChannelData {
    id: string;
    name: string;
    type: string;
}
interface MerchantData {
    id: string;
    company_name: string;
}
interface WebhookEvent {
    event: WebhookEventType;
    timestamp: string;
    data: {
        payment_link_id?: string;
        transaction: TransactionData;
        sales_channel: SalesChannelData;
        merchant: MerchantData;
        payment_details?: Record<string, any>;
        customer_details?: CustomerDetails;
        metadata?: Record<string, any>;
        fail_reason?: string;
    };
}
interface CustomerDetails {
    id?: string;
    email?: string;
    phone?: string;
    full_name?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    date_of_birth?: string;
    country_of_residence?: string;
    state_of_residence?: string;
    card_country_code?: string;
    card_state_code?: string;
    card_city?: string;
    card_post_code?: string;
    card_street?: string;
}
type WebhookEventType = 'payment_intent.created' | 'payment_intent.attempting' | 'payment_intent.processing' | 'payment_intent.succeeded' | 'payment_intent.failed' | 'payment_intent.cancelled' | 'payment_intent.expired';
interface WebhookVerificationResult {
    isValid: boolean;
    event?: WebhookEvent;
    error?: string;
}
interface RequestOptions {
    timeout?: number;
    headers?: Record<string, string>;
}
declare class TransVoucherError extends Error {
    readonly code?: string;
    readonly statusCode?: number;
    readonly response?: any;
    constructor(message: string, code?: string, statusCode?: number, response?: any);
}
declare class ValidationError extends TransVoucherError {
    readonly errors: Record<string, string[]>;
    constructor(message: string, errors: Record<string, string[]>, statusCode?: number, response?: any);
}
declare class AuthenticationError extends TransVoucherError {
    constructor(message?: string, statusCode?: number, response?: any);
}
declare class ApiError extends TransVoucherError {
    constructor(message: string, statusCode?: number, response?: any);
}
declare class NetworkError extends TransVoucherError {
    constructor(message: string, originalError?: Error);
}
interface Currency {
    short_code: string;
    name: string;
    symbol: string;
    current_usd_value: string;
    processed_via_currency_code: string | null;
}

declare class HttpClient {
    private client;
    private config;
    constructor(config: TransVoucherConfig);
    private createAxiosInstance;
    private getDefaultBaseUrl;
    private handleError;
    get<T = any>(url: string, params?: Record<string, any>, options?: RequestOptions): Promise<ApiResponse<T>>;
    post<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
    put<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
    patch<T = any>(url: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>>;
    delete<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>;
    private buildRequestConfig;
    getBaseUrl(): string;
    updateConfig(newConfig: Partial<TransVoucherConfig>): void;
}

declare class PaymentService {
    private httpClient;
    constructor(httpClient: HttpClient);
    create(data: CreatePaymentRequest, options?: RequestOptions): Promise<Payment>;
    getTransactionStatus(transactionId: string, options?: RequestOptions): Promise<Payment>;
    getPaymentLinkStatus(paymentLinkId: string, options?: RequestOptions): Promise<Payment>;
    isCompleted(payment: Payment): boolean;
    isAttempting(payment: Payment): boolean;
    isProcessing(payment: Payment): boolean;
    isPending(payment: Payment): boolean;
    isFailed(payment: Payment): boolean;
    isExpired(payment: Payment): boolean;
    isCancelled(payment: Payment): boolean;
    list(params?: PaymentListRequest, options?: RequestOptions): Promise<PaymentList>;
    private validateCreatePaymentRequest;
    private validateListRequest;
    private isValidEmail;
    private isValidUrl;
    private isValidDate;
}

declare class CurrencyService {
    private httpClient;
    constructor(httpClient: HttpClient);
    all(options?: RequestOptions): Promise<Currency[]>;
    isProcessedViaAnotherCurrency(currency: Currency): boolean;
    findByCode(shortCode: string, options?: RequestOptions): Promise<Currency | undefined>;
    isSupported(shortCode: string, options?: RequestOptions): Promise<boolean>;
}

declare class WebhookUtils {
    static verifySignature(payload: string | Buffer, signature: string, secret: string): boolean;
    static parseEvent(payload: string | Buffer, signature: string, secret: string): WebhookVerificationResult;
    static generateSignature(payload: string | Buffer, secret: string): string;
    private static secureCompare;
    private static validateEventStructure;
    static extractSignature(signatureHeader: string): string;
    static isEventRecent(timestamp: string | number, toleranceInSeconds?: number): boolean;
    static createHandler(secret: string, handlers: Partial<Record<string, (event: WebhookEvent) => void | Promise<void>>>): (payload: string | Buffer, signature: string) => Promise<void>;
}

declare class TransVoucher {
    private httpClient;
    private config;
    readonly payments: PaymentService;
    readonly currencies: CurrencyService;
    readonly webhooks: typeof WebhookUtils;
    constructor(config: TransVoucherConfig);
    getConfig(): Readonly<TransVoucherConfig>;
    updateConfig(newConfig: Partial<TransVoucherConfig>): void;
    getEnvironment(): 'sandbox' | 'production';
    switchEnvironment(environment: 'sandbox' | 'production'): void;
    getBaseUrl(): string;
    isProduction(): boolean;
    isSandbox(): boolean;
    static validateApiKey(apiKey: string): boolean;
    static sandbox(apiKey: string, apiSecret: string, options?: Partial<TransVoucherConfig>): TransVoucher;
    static production(apiKey: string, apiSecret: string, options?: Partial<TransVoucherConfig>): TransVoucher;
    private validateConfig;
}

export { ApiError, type ApiResponse, AuthenticationError, type CreatePaymentRequest, type Currency, CurrencyService, HttpClient, NetworkError, type PaginationMeta, type Payment, type PaymentList, type PaymentListRequest, PaymentService, type PaymentStatus, type RequestOptions, TransVoucher, type TransVoucherConfig, TransVoucherError, ValidationError, type WebhookEvent, type WebhookEventType, WebhookUtils, type WebhookVerificationResult, TransVoucher as default };
