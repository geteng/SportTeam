/**
 * Notes: 通用工具函数
 * Ver : CCMiniCloud Framework 2.38.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2020-09-05 04:00:00 
 */

function getProjectId() {
	if (global.PID)
		return global.PID;
	else
		return 'ONE';
}

/**
 * 判断变量，参数，对象属性是否定义
 * @param {*} val 
 */
function isDefined(val) {
	// ==  不能判断是否为null
	if (val === undefined)
		return false;
	else
		return true;
}

/**
 * 判断对象是否为空
 * @param {*} obj 
 */
function isObjectNull(obj) {
	return (Object.keys(obj).length == 0);
}



/**
 * 休眠时间，配合await使用 
 * @param {*} time 毫秒
 */
function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
};

/**
 * 验证手机号格式（支持国内11位手机号，含常见号段）
 * @param {String} mobile - 待验证的手机号
 * @returns {Boolean} - true=格式正确，false=格式错误
 */
function isMobile(mobile) {
  if (typeof mobile !== 'string') return false; // 确保是字符串（避免数字类型的手机号被误判）
  // 正则表达式：匹配国内11位手机号（以13/14/15/16/17/18/19开头）
  const reg = /^1[3-9]\d{9}$/; 
  return reg.test(mobile);
};


module.exports = {
	getProjectId,
	isDefined, //判断变量，参数，对象属性是否定义  
	sleep,
	isObjectNull,
  isMobile,
}