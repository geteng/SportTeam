const behavior = require('../../../../../comm/behavior/my_team_bh.js');
const ProjectBiz = require('../../../biz/project_biz.js');

Page({

	behaviors: [behavior],

	onReady: function () { 
		ProjectBiz.initPage(this);
	},
})


// const behavior = require('../../../../../comm/behavior/my_team_bh.js'); // 需创建对应的behavior
// const ProjectBiz = require('../../../biz/project_biz.js');
// const cloudHelper = require('../../../../../helper/cloud_helper.js');
// const pageHelper = require('../../../../../helper/page_helper.js');

// Page({
//   behaviors: [behavior],

//   onReady: function () {
//     ProjectBiz.initPage(this);
//   },

//   /**
//    * 同意组队
//    */
//   bindAgreeTap: async function (e) {
//     const id = pageHelper.dataset(e, 'id');
//     if (!id) return;

//     const callback = async () => {
//       try {
//         await cloudHelper.callCloudSumbit('team/agree', { id }, { title: '处理中' });
//         pageHelper.showSuccToast('已同意', 1500);
//         // 刷新列表
//         this.selectComponent('#cmpt-comm-list').refresh();
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     pageHelper.showConfirm('确定同意该组队请求？', callback);
//   },

//   /**
//    * 拒绝组队
//    */
//   bindRefuseTap: async function (e) {
//     const id = pageHelper.dataset(e, 'id');
//     if (!id) return;

//     const callback = async () => {
//       try {
//         await cloudHelper.callCloudSumbit('team/refuse', { id }, { title: '处理中' });
//         pageHelper.showSuccToast('已拒绝', 1500);
//         // 刷新列表
//         this.selectComponent('#cmpt-comm-list').refresh();
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     pageHelper.showConfirm('确定拒绝该组队请求？', callback);
//   },

//   /**
//    * 删除组队
//    */
//   bindDeleteTap: async function (e) {
//     const id = pageHelper.dataset(e, 'id');
//     if (!id) return;

//     const callback = async () => {
//       try {
//         await cloudHelper.callCloudSumbit('team/delete', { id }, { title: '删除中' });
//         pageHelper.showSuccToast('已删除', 1500);
//         // 刷新列表
//         this.selectComponent('#cmpt-comm-list').refresh();
//       } catch (err) {
//         console.error(err);
//       }
//     };

//     pageHelper.showConfirm('确定删除该组队记录？', callback);
//   },
// })