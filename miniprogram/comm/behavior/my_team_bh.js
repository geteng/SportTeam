const cloudHelper = require('../../helper/cloud_helper.js');

module.exports = Behavior({
  // behaviors: [commBehavior],

  data: {
    dataList: {
      list: []
    }
  },

  methods: {
    /**
     * 加载组队列表数据
     */
    myCommListListener: async function (e) {
      const params = e.detail.params;
      try {
        const res = await cloudHelper.callCloudData('team/my_list', params, {
          loading: false
        });
        this.setData({
          dataList: res.data
        });
      } catch (err) {
        console.error('加载组队列表失败', err);
      }
    }
  }
});