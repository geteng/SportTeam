// const { AppError } = require('../utils/error');
// const timeUtil = require('../utils/time_util');
// const cloudUtil = require('../utils/cloud_util');
// const EnrollJoinModel = require('../models/enroll_join_model');
// const LogModel = require('../models/log_model');

// class PayService {
//   constructor(projectId, ip) {
//     this._pid = projectId; // 项目ID
//     this._ip = ip; // 客户端IP
//     this._timestamp = timeUtil.timestamp(); // 当前时间戳
//   }

//   /**
//    * 创建支付订单
//    * @param {Object} params 支付参数
//    * @param {string} params.enrollJoinId 预约记录ID
//    * @param {number} params.totalFee 支付金额(分)
//    * @param {string} params.body 商品描述
//    * @returns {Promise<Object>} 支付参数
//    */
//   async createOrder({ enrollJoinId, totalFee, body }) {
//     // 1. 参数验证
//     if (!enrollJoinId) {
//       throw new AppError('请传入有效的预约记录ID');
//     }
//     if (!totalFee || totalFee <= 0) {
//       throw new AppError('支付金额必须大于0');
//     }
//     if (!body) {
//       throw new AppError('请传入商品描述');
//     }

//     // 2. 验证预约记录状态
//     const enrollJoin = await EnrollJoinModel.getOne(
//       { _id: enrollJoinId, _pid: this._pid },
//       'ENROLL_JOIN_STATUS, ENROLL_JOIN_PAY_STATUS, ENROLL_JOIN_ENROLL_TITLE'
//     );

//     if (!enrollJoin) {
//       throw new AppError('预约记录不存在');
//     }

//     // 检查状态是否允许支付
//     if (enrollJoin.ENROLL_JOIN_STATUS !== EnrollJoinModel.STATUS.SUCC) {
//       throw new AppError('只有待支付状态的订单可以发起支付');
//     }

//     if (enrollJoin.ENROLL_JOIN_PAY_STATUS === 1) {
//       throw new AppError('该订单已支付，无需重复支付');
//     }

//     // 3. 生成商户订单号
//     const outTradeNo = `ENROLL${this._pid}${Date.now()}${Math.floor(Math.random() * 1000)}`;

//     // 4. 调用微信支付接口创建订单
//     try {
//       // 实际项目中应调用微信支付API或云函数
//       const payResult = await cloudUtil.callWxPay({
//         action: 'unifiedOrder',
//         params: {
//           outTradeNo,
//           totalFee,
//           body: `场地预订-${body}`,
//           spbillCreateIp: this._ip,
//           notifyUrl: `${process.env.DOMAIN}/api/pay/notify`, // 支付结果通知地址
//           tradeType: 'JSAPI'
//         }
//       });

//       // 5. 更新预约记录的支付信息
//       await EnrollJoinModel.edit(
//         { _id: enrollJoinId, _pid: this._pid },
//         {
//           ENROLL_JOIN_PAY_NO: outTradeNo,
//           ENROLL_JOIN_PAY_FEE: totalFee,
//           ENROLL_JOIN_PAY_TIME: this._timestamp,
//           ENROLL_JOIN_EDIT_TIME: this._timestamp
//         }
//       );

//       // 6. 记录支付日志
//       this._insertPayLog(
//         `创建支付订单: ${outTradeNo}，金额: ${totalFee / 100}元`,
//         enrollJoinId
//       );

//       return {
//         payParams: payResult.payParams, // 前端调起支付的参数
//         outTradeNo
//       };
//     } catch (error) {
//       console.error('创建支付订单失败:', error);
//       throw new AppError(`支付创建失败: ${error.message || '系统异常'}`);
//     }
//   }

//   /**
//    * 验证支付结果
//    * @param {Object} params 验证参数
//    * @param {string} params.enrollJoinId 预约记录ID
//    * @param {string} params.outTradeNo 商户订单号
//    * @returns {Promise<Object>} 验证结果
//    */
//   async verifyPayment({ enrollJoinId, outTradeNo }) {
//     // 1. 参数验证
//     if (!enrollJoinId || !outTradeNo) {
//       throw new AppError('请传入完整的验证参数');
//     }

//     // 2. 调用微信支付查询接口
//     try {
//       const payStatus = await cloudUtil.callWxPay({
//         action: 'queryOrder',
//         params: { outTradeNo }
//       });

//       // 3. 支付成功处理
//       if (payStatus.tradeState === 'SUCCESS') {
//         // 更新订单支付状态
//         await EnrollJoinModel.edit(
//           { _id: enrollJoinId, _pid: this._pid },
//           {
//             ENROLL_JOIN_PAY_STATUS: 1, // 1=已支付
//             ENROLL_JOIN_PAY_TRADE_NO: payStatus.transactionId,
//             ENROLL_JOIN_PAY_FINISH_TIME: timeUtil.timestamp(),
//             ENROLL_JOIN_EDIT_TIME: this._timestamp
//           }
//         );

//         // 记录支付成功日志
//         this._insertPayLog(
//           `支付成功，商户订单号: ${outTradeNo}，微信订单号: ${payStatus.transactionId}`,
//           enrollJoinId
//         );

//         return {
//           success: true,
//           tradeState: 'SUCCESS',
//           payTime: payStatus.timeEnd
//         };
//       }

//       return {
//         success: false,
//         tradeState: payStatus.tradeState,
//         message: payStatus.tradeStateDesc
//       };
//     } catch (error) {
//       console.error('验证支付结果失败:', error);
//       throw new AppError(`支付验证失败: ${error.message || '系统异常'}`);
//     }
//   }

//   /**
//    * 申请退款
//    * @param {Object} params 退款参数
//    * @param {string} params.enrollJoinId 预约记录ID
//    * @param {string} params.outTradeNo 商户订单号
//    * @param {number} params.refundFee 退款金额(分)
//    * @returns {Promise<Object>} 退款结果
//    */
//   async refund({ enrollJoinId, outTradeNo, refundFee }) {
//     // 1. 参数验证
//     if (!enrollJoinId || !outTradeNo) {
//       throw new AppError('请传入完整的退款参数');
//     }
//     if (!refundFee || refundFee <= 0) {
//       throw new AppError('退款金额必须大于0');
//     }

//     // 2. 验证订单状态
//     const enrollJoin = await EnrollJoinModel.getOne(
//       { _id: enrollJoinId, _pid: this._pid },
//       'ENROLL_JOIN_PAY_STATUS, ENROLL_JOIN_PAY_FEE'
//     );

//     if (!enrollJoin) {
//       throw new AppError('预约记录不存在');
//     }

//     if (enrollJoin.ENROLL_JOIN_PAY_STATUS !== 1) {
//       throw new AppError('只有已支付的订单可以申请退款');
//     }

//     if (refundFee > enrollJoin.ENROLL_JOIN_PAY_FEE) {
//       throw new AppError('退款金额不能超过支付金额');
//     }

//     // 3. 生成退款单号
//     const outRefundNo = `REFUND${this._pid}${Date.now()}${Math.floor(Math.random() * 1000)}`;

//     // 4. 调用微信退款接口
//     try {
//       const refundResult = await cloudUtil.callWxPay({
//         action: 'refund',
//         params: {
//           outTradeNo,
//           outRefundNo,
//           totalFee: enrollJoin.ENROLL_JOIN_PAY_FEE,
//           refundFee
//         }
//       });

//       // 5. 更新订单退款状态
//       await EnrollJoinModel.edit(
//         { _id: enrollJoinId, _pid: this._pid },
//         {
//           ENROLL_JOIN_PAY_STATUS: 8, // 8=已退款
//           ENROLL_JOIN_REFUND_NO: outRefundNo,
//           ENROLL_JOIN_REFUND_FEE: refundFee,
//           ENROLL_JOIN_REFUND_TIME: this._timestamp,
//           ENROLL_JOIN_EDIT_TIME: this._timestamp
//         }
//       );

//       // 6. 记录退款日志
//       this._insertPayLog(
//         `退款成功，退款单号: ${outRefundNo}，金额: ${refundFee / 100}元`,
//         enrollJoinId
//       );

//       return {
//         success: true,
//         outRefundNo,
//         refundId: refundResult.refundId
//       };
//     } catch (error) {
//       console.error('申请退款失败:', error);
//       throw new AppError(`退款失败: ${error.message || '系统异常'}`);
//     }
//   }

//   /**
//    * 关闭订单
//    * @param {string} outTradeNo 商户订单号
//    * @returns {Promise<Object>} 关闭结果
//    */
//   async closeOrder(outTradeNo) {
//     if (!outTradeNo) {
//       throw new AppError('请传入商户订单号');
//     }

//     try {
//       await cloudUtil.callWxPay({
//         action: 'closeOrder',
//         params: { outTradeNo }
//       });

//       // 查找并更新相关订单状态
//       const enrollJoin = await EnrollJoinModel.getOne(
//         { ENROLL_JOIN_PAY_NO: outTradeNo, _pid: this._pid },
//         '_id'
//       );

//       if (enrollJoin) {
//         await EnrollJoinModel.edit(
//           { _id: enrollJoin._id, _pid: this._pid },
//           {
//             ENROLL_JOIN_EDIT_TIME: this._timestamp,
//             ENROLL_JOIN_PAY_STATUS: 0 // 重置为未支付
//           }
//         );

//         this._insertPayLog(`订单已关闭: ${outTradeNo}`, enrollJoin._id);
//       }

//       return { success: true };
//     } catch (error) {
//       console.error('关闭订单失败:', error);
//       throw new AppError(`关闭订单失败: ${error.message || '系统异常'}`);
//     }
//   }

//   /**
//    * 记录支付相关日志
//    * @param {string} content 日志内容
//    * @param {string} enrollJoinId 预约记录ID
//    */
//   async _insertPayLog(content, enrollJoinId) {
//     await LogModel.insert({
//       _pid: this._pid,
//       LOG_CONTENT: content,
//       LOG_TYPE: LogModel.TYPE.PAY,
//       LOG_RELATE_ID: enrollJoinId,
//       LOG_ADD_TIME: this._timestamp,
//       LOG_IP: this._ip
//     });
//   }
// }

// module.exports = PayService;
