const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const EnrollBiz = require('../../../../biz/enroll_biz.js'); 
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js'); // 引入云助手

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
    isLoad: false,
    list:null,
    list2:null,
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad(options) {
		if (!AdminBiz.isAdmin(this)) return; 

		let list = EnrollBiz.getCateListOptions();
    console.log('一级别场地列表大全:', list)

		for (let k = 0; k < list.length; k++) {
			list[k].titleEn = (list[k].label + '预订须知');
		}
		this.setData({
			isLoad: true,
			list
		});

		// 新增逻辑：通过服务端路由admin/enroll_list获取场地列表
		let list2 = [];
		try {
			// 调用服务端接口，可根据需要传入参数（如空对象{}）
      const res = await cloudHelper.callCloudData('admin/enroll_list', {}, { title: '加载场地列表' });
      console.log('二级别场地列表大全:', res)

      list2 = res.list || []; // 假设接口返回的数据在res.data中

      for (let k = 0; k < list2.length; k++) {
        list2[k].titleEn = (list2[k].ENROLL_TITLE + '预订须知');
      }

		} catch (err) {
			console.error('获取场地列表失败：', err);
			pageHelper.showErrToast('加载场地列表失败');
    }
    
		this.setData({
			isLoad: true,
			list2
		});

	},

	url: function (e) {
		pageHelper.url(e, this);
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	}
})