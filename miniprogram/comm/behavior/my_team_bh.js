const cloudHelper = require('../../helper/cloud_helper.js');
const pageHelper = require('../../helper/page_helper.js');
module.exports = Behavior({
  // behaviors: [commBehavior],

  data: {
    dataList: {
      list: []
    }
  },


	methods: {
		/**
		 * 生命周期函数--监听页面加载
		 */
		onLoad: async function (options) {
		},

		myCommListListener: function (e) {
			pageHelper.commListListener(this, e);
		},

		/**
		 * 生命周期函数--监听页面初次渲染完成
		 */
		onReady: function () {

		},

		/**
		 * 生命周期函数--监听页面显示
		 */
		onShow: function () {

		},

		/**
		 * 生命周期函数--监听页面隐藏
		 */
		onHide: function () {

		},

		/**
		 * 生命周期函数--监听页面卸载
		 */
		onUnload: function () {

		},


		/**
		 * 页面上拉触底事件的处理函数
		 */
		onReachBottom: function () {

		},

		url: function (e) {
			pageHelper.url(e, this);
		},
    TheAgree: async function (e) {
      let TEAM_ID = e.currentTarget.dataset.oid;
			if (!TEAM_ID) return;
			let that = this;
			let callback = async function () {
				await cloudHelper.callCloudSumbit('team/agree', {
					TEAM_ID
				}).then(res => {
					// pageHelper.delListNode(oid, that.data.dataList.list, 'FAV_OID');
					// that.data.dataList.total--;
					// that.setData({
					// 	dataList: that.data.dataList
					// });
					pageHelper.showSuccToast('通过成功');
				}).catch(err => {
					console.log(err);
				 });
			}
			pageHelper.showConfirm('您确认通过？', callback);
    },
    //这里实现拒绝
    TheRefuse: async function (e) {


		}
	}

  // methods: {
  //   /**
  //    * 加载组队列表数据
  //    */
  //   myCommListListener: async function (e) {
  //     const params = e.detail.params;
  //     try {
  //       const res = await cloudHelper.callCloudData('team/my_list', params, {
  //         loading: false
  //       });
  //       this.setData({
  //         dataList: res.data
  //       });
  //     } catch (err) {
  //       console.error('加载组队列表失败', err);
  //     }
  //   }
  // }
});