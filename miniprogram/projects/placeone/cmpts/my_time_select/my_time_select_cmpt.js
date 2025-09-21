const dataHelper = require('../../../../helper/data_helper.js');
const pageHelper = require('../../../../helper/page_helper.js');
const timeHelper = require('../../../../helper/time_helper.js');
const cloudHelper = require('../../../../helper/cloud_helper.js');
Component({
	options: {
		addGlobalClass: true
	},

	/**
	 * 组件的属性列表
	 */
	properties: {
		day: {
			type: String,
			value: '', // 当前日期
		},
		columnsSource: {
			type: Object,
			value: {},
			/* 
			{
				list:[{ label: '场所1', enrollId: 'xx',times:[1,2,3,4] }, { label: '场所2', enrollId: 'yy',times:[]  }, { label: '场所3', enrollId: 'zzz',times:['时间点']  }],
				startTime:最早时间,
				endTime:最晚时间
			}
			*/
		},
		times: {
			type: Array,
			value: [], // {idx, title, start, end, used, error,price}
		},
		used: { // 已选择
			type: Array,
			value: [], // {title,start,end,url=支持true或者跳转地址}
		},
		enrollId: { // 当前 
			type: String,
			value: '',
		},
		height: { //整体高度
			type: Number,
			value: 800
		},
		startTime: { //开始时间点  
			type: Number,
			value: -1,//1
		},
		endTime: { //结束时间点  
			type: Number,
			value: -1,//23
		},
		timeMode: { // 时间模式 24/48
			type: String,
			value: '24',
		},
		showDetail: { //显示预订详情 no=不显示 line=单行 detail=详细
			type: String,
			value: 'no'
		},
		isAdmin: { //是否预订
			type: Boolean,
			value: false,
		},
		nowUserId: { // 当前用户ID
			type: String,
			value: ''
		},
		isPrice: { //是否显示价格
			type: Boolean,
			value: false,
		},

	},

	/**
	 * 组件的初始数据
	 */
	data: {
		selectedStart: '',
		selectedEnd: '',
		selectedEndPoint: '',
		columns: [], // 按场所的数据列
		price: 0,

		detailModalShow: false, //详情窗口
    apptData: null,   //预订
    teamForm: {
      name: '',
      phone: ''
    },
    currentJoinId: '', // 当前预订ID
    
    teamModalShow: false, // 申请组队窗口显示状态
    teamName: '', // 申请组队姓名
    teamMobile: '', // 申请组队手机号
    teamMobileError: '' // 申请组队手机号错误提示
	},

	/**
	 * 生命周期方法
	 */
	lifetimes: {
		attached: function () { },

		ready: function () {
			this.init();
		},

		detached: function () {
			// 在组件实例被从页面节点树移除时执行
		},

	},

	/**
	 * 组件的方法列表
	 */
	methods: {
    // 点击已预订方格触发
    onBookedClick: function(timeNode) {
      //这里打印timeNode内容
      // let timeNode = this.data.columns[columnIdx].times[idx];
      console.log('timeNode内容:', timeNode); // 添加这行打印内容
      console.log('timeNode内容2:', timeNode.used); // 添加这行打印内容

      // 保存当前预订ID并显示申请组队窗口
      this.setData({ 
        currentJoinId: timeNode.used ? timeNode.used : '',
        teamModalShow: true,
        teamName: '',
        teamMobile: '',
        teamMobileError: ''
      });
    },
    
		init: function () {
			let startTime = Number(this.data.startTime);
			let endTime = Number(this.data.endTime);

			let now = timeHelper.time('Y-M-D h:m');

			let day = this.data.day;
			if (!day) day = timeHelper.time('Y-M-D'); 

			// 整体高度 暂时未用
			let height = (endTime - startTime + 1) * 68 + 78;
			this.setData({
				day,
				height
			});


			// 初始化 
			let columns = this.data.columnsSource.list;
			if (startTime = -1) startTime = this.data.columnsSource.startTime;
			if (endTime = -1) endTime = this.data.columnsSource.endTime;

			for (let j = 0; j < columns.length; j++) {
				let times = [];
				for (let k = startTime; k <= endTime; k++) {
					let start = '';
					let end = '';
					let title = '';

					if (k % 2 == 0) {
						start = dataHelper.padLeft(Math.floor(k / 2), 2, '0') + ':00';
						end = dataHelper.padLeft(Math.floor(k / 2), 2, '0') + ':29';

						title = dataHelper.padLeft(Math.floor(k / 2), 1, '0') + ':00';
					}
					else {
						start = dataHelper.padLeft(Math.floor(k / 2), 2, '0') + ':30';
						end = dataHelper.padLeft(Math.floor(k / 2), 2, '0') + ':59';

						title = dataHelper.padLeft(Math.floor(k / 2), 1, '0') + ':30';
					}

					if (end == '24:00') end = '23:59';


					let price = 999;
					let error = '';
					let timePrice = dataHelper.getValFromArr(columns[j].timePrice, 't', k);
					if (timePrice) {
						// 能找到定价
						price = timePrice.price;
					}
					else {
						// 不能找到定价
						error = '未开放';
					}

					if (!error) error = (day + ' ' + start < now) ? '已过期' : '';


					let node = {
						enrollId: columns[j].enrollId,
						idx: k,
						title,
						start,
						end,
						price,
						used: false,
						selected: false,
						error, //不能预订 
					}
					times.push(node);

				}

				// 已约时间段 
				for (let k = 0; k < this.data.used.length; k++) {
					let usedNode = this.data.used[k];


					// 计算有占有几个时间段
					let usedlen = 0;
					for (let j = 0; j < times.length; j++) {
						let node = times[j];
						if (node.enrollId == usedNode.enrollId && node.start >= usedNode.start && node.start <= usedNode.end) {
							usedlen++;
						}
					}
					if (usedlen <= 1) usedlen = 2;
					usedlen = Math.round(usedlen / 2);

					let curLen = 0;
					for (let j = 0; j < times.length; j++) {
						let node = times[j];
						if (node.enrollId == usedNode.enrollId && node.start == usedNode.start) {
							node.used = usedNode.url;
							node.usedFirst = true;
							node.forms = usedNode.forms;
							node.isCheckin = usedNode.isCheckin;

							curLen++;
							if (this.data.showDetail == 'detail' && curLen == usedlen)
								node.usedText = usedNode.title;
							else if (this.data.showDetail == 'line')
								node.usedText = usedNode.title;
							else if (this.data.showDetail == 'no') {
								node.usedText = this.data.nowUserId == usedNode.userId ? '我已约' : '已预订';
							}


						} else if (node.enrollId == usedNode.enrollId && node.start >= usedNode.start && node.start <= usedNode.end) {
							node.used = usedNode.url;
							node.usedFirst = false;
							node.forms = usedNode.forms;
							node.isCheckin = usedNode.isCheckin;

							curLen++;

							if (this.data.showDetail == 'detail' && curLen == usedlen)
								node.usedText = usedNode.title;
							else if (this.data.showDetail == 'line')
								node.usedText = usedNode.title;
							else if (this.data.showDetail == 'no')
								node.usedText = this.data.nowUserId == usedNode.userId ? '我已约' : '已预订';
						}
					}
				}

				columns[j].times = times;
			} 
 
			this.setData({
				columns
			});
		},

		bindSelectTap: function (e) {

			let columns = this.data.columns;

			//  选择
			let idx = pageHelper.dataset(e, 'idx');
			let columnIdx = pageHelper.dataset(e, 'columnidx');

			let timeNode = this.data.columns[columnIdx].times[idx];


			let selected = timeNode.start;


			// 已选择 
      let used = timeNode.used;
      

      console.log('timeNode:', timeNode);


			if (used) {
				if (this.data.showDetail == 'no') {
          // 点击已预订方格，弹出申请组队窗口
          // 新增判断：当usedText存在且内容为"我已约"时触发组队申请
          if (timeNode.usedText && timeNode.usedText.trim() === '我已约') {
          }else if(timeNode.error && timeNode.error.trim() === '已过期'){
            
          }
          else{
            this.onBookedClick(timeNode);
          }
					return;
				} else {
					this.setData({
						detailModalShow: true,
						apptData: timeNode
					});
					return;
				}
			}

			// 不能下单
			let error = timeNode.error;
			if (error) return;

			let enrollId = timeNode.enrollId;

			if (enrollId != this.data.enrollId) {
				// 切换了场所，所有选中都清除
				for (let j = 0; j < columns.length; j++) {
					for (let k = 0; k < columns[j].times.length; k++) {
						columns[j].times[k].selected = false;
					}
				}
				this.setData({
					price: 0,
					columns,
					selectedStart: '',
					selectedEnd: ''
				});
			}

			this.setData({
				enrollId
			});


			let selectedStart = this.data.selectedStart;
			let selectedEnd = this.data.selectedEnd;


			let times = columns[columnIdx].times;

			// 区间内直接干掉
			if (selected >= selectedStart && selected <= selectedEnd) {
				selectedStart = '';
				selectedEnd = '';
				for (let k = 0; k < times.length; k++) {
					times[k].selected = false;
				}
				this.setData({
					columns,
					selectedStart,
					selectedEnd
				});
				return;
			}


			if (!selectedStart && !selectedEnd) {
				selectedStart = selected;
				selectedEnd = selected;
			}

			if (selected < selectedStart) selectedStart = selected;
			if (selected > selectedEnd) selectedEnd = selected;


			// 如果包含了已选的，则只保留最后或者最后选择那一个时段
			for (let k = 0; k < times.length; k++) {
				if (times[k].start >= selectedStart
					&& times[k].start <= selectedEnd
					&& (times[k].used || times[k].error)
				) {

					if (selected >= selectedEnd) {
						selectedStart = selectedEnd;
					}
					else if (selected <= selectedStart) {
						selectedEnd = selectedStart;
					}

					break;
				}
			}



			// 时间段选中 
			let price = 0;
			for (let k = 0; k < times.length; k++) {
				if (times[k].start >= selectedStart && times[k].start <= selectedEnd) {
					times[k].selected = true;
					price += Number(times[k].price)
				}
				else {
					times[k].selected = false;
				}
			}

			// 取得结束时间点
			let selectedEndPoint = '';
			for (let k = 0; k < times.length; k++) {
				if (times[k].start == selectedEnd) {
					selectedEndPoint = times[k].end;
				}
			}

			this.setData({
				price,
				columns,
				selectedStart,
				selectedEnd,
				selectedEndPoint
			});

		},

		bindSumbitTap: function (e) {
			let that = this;

			let start = that.data.selectedStart;
			let end = that.data.selectedEnd;
			let endPoint = that.data.selectedEndPoint;
			let enrollId = that.data.enrollId;
			if (!start || !end || !endPoint) return;

			that.triggerEvent('select', {
				start,
				end,
				endPoint,
				enrollId,
				price: that.data.price
			});



		},

		bindCancelCmpt: function (e) { //取消
			this.setData({
				detailModalShow: false,
			});
			this.triggerEvent('cancel', this.data.apptData.forms);
		},

		bindCheckinTap: function (e) { //取消
			let val = pageHelper.dataset(e, 'val');
			let txt = (val == 1) ? '取消核销' : '核销';
			val = (val == 1) ? 0 : 1;

			let joinId = this.data.apptData.forms.joinId;
			let cb = () => {
				this.setData({
					detailModalShow: false,
				});
				this.triggerEvent('checkin', { val, joinId });
			}
			pageHelper.showConfirm('确认' + txt + '?', cb);
		},

		// 提交组队申请
		submitTeamApply: async function() {
			const { teamName, teamMobile ,day,used} = this.data;
      // const { teamName, teamMobile, currentJoinId, day, selectedStart, selectedEnd, nowUserId } = this.data;
 


			// 验证姓名
			if (!teamName.trim()) {
				wx.showToast({ title: '请输入姓名', icon: 'none' });
				return;
			}
			
			// 验证手机号
			if (!teamMobile) {
				this.setData({ teamMobileError: '请输入手机号码' });
				return;
			}
			
			if (!/^1[3-9]\d{9}$/.test(teamMobile)) {
				this.setData({ teamMobileError: '请输入正确的手机号码' });
				return;
			}
			
			// 触发组队申请事件，传递数据给父组件
			// this.triggerEvent('teamApply', {
			// 	joinId: this.data.currentJoinId,
			// 	name: teamName,
			// 	mobile: teamMobile
      // });
      
      console.log('currentJoinId:', this.data.currentJoinId);
      console.log('teamName:', teamName);
      console.log('teamMobile:', teamMobile);
      console.log('当前用户ID:', this.data.nowUserId)
      console.log('时间:', day)
      console.log('原来场地人信息:', used)
      console.log('开始时间:', used[0].start)
      console.log('结束时间:', used[0].end)
      console.log('开场人:', used[0].title)
      console.log('开场人openid:', used[0].userId)

           // used: Array(1)
      // 0:
      // end: "12:00"
      // enrollId: "f1bb8fce68cc01c5000d6ec776c94c88"
      // forms: {}
      // isCheckin: 0
      // start: "12:00"
      // title: "IE8"
      // url: "../my_join_detail/enroll_my_join_detail?id=991c758568cd3284001fc491066759d2"
      // userId: "placeone^^^o-6hc1


      try {
        // 构造调用team/insert所需的参数（对应team_controller.js的insert方法参数要求）
        const data = {
          // 队伍拥有者信息（从已预订记录中获取，这里假设currentJoinId关联的预订信息中包含）
          team_owner_ID: used[0].userId, // 需根据实际业务从预订记录中获取拥有者ID
          team_owner_name: used[0].title, // 需根据实际业务从预订记录中获取拥有者姓名
          team_owner_Mobile: '00000', // 可选，拥有者手机号
          
          // 申请者信息（当前操作用户）
          applicantName: teamName,
          applicantMobile: teamMobile,
          
          // 组队时间地点（从组件数据中获取）
          date: day, // 日期
          hour: `${used[0].start}-${used[0].end}`, // 时间段
          place: "1"//columns.find(col => col.enrollId)?.label || '' // 场地名称
        };
    
        // 调用云函数team/insert
        const opts = { title: '申请提交中' };
        const res = await cloudHelper.callCloudSumbit('team/insert', data, opts);
        
        // 处理成功回调
        wx.showToast({ title: '组队申请提交成功', icon: 'success' });
        this.setData({ 
          teamModalShow: false,
          teamName: '',
          teamMobile: ''
        });
        
        // 触发父组件事件（可选）
        this.triggerEvent('teamApplySuccess', res);
      } catch (err) {
        console.error('组队申请提交失败：', err);
        wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      }

		},

		// 处理申请组队窗口的点击事件
		bindTeamCmpt: function(e) {
			if (e.detail.index === 0) {
				// 取消按钮
				this.setData({ teamModalShow: false });
			} else {
				// 确认按钮
        this.submitTeamApply();
			}
		},

    // 处理手机号输入
    bindTeamMobileInput: function(e) {
      this.setData({
        teamMobile: e.detail.value,
        teamMobileError: '' // 清空错误提示
      });
    },

    // 处理姓名输入
    bindTeamNameInput: function(e) {
      this.setData({
        teamName: e.detail.value
      });
    },
	}
})