const crypto = require('crypto');
const axios = require('axios');

/**
 * MoMo Payment Service
 * Xử lý tích hợp thanh toán MoMo
 */
class MoMoService {
  constructor() {
    // MoMo Configuration - CHỈ CẦN CHO WEB PAYMENT
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO4EBF20250911',
      accessKey: process.env.MOMO_ACCESS_KEY,
      secretKey: process.env.MOMO_SECRET_KEY,
      endpoint: process.env.MOMO_ENDPOINT || 'https://payment.momo.vn/v2/gateway/api/create',
      redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment-success',
      ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/momo/webhook',
      requestType: 'captureWallet',
      extraData: ''
    };
    
    // console.log('🔧 MoMo Config loaded:', {
    //   partnerCode: this.config.partnerCode,
    //   endpoint: this.config.endpoint,
    //   hasAccessKey: !!this.config.accessKey,
    //   hasSecretKey: !!this.config.secretKey,
    //   redirectUrl: this.config.redirectUrl,
    //   ipnUrl: this.config.ipnUrl
    // });

    // Validate required configs
    if (!this.config.accessKey || !this.config.secretKey) {
      console.error('❌ MoMo credentials missing! Please set MOMO_ACCESS_KEY and MOMO_SECRET_KEY in .env');
      throw new Error('MoMo credentials not configured');
    }
  }

  /**
   * Tạo chữ ký cho MoMo request
   */
  createSignature(data) {
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;
    
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  /**
   * Xác thực chữ ký từ MoMo webhook
   */
  verifySignature(data) {
    const { 
      accessKey, amount, extraData, message, orderId, orderInfo, 
      orderType, partnerCode, payType, requestId, responseTime, 
      resultCode, transId, signature 
    } = data;
    
    const actualAccessKey = accessKey || this.config.accessKey;
    const rawSignature = `accessKey=${actualAccessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');
    
    return expectedSignature === signature;
  }

  /**
   * Generate unique order ID
   */
  generateOrderId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `PREM${timestamp}${userId}${random}`;
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `REQ${timestamp}${random}`;
  }

  /**
   * Tạo payment request tới MoMo
   */
  async createPayment(orderData) {
    const { orderId, amount, orderInfo, extraData = '' } = orderData;
    const requestId = this.generateRequestId();
    
    const requestData = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      storeName: "Chinese Learning Platform",
      storeId: "MomoStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: this.config.redirectUrl,
      ipnUrl: this.config.ipnUrl,
      requestType: this.config.requestType,
      extraData,
      lang: 'vi',
      autoCapture: true,
      signature: this.createSignature({
        amount, orderId, orderInfo, extraData,
        ipnUrl: this.config.ipnUrl,
        redirectUrl: this.config.redirectUrl,
        partnerCode: this.config.partnerCode,
        requestId,
        requestType: this.config.requestType
      })
    };

    try {
      const response = await axios.post(this.config.endpoint, requestData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      return this.processPaymentResponse(response.data);

    } catch (error) {
      console.error('❌ MoMo payment error:', error.message);
      return {
        success: false,
        error: `Lỗi kết nối với MoMo: ${error.message}`
      };
    }
  }

  /**
   * Xử lý response từ MoMo API
   */
  processPaymentResponse(result) {
    const baseData = {
      orderId: result.orderId,
      requestId: result.requestId,
      amount: result.amount,
      payUrl: result.payUrl,
      qrCodeUrl: result.qrCodeUrl,
      deeplink: result.deeplink,
      deeplinkMiniApp: result.deeplink
    };

    // Success codes
    if ([0, 9000].includes(result.resultCode)) {
      return { success: true, data: baseData };
    }

    // Pending codes
    if ([1000, 7000, 7002].includes(result.resultCode)) {
      return {
        success: true,
        pending: true,
        data: baseData,
        message: result.message || 'Giao dịch đang được xử lý'
      };
    }

    // Fatal error codes (no retry)
    if ([13, 20, 21, 22, 40, 41, 42, 43].includes(result.resultCode)) {
      return {
        success: false,
        error: result.message || 'Lỗi cấu hình hoặc dữ liệu không hợp lệ',
        resultCode: result.resultCode,
        canRetry: false
      };
    }

    // Retryable errors
    return {
      success: false,
      error: result.message || 'Lỗi tạo thanh toán MoMo',
      resultCode: result.resultCode,
      canRetry: true
    };
  }

  /**
   * Kiểm tra trạng thái giao dịch
   */
  async queryPaymentStatus(orderId, requestId) {
    const queryData = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      orderId,
      lang: 'vi'
    };

    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
    queryData.signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    try {
      const response = await axios.post(`${this.config.endpoint}/query`, queryData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      throw new Error(`MoMo query failed: ${error.message}`);
    }
  }

  /**
   * Format amount to integer (VND)
   */
  formatAmount(amount) {
    return parseInt(amount, 10);
  }

  /**
   * Generate order info description
   */
  generateOrderInfo(planName, username) {
    return `Nang cap ${planName} cho ${username}`;
  }

  /**
   * Validate webhook data
   */
  validateWebhookData(data) {
    const requiredFields = ['partnerCode', 'orderId', 'requestId', 'amount', 'resultCode', 'signature'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!data[field] && data[field] !== 0) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Skip signature validation in development mode
    if (process.env.MOMO_SKIP_SIGNATURE === 'true') {
      // console.log('⚠️ [DEV] Skipping signature validation');
      return { valid: true };
    }

    // Verify signature
    if (!this.verifySignature(data)) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
  }

  /**
   * Parse result code message
   */
  getResultMessage(resultCode) {
    const messages = new Map([
      [0, 'Giao dịch thành công'],
      [9000, 'Giao dịch được phê duyệt thành công'],
      [8000, 'Giao dịch đang được xử lý'],
      [7000, 'Trừ tiền thành công. Giao dịch bị tình nghi (Fraud)'],
      [6000, 'Giao dịch đã bị hủy'],
      [5000, 'Giao dịch bị từ chối'],
      [4000, 'Giao dịch thất bại do quá hạn thanh toán'],
      [3000, 'Giao dịch bị từ chối do tài khoản người dùng bị khóa'],
      [2000, 'Giao dịch thất bại do sai thông tin'],
      [1000, 'Lỗi không xác định'],
      [10, 'Lỗi hệ thống'],
      [11, 'Lỗi checksum'],
      [12, 'Lỗi limit'],
      [13, 'Lỗi thông tin giao dịch'],
      [20, 'Số dư tài khoản không đủ'],
      [21, 'Số tiền giao dịch vượt quá hạn mức'],
      [40, 'RequestId trùng lặp'],
      [41, 'OrderId trùng lặp'],
      [42, 'OrderId không hợp lệ hoặc không tồn tại'],
      [43, 'Yêu cầu bị từ chối do ip không được phép'],
      [99, 'Lỗi không xác định khác']
    ]);

    return messages.get(resultCode) || `Mã lỗi không xác định: ${resultCode}`;
  }

  /**
   * Validate order data before creating payment
   */
  validateOrderData(orderData) {
    const { orderId, amount, orderInfo } = orderData;
    const errors = [];

    if (!orderId || typeof orderId !== 'string') {
      errors.push('Order ID is required and must be a string');
    }

    if (!amount || typeof amount !== 'number' || amount < 1000) {
      errors.push('Amount must be a number and at least 1,000 VND');
    }

    if (!orderInfo || typeof orderInfo !== 'string') {
      errors.push('Order info is required and must be a string');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = MoMoService;
