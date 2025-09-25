/**
 * Notes: 导出相关函数
 * Ver : CCMiniCloud Framework 2.0.14 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2022-05-25 04:00:00 
 */

const cloudBase = require('../../framework/cloud/cloud_base.js');
const cloudUtil = require('../../framework/cloud/cloud_util.js');
const timeUtil = require('../../framework/utils/time_util.js');
const util = require('../../framework/utils/util.js');
const md5Lib = require('../../framework/lib/md5_lib.js');
const config = require('../../config/config.js');
const setupUtil = require('../utils/setup/setup_util.js');

// 获得当前导出链接
// 修改 getExportDataURL 方法，返回 total
async function getExportDataURL(key) {
  let url = '';
  let time = '';
  let total = 0; // 新增 total 变量
  let expData = await setupUtil.get(key);
  if (expData) {
      url = expData.EXPORT_CLOUD_ID;
      url = await cloudUtil.getTempFileURLOne(url) + '?rd=' + timeUtil.time();
      time = timeUtil.timestamp2Time(expData.EXPORT_ADD_TIME);
      total = expData.EXPORT_TOTAL || 0; // 从存储中获取 total
  }

  return {
      url,
      time,
      total // 新增：返回 total
  };
}
// 删除数据文件
async function deleteDataExcel(key) {
	console.log('[deleteExcel]  BEGIN... , key=' + key)

	// 取出数据  
	let expData = await setupUtil.get(key);
	if (!expData) return;

	// 文件路径
	let xlsPath = expData.EXPORT_CLOUD_ID;

	console.log('[deleteExcel]  path = ' + xlsPath);

	const cloud = cloudBase.getCloud();
	await cloud.deleteFile({
		fileList: [xlsPath],
	}).then(async res => {
		console.log(res.fileList);
		if (res.fileList && res.fileList[0] && res.fileList[0].status == -503003) {
			console.log('[deleteUserExcel]  ERROR = ', res.fileList[0].status + ' >> ' + res.fileList[0].errMsg);
			//this.AppError('文件不存在或者已经删除');
		}

		// 删除导出数据记录
		await setupUtil.remove(key);

		console.log('[deleteExcel]  OVER.');

	}).catch(error => {
		if (error.name != 'AppError') {
			console.log('[deleteExcel]  ERROR = ', error);
			this.AppError('操作失败，请重新删除');
		} else
			throw error;
	});


}

// 导出数据  
// 在 export_util.js 中修改 exportDataExcel 方法，增加 total 存储
async function exportDataExcel(key, title, total, data, options = {}) {
  await setupUtil.remove(key); // 先删除旧记录

  let fileName = key + '_' + md5Lib.md5(key + config.CLOUD_ID);
  let xlsPath = util.getProjectId() + '/' + 'export/' + fileName + '.xlsx';

  const xlsx = require('node-xlsx');
  let buffer = await xlsx.build([{
      name: title + timeUtil.time('Y-M-D'),
      data,
      options
  }]);

  const cloud = cloudBase.getCloud();
  let upload = await cloud.uploadFile({
      cloudPath: xlsPath,
      fileContent: buffer,
  });
  if (!upload || !upload.fileID) return;

  // 存储时增加 EXPORT_TOTAL 字段
  let dataExport = {
      EXPORT_ADD_TIME: timeUtil.time(),
      EXPORT_KEY: key,
      EXPORT_CLOUD_ID: upload.fileID,
      EXPORT_TOTAL: total // 新增：存储总条数
  };
  await setupUtil.set(key, dataExport, 'export');

  console.log('[ExportData]  OVER.')

  let url = await cloudUtil.getTempFileURLOne(upload.fileID) + '?rd=' + timeUtil.time();
  return {
      total, // 返回 total
      url
  };
}




module.exports = {
	getExportDataURL,
	deleteDataExcel,
	exportDataExcel
}