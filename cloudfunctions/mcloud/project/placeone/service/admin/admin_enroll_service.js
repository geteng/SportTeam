/**
 * Notes: 登记后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2022-06-23 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const EnrollService = require('../enroll_service.js');
const util = require('../../../../framework/utils/util.js');
const EnrollModel = require('../../model/enroll_model.js');
const EnrollJoinModel = require('../../model/enroll_join_model.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');

const DayModel = require('../../model/day_model.js');
const TempModel = require('../../model/temp_model.js');
const UserModel = require('../../model/user_model.js');

// 导出登记数据KEY
const EXPORT_ENROLL_JOIN_DATA_KEY = 'EXPORT_ENROLL_JOIN_DATA';

class AdminEnrollService extends BaseProjectAdminService {

	async getEnrollJoinDetail(enrollJoinId) {

		let where = {};
		if (enrollJoinId.length == 15)
			where.ENROLL_JOIN_CODE = enrollJoinId;
		else
			where = id;

		let fields = '*';

		let enrollJoin = await EnrollJoinModel.getOne(where, fields);

		return enrollJoin;
	}


  // 管理员代预订 
  async enrollJoinByAdmin({
    mobile,
    enrollId,
    price,
    start,
    end,
    endPoint,
    day
  }) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');

    // 1. 参数验证
    if (!mobile || !util.isMobile(mobile)) {
      this.AppError('请输入正确的手机号');
    }
    if (!enrollId || !price || !start || !end || !endPoint || !day) {
      this.AppError('请完善预订信息');
    }

    // 2. 获取用户信息（通过手机号查找）
    let user = await UserModel.getOne({ USER_MOBILE: mobile }, 'USER_MINI_OPENID, USER_NAME');
    if (!user) {
      this.AppError('该手机号未注册，请先让用户注册');
    }
    const userId = user.USER_MINI_OPENID;

    // 3. 验证场地是否存在且可用
    const enroll = await EnrollModel.getOne({
      _id: enrollId,
      ENROLL_STATUS: EnrollModel.STATUS.COMM
    }, 'ENROLL_TITLE, ENROLL_CATE_ID, ENROLL_CATE_NAME');
    if (!enroll) {
      this.AppError('该场地不存在或已下架');
    }

    // 4. 验证时间有效性
    const nowDate = timeUtil.time('Y-M-D');
    if (day < nowDate) {
      this.AppError('不能预订过去的日期');
    }

    const startFull = `${day} ${start}`;
    const endFull = `${day} ${endPoint}`;
    if (startFull >= endFull) {
      this.AppError('开始时间不能晚于结束时间');
    }

    // 5. 检查时间冲突（同一时段是否已有成功预订）
    const conflictWhere = {
      ENROLL_JOIN_ENROLL_ID: enrollId,
      ENROLL_JOIN_DAY: day,
      ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC,
      // 简化的时间冲突条件：两个时间段有交集
      ENROLL_JOIN_START: ['<', end],    // 旧开始 < 新结束
      ENROLL_JOIN_END: ['>', start]     // 旧结束 > 新开始
    };
    const conflictCount = await EnrollJoinModel.count(conflictWhere);
    if (conflictCount > 0) {
      this.AppError('该时间段已被预订，请选择其他时间');
    }

    // 6. 生成核验码
    const checkCode = util.genRandomNum(15); // 15位数字核验码

    // 7. 创建预订记录（管理员代订默认无需支付）
    const enrollJoinData = {
      _pid: this.getProjectId(),
      ENROLL_JOIN_ENROLL_ID: enrollId,
      ENROLL_JOIN_ENROLL_TITLE: enroll.ENROLL_TITLE,
      ENROLL_JOIN_CATE_ID: enroll.ENROLL_CATE_ID,
      ENROLL_JOIN_CATE_NAME: enroll.ENROLL_CATE_NAME,
      ENROLL_JOIN_USER_ID: userId,
      ENROLL_JOIN_DAY: day,
      ENROLL_JOIN_START: start,
      ENROLL_JOIN_END: end,
      ENROLL_JOIN_END_POINT: endPoint,
      ENROLL_JOIN_START_FULL: startFull,
      ENROLL_JOIN_END_FULL: endFull,
      ENROLL_JOIN_CODE: checkCode,
      ENROLL_JOIN_IS_ADMIN: 1, // 标记为管理员添加
      ENROLL_JOIN_STATUS: EnrollJoinModel.STATUS.SUCC, // 直接设为成功
      ENROLL_JOIN_FEE: price * 100, // 费用（分）
      ENROLL_JOIN_PAY_STATUS: 99, // 99=无需支付
      ENROLL_JOIN_ADD_TIME: this._timestamp,
      ENROLL_JOIN_EDIT_TIME: this._timestamp,
      ENROLL_JOIN_ADD_IP: this._ip,
      ENROLL_JOIN_EDIT_IP: this._ip,
      ENROLL_JOIN_OBJ: { name: user.USER_NAME || '管理员代订用户' }, // 存储用户名称
      ENROLL_JOIN_FORMS: [] // 管理员代订无需表单
    };

    const enrollJoinId = await EnrollJoinModel.insert(enrollJoinData);

    // 8. 记录操作日志
    this.insertLog(
      `为用户「${mobile}」代订场地「${enroll.ENROLL_TITLE}」（${day} ${start}-${endPoint}）`,
      null,
      LogModel.TYPE.OPER
    );

    // 9. 返回预订结果
    return {
      enrollJoinId,
      checkCode,
      enrollTitle: enroll.ENROLL_TITLE,
      day,
      start,
      endPoint
    };
  }

	/** 管理员按钮核销 */
	async checkinEnrollJoin(enrollJoinId, val) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证核销记录ID有效性
      if (!enrollJoinId) {
        this.AppError('请传入有效的预约记录ID');
    }

    // 2. 查询对应的预约记录
    const where = { _id: enrollJoinId };
    const enrollJoin = await EnrollJoinModel.getOne(where, 'ENROLL_JOIN_STATUS, ENROLL_JOIN_IS_CHECKIN, ENROLL_JOIN_ENROLL_TITLE, ENROLL_JOIN_DAY, ENROLL_JOIN_START, ENROLL_JOIN_END_POINT, ENROLL_JOIN_OBJ');
    if (!enrollJoin) {
        this.AppError('该预约记录不存在或已被删除');
    }

    // 3. 验证预约状态是否允许核销（仅成功状态可核销）
    if (enrollJoin.ENROLL_JOIN_STATUS !== EnrollJoinModel.STATUS.SUCC) {
        this.AppError(`该预约状态为【${EnrollJoinModel.STATUS_DESC[enrollJoin.ENROLL_JOIN_STATUS]}】，无法进行核销`);
    }

    // 4. 验证是否已核销
    if (enrollJoin.ENROLL_JOIN_IS_CHECKIN === 1) {
        this.AppError('该预约记录已完成核销，无需重复操作');
    }

    // 5. 执行核销操作（更新状态和时间）
    const updateData = {
        ENROLL_JOIN_IS_CHECKIN: 1, // 标记为已核销
        ENROLL_JOIN_CHECKIN_TIME: this._timestamp, // 记录核销时间戳
        ENROLL_JOIN_EDIT_TIME: this._timestamp,
        ENROLL_JOIN_EDIT_IP: this._ip // 记录操作IP
    };
    await EnrollJoinModel.edit(where, updateData);

    // 6. 记录核销操作日志
    const userName = enrollJoin.ENROLL_JOIN_OBJ?.name || '未知用户';
    this.insertLog(
        `核销了用户【${userName}】的预约：${enrollJoin.ENROLL_JOIN_ENROLL_TITLE}（${enrollJoin.ENROLL_JOIN_DAY} ${enrollJoin.ENROLL_JOIN_START}-${enrollJoin.ENROLL_JOIN_END_POINT}）`,
        null,
        LogModel.TYPE.OPER
    );

    // 7. 返回核销结果
    return {
        success: true,
        checkinTime: timeUtil.timestamp2Time(this._timestamp),
        enrollJoinId
    };
	}

	/** 管理员扫码核销 */
  /** 管理员扫码核销 */
  async scanEnrollJoin(code) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证核销码有效性
    if (!code || code.length !== 15) {
        this.AppError('无效的核销码，请检查扫码结果');
    }

    // 2. 根据核销码查询预约记录
    const where = { ENROLL_JOIN_CODE: code };
    const enrollJoin = await EnrollJoinModel.getOne(where, 'ENROLL_JOIN_STATUS, ENROLL_JOIN_IS_CHECKIN, ENROLL_JOIN_ENROLL_TITLE, ENROLL_JOIN_DAY, ENROLL_JOIN_START, ENROLL_JOIN_END_POINT, ENROLL_JOIN_OBJ, _id');
    if (!enrollJoin) {
        this.AppError('未找到对应的预约记录，请确认核销码正确');
    }

    // 3. 验证预约状态是否允许核销（仅成功状态可核销）
    if (enrollJoin.ENROLL_JOIN_STATUS !== EnrollJoinModel.STATUS.SUCC) {
        this.AppError(`该预约状态为【${EnrollJoinModel.STATUS_DESC[enrollJoin.ENROLL_JOIN_STATUS]}】，无法进行核销`);
    }

    // 4. 验证是否已核销
    if (enrollJoin.ENROLL_JOIN_IS_CHECKIN === 1) {
        this.AppError('该预约记录已完成核销，无需重复操作');
    }

    // 5. 执行核销操作（更新状态和时间）
    const updateData = {
        ENROLL_JOIN_IS_CHECKIN: 1, // 标记为已核销
        ENROLL_JOIN_CHECKIN_TIME: this._timestamp, // 记录核销时间戳
        ENROLL_JOIN_EDIT_TIME: this._timestamp,
        ENROLL_JOIN_EDIT_IP: this._ip // 记录操作IP
    };
    await EnrollJoinModel.edit(where, updateData);

    // 6. 记录核销操作日志
    const userName = enrollJoin.ENROLL_JOIN_OBJ?.name || '未知用户';
    this.insertLog(
        `扫码核销了用户【${userName}】的预约：${enrollJoin.ENROLL_JOIN_ENROLL_TITLE}（${enrollJoin.ENROLL_JOIN_DAY} ${enrollJoin.ENROLL_JOIN_START}-${enrollJoin.ENROLL_JOIN_END_POINT}）`,
        null,
        LogModel.TYPE.OPER
    );

    // 7. 返回核销结果
    return {
        success: true,
        checkinTime: timeUtil.timestamp2Time(this._timestamp),
        enrollJoinId: enrollJoin._id,
        code: enrollJoin.ENROLL_JOIN_CODE,
        enrollTitle: enrollJoin.ENROLL_JOIN_ENROLL_TITLE
    };
  }


	/**取得分页列表 */
	async getAdminEnrollList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ENROLL_ORDER': 'asc',
			'ENROLL_ADD_TIME': 'desc'
		};
		let fields = 'ENROLL_DAYS,ENROLL_TITLE,ENROLL_CATE_ID,ENROLL_CATE_NAME,ENROLL_EDIT_TIME,ENROLL_ADD_TIME,ENROLL_ORDER,ENROLL_STATUS,ENROLL_VOUCH,ENROLL_EDIT_SET,ENROLL_CANCEL_SET,ENROLL_QR,ENROLL_OBJ';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [{
				ENROLL_TITLE: ['like', search]
			},];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.and.ENROLL_CATE_ID = String(sortVal);
					break;
				}
				case 'status': {
					where.and.ENROLL_STATUS = Number(sortVal);
					break;
				}
				case 'vouch': {
					where.and.ENROLL_VOUCH = 1;
					break;
				}
				case 'top': {
					where.and.ENROLL_ORDER = 0;
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'ENROLL_ADD_TIME');
					break;
				}
			}
		}

		return await EnrollModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/**置顶与排序设定 */
  /**置顶与排序设定 */
  async sortEnroll(id, sort) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 参数验证
    if (!id) {
        this.AppError('请传入有效的场地ID');
    }
    // if (!util.isInt(sort) || sort < 0) {
    //     this.AppError('排序值必须为非负整数');
    // }

    // 2. 验证场地是否存在且属于当前项目
    const enroll = await EnrollModel.getOne({
        _id: id,
        _pid: this.getProjectId()
    }, 'ENROLL_TITLE, ENROLL_VOUCH');
    if (!enroll) {
        this.AppError('该场地不存在或已被删除');
    }

    // 3. 准备更新数据
    const updateData = {
        ENROLL_ORDER: sort,
        ENROLL_EDIT_TIME: timeUtil.time(),
        ENROLL_EDIT_IP: this._ip
    };

    // 4. 执行更新操作（限定当前项目）
    await EnrollModel.edit({
        _id: id,
        _pid: this.getProjectId()
    }, updateData);

    // 5. 如果是置顶排序（sort=0）且为首页推荐，同步更新首页推荐排序
    if (sort === 0 && enroll.ENROLL_VOUCH === 1) {
        const homeService = new (require('./admin_home_service.js'))(); // 引入首页服务
        await homeService.updateHomeVouchSort({
            id: id,
            type: 'enroll',
            sort: 0 // 置顶排序同步到首页
        });
    }

    // 6. 记录操作日志
    // this.insertLog(
    //     `将场地《${enroll.ENROLL_TITLE}》排序设置为${sort}`,
    //     await this.getAdminInfo(),
    //     LogModel.TYPE.OPER
    // );

    return {
        success: true,
        id,
        sort
    };
  }



  /**添加 */
  async insertEnroll({
    title,
    cateId,
    cateName,
    cancelSet,
    editSet,
    order,
    forms,
    joinForms,
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 参数验证
    if (!title || title.length < 2 || title.length > 50) {
      this.AppError('标题长度必须在2-50字符之间');
    }
    if (!cateId || !cateName) {
      this.AppError('请选择所属分类');
    }
    // 验证取消设置合法性（0=不允许,1=允许,2=开始前可取消,3=结束前可取消）
    if (![0, 1, 2, 3].includes(cancelSet)) {
      this.AppError('取消设置值无效');
    }
    // 验证修改设置合法性（0=不允许,1=允许,2=开始前可修改,3=结束前可修改）
    if (![0, 1, 2, 3].includes(editSet)) {
      this.AppError('修改设置值无效');
    }
    // if (order === undefined || !util.isInt(order) || order < 0) {
    //   this.AppError('排序值必须为非负整数');
    // }

    // 2. 检查标题唯一性（同一项目下标题不重复）
    const titleCount = await EnrollModel.count({
      ENROLL_TITLE: title,
      _pid: this.getProjectId()
    });
    if (titleCount > 0) {
      this.AppError(`已存在相同标题「${title}」的场地，请修改标题`);
    }

    // 3. 处理表单数据（转换为对象格式便于查询）
    const enrollObj = dataUtil.dbForms2Obj(forms || []);

    // 4. 准备插入数据
    const now = timeUtil.time();
    const data = {
      _pid: this.getProjectId(), // 项目ID
      ENROLL_TITLE: title,
      ENROLL_CATE_ID: cateId,
      ENROLL_CATE_NAME: cateName,
      ENROLL_CANCEL_SET: cancelSet,
      ENROLL_EDIT_SET: editSet,
      ENROLL_ORDER: order || 9999, // 默认排序值
      ENROLL_FORMS: forms || [],
      ENROLL_JOIN_FORMS: joinForms || [],
      ENROLL_OBJ: enrollObj,
      ENROLL_STATUS: EnrollModel.STATUS.COMM, // 默认启用状态
      ENROLL_VOUCH: 0, // 默认不推荐到首页
      ENROLL_DAYS: [], // 初始化为空可用日期
      ENROLL_DAY_CNT: 0, // 初始日期数量为0
      ENROLL_VIEW_CNT: 0, // 初始浏览量
      ENROLL_JOIN_CNT: 0, // 初始报名数
      ENROLL_ADD_TIME: now,
      ENROLL_EDIT_TIME: now,
      ENROLL_ADD_IP: this._ip,
      ENROLL_EDIT_IP: this._ip
    };

    // 5. 执行插入操作
    const result = await EnrollModel.insert(data);

    // 6. 如果是置顶排序（order=0），同步更新首页推荐
    if (order === 0) {
      const homeService = new (require('./admin_home_service.js'))(); // 引入首页服务
      await homeService.updateHomeVouch({
        id: result._id,
        type: 'enroll',
        title: title,
        pic: '', // 场地初始无图片，留空
        ext: cateId
      });
    }

    // 7. 记录操作日志
    // this.insertLog(
    //   `添加了场地《${title}》（分类：${cateName}）`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );

    return result;
  }

	/**删除数据 */  
  /**删除数据 */
  async delEnroll(id) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证场地是否存在且属于当前项目
    const where = {
        _id: id,
        _pid: this.getProjectId()
    };
    const enroll = await EnrollModel.getOne(where, 'ENROLL_TITLE, ENROLL_VOUCH');
    if (!enroll) {
        this.AppError('该场地不存在或已被删除');
    }

    // 2. 如果是首页推荐场地，同步移除首页推荐
    if (enroll.ENROLL_VOUCH === 1) {
        const homeService = new (require('./admin_home_service.js'))();
        await homeService.delHomeVouch(id);
    }

    // 3. 删除关联的预约记录
    await EnrollJoinModel.del({
        ENROLL_JOIN_ENROLL_ID: id,
        _pid: this.getProjectId()
    });

    // 4. 删除关联的日期设置数据
    await DayModel.del({
        DAY_ENROLL_ID: id,
        _pid: this.getProjectId()
    });

    // 5. 执行场地删除操作（限定当前项目）
    await EnrollModel.del(where);

    // 6. 记录操作日志
    // this.insertLog(
    //     `删除了场地《${enroll.ENROLL_TITLE}》`,
    //     await this.getAdminInfo(),
    //     LogModel.TYPE.SYS
    // );
  }

	/**获取信息 */
	async getEnrollDetail(id) {
		return await EnrollModel.getOne(id, '*');
	}


	// 更新forms信息
  // 更新forms信息
  async updateEnrollForms({
    id,
    hasImageForms
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证场地是否存在且属于当前项目
    const enroll = await EnrollModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'ENROLL_TITLE, ENROLL_FORMS');
    if (!enroll) {
      this.AppError('该场地不存在或已被删除');
    }

    // 2. 处理表单中的图片资源（清理旧图、保留新图）
    await cloudUtil.handlerCloudFilesForForms(
      enroll.ENROLL_FORMS || [], // 旧表单
      hasImageForms // 新表单
    );

    // 3. 转换表单数据为对象格式便于查询
    const enrollObj = dataUtil.dbForms2Obj(hasImageForms);

    // 4. 准备更新数据
    const updateData = {
      ENROLL_FORMS: hasImageForms, // 保存原始表单结构
      ENROLL_OBJ: enrollObj, // 转换为对象用于快速查询
      ENROLL_EDIT_TIME: timeUtil.time(), // 更新修改时间
      ENROLL_EDIT_IP: this._ip // 记录操作IP
    };

    // 5. 执行更新操作（限定当前项目）
    await EnrollModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, updateData);

    // 6. 记录操作日志
    // this.insertLog(
    //   `更新了场地《${enroll.ENROLL_TITLE}》的表单信息`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.OPER
    // );
  }


	/**更新数据 */
  /**更新数据 */
  async editEnroll({
    id,
    title,
    cateId, // 二级分类 
    cateName,
    cancelSet,
    editSet,
    order,
    forms,
    joinForms
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 参数验证
    if (!title || title.length < 2 || title.length > 50) {
      this.AppError('标题长度必须在2-50字符之间');
    }
    if (!cateId || !cateName) {
      this.AppError('请选择所属分类');
    }
    // 验证取消设置合法性（0=不允许,1=允许,2=开始前可取消,3=结束前可取消）
    if (![0, 1, 2, 3].includes(cancelSet)) {
      this.AppError('取消设置值无效');
    }
    // 验证修改设置合法性（0=不允许,1=允许,2=开始前可修改,3=结束前可修改）
    if (![0, 1, 2, 3].includes(editSet)) {
      this.AppError('修改设置值无效');
    }
    // if (order === undefined || !util.isInt(order) || order < 0) {
    //   this.AppError('排序值必须为非负整数');
    // }

    // 2. 验证场地是否存在且属于当前项目
    const where = {
      _id: id,
      _pid: this.getProjectId()
    };
    const enroll = await EnrollModel.getOne(where, 'ENROLL_TITLE, ENROLL_VOUCH, ENROLL_FORMS');
    if (!enroll) {
      this.AppError('该场地不存在或已被删除');
    }

    // 3. 检查标题唯一性（同一项目下排除自身的重复标题）
    const titleCount = await EnrollModel.count({
      ENROLL_TITLE: title,
      _id: ['<>', id],
      _pid: this.getProjectId()
    });
    if (titleCount > 0) {
      this.AppError(`已存在相同标题「${title}」的场地，请修改标题`);
    }

    // 4. 处理表单图片资源（清理旧图、保留新图）
    await cloudUtil.handlerCloudFilesForForms(
      enroll.ENROLL_FORMS || [], // 旧表单
      forms || [] // 新表单
    );

    // 5. 转换表单数据为对象格式便于查询
    const enrollObj = dataUtil.dbForms2Obj(forms || []);

    // 6. 准备更新数据
    const updateData = {
      ENROLL_TITLE: title,
      ENROLL_CATE_ID: cateId,
      ENROLL_CATE_NAME: cateName,
      ENROLL_CANCEL_SET: cancelSet,
      ENROLL_EDIT_SET: editSet,
      ENROLL_ORDER: order,
      ENROLL_FORMS: forms || [],
      ENROLL_JOIN_FORMS: joinForms || [],
      ENROLL_OBJ: enrollObj,
      ENROLL_EDIT_TIME: timeUtil.time(),
      ENROLL_EDIT_IP: this._ip
    };

    // 7. 执行更新操作（限定当前项目）
    await EnrollModel.edit(where, updateData);

    // 8. 如果是置顶排序（sort=0）且为首页推荐，同步更新首页推荐排序
    if (order === 0 && enroll.ENROLL_VOUCH === 1) {
      const homeService = new (require('./admin_home_service.js'))(); // 引入首页服务
      await homeService.updateHomeVouchSort({
        id: id,
        type: 'enroll',
        sort: 0 // 置顶排序同步到首页
      });
    }

    // 9. 记录操作日志
    // this.insertLog(
    //   `修改了场地《${title}》（分类：${cateName}）`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );

    return {
      success: true,
      id
    };
  }

  /**修改状态 */
  async statusEnroll(id, status) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证场地是否存在且属于当前项目
    const where = {
        _id: id,
        _pid: this.getProjectId()
    };
    const enroll = await EnrollModel.getOne(where, 'ENROLL_TITLE');
    if (!enroll) {
        this.AppError('该场地不存在或已被删除');
    }

    // 2. 验证状态值合法性（假设0=禁用，1=启用，可根据实际枚举调整）
    const validStatus = [0, 1];
    if (!validStatus.includes(Number(status))) {
        this.AppError(`状态值无效，合法值为：${validStatus.join(',')}`);
    }

    // 3. 状态未变化则无需操作
    if (enroll.ENROLL_STATUS === Number(status)) {
        this.AppError('场地状态未发生变化');
    }

    // 4. 准备更新数据
    const updateData = {
        ENROLL_STATUS: Number(status),
        ENROLL_EDIT_TIME: timeUtil.time(),
        ENROLL_EDIT_IP: this._ip
    };

    // 5. 执行状态更新操作（限定当前项目）
    await EnrollModel.edit(where, updateData);

    // 6. 记录操作日志
    // const statusDesc = Number(status) === 1 ? '启用' : '禁用';
    // this.insertLog(
    //     `将场地《${enroll.ENROLL_TITLE}》状态修改为${statusDesc}`,
    //     await this.getAdminInfo(),
    //     LogModel.TYPE.SYS
    // );
  }

	//#############################
	/**登记分页列表 */
	async getEnrollJoinList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		page,
		size,
		isTotal = true,
		oldTotal
	}) {

		orderBy = orderBy || {
			'ENROLL_JOIN_ADD_TIME': 'desc'
		};
		let fields = '*';

		let where = {
		 
		};
		if (util.isDefined(search) && search) {
			if (search.length == 10 && search.includes('-')) {
				where['ENROLL_JOIN_DAY'] = search;
				console.log(where)
			}
			else {
				where['ENROLL_JOIN_FORMS.val'] = {
					$regex: '.*' + search,
					$options: 'i'
				};
			}

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.ENROLL_JOIN_CATE_ID = sortVal;
					break;
				}
				case 'status': {
					where.ENROLL_JOIN_STATUS = Number(sortVal);
					break;
				}
				case 'check': {
					where.ENROLL_JOIN_IS_CHECK = Number(sortVal);
					break;
				}
				case 'new': {
					orderBy = {
						'ENROLL_JOIN_ADD_TIME': 'desc'
					};
				}

			}
		}

		return await EnrollJoinModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 取消 */
  /** 取消 */
  async cancelEnrollJoin(enrollJoinId) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证预订记录是否存在且属于当前项目
    const where = {
        _id: enrollJoinId,
        _pid: this.getProjectId()
    };
    const enrollJoin = await EnrollJoinModel.getOne(where, 'ENROLL_JOIN_ENROLL_TITLE, ENROLL_JOIN_STATUS, ENROLL_JOIN_USER_ID, ENROLL_JOIN_PAY_STATUS');
    if (!enrollJoin) {
        this.AppError('该预订记录不存在或已被删除');
    }

    // 2. 检查当前状态是否可取消
    const { SUCC, CANCEL, ADMIN_CANCEL } = EnrollJoinModel.STATUS;
    if ([CANCEL, ADMIN_CANCEL].includes(enrollJoin.ENROLL_JOIN_STATUS)) {
        this.AppError('该预订记录已处于取消状态，无需重复操作');
    }
    if (enrollJoin.ENROLL_JOIN_STATUS !== SUCC) {
        this.AppError('只有成功状态的预订才能被取消');
    }

    // 3. 处理已支付订单的退款逻辑（此处仅为框架，需根据实际支付系统实现）
    if (enrollJoin.ENROLL_JOIN_PAY_STATUS === 1) {
        // 示例：调用支付服务进行退款
        // const payService = new PayService();
        // const refundResult = await payService.refund({
        //     tradeNo: enrollJoin.ENROLL_JOIN_PAY_TRADE_NO,
        //     fee: enrollJoin.ENROLL_JOIN_PAY_FEE
        // });
        // if (!refundResult.success) {
        //     this.AppError('退款失败：' + refundResult.msg);
        // }
    }

    // 4. 准备更新数据
    const updateData = {
        ENROLL_JOIN_STATUS: ADMIN_CANCEL, // 管理员取消状态
        ENROLL_JOIN_CANCEL_TIME: this._timestamp,
        ENROLL_JOIN_EDIT_TIME: this._timestamp,
        ENROLL_JOIN_EDIT_IP: this._ip,
        // 若已退款，更新支付状态
        ...(enrollJoin.ENROLL_JOIN_PAY_STATUS === 1 && { ENROLL_JOIN_PAY_STATUS: 8 }) // 8=已退款（对应模型中注释）
    };

    // 5. 执行更新操作
    await EnrollJoinModel.edit(where, updateData);

    // 6. 重新统计场地预订数量
    this.statEnrollJoin();

    // 7. 记录操作日志
    // this.insertLog(
    //     `管理员取消了预订《${enrollJoin.ENROLL_JOIN_ENROLL_TITLE}》（用户ID：${enrollJoin.ENROLL_JOIN_USER_ID}）`,
    //     await this.getAdminInfo(),
    //     LogModel.TYPE.OPER
    // );
  }

	// #####################导出登记数据
	/**获取登记数据 */
	async getEnrollJoinDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_ENROLL_JOIN_DATA_KEY );
	}

	/**删除登记数据 */
	async deleteEnrollJoinDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_ENROLL_JOIN_DATA_KEY);
	}

	/**导出登记数据 */
  /**导出登记数据 */
  async exportEnrollJoinDataExcel({
    cateId,
    start,
    end,
    status
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证日期格式
    // if (start && !timeUtil.isValidDate(start)) {
    //   this.AppError('开始日期格式无效，应为YYYY-MM-DD');
    // }
    // if (end && !timeUtil.isValidDate(end)) {
    //   this.AppError('结束日期格式无效，应为YYYY-MM-DD');
    // }
    if (start && end && start > end) {
      this.AppError('开始日期不能晚于结束日期');
    }

    // 2. 验证状态合法性
    if (status !== undefined) {
      const validStatus = Object.values(EnrollJoinModel.STATUS);
      if (!validStatus.includes(Number(status))) {
        this.AppError(`状态值无效，合法值为：${validStatus.join(',')}`);
      }
    }

    // 3. 构建查询条件
    let where = {
      and: {
        _pid: this.getProjectId() // 限定当前项目
      }
    };

    // 分类筛选
    if (cateId) {
      where.and.ENROLL_JOIN_CATE_ID = String(cateId);
    }

    // 日期范围筛选
    if (start) {
      where.and.ENROLL_JOIN_DAY = ['>=', start];
    }
    if (end) {
      where.and.ENROLL_JOIN_DAY = where.and.ENROLL_JOIN_DAY 
        ? ['between', start, end] 
        : ['<=', end];
    }

    // 状态筛选
    if (status !== undefined) {
      where.and.ENROLL_JOIN_STATUS = Number(status);
    }

    // 4. 查询符合条件的数据
    const fields = `
      _id, ENROLL_JOIN_ENROLL_TITLE, ENROLL_JOIN_CATE_NAME, 
      ENROLL_JOIN_DAY, ENROLL_JOIN_START, ENROLL_JOIN_END_POINT,
      ENROLL_JOIN_USER_ID, ENROLL_JOIN_FORMS, ENROLL_JOIN_STATUS,
      ENROLL_JOIN_IS_CHECKIN, ENROLL_JOIN_CHECKIN_TIME,
      ENROLL_JOIN_PAY_STATUS, ENROLL_JOIN_PAY_FEE, ENROLL_JOIN_ADD_TIME
    `;

    const enrollJoinList = await EnrollJoinModel.getAll(where, fields);
    if (!enrollJoinList || enrollJoinList.length === 0) {
      this.AppError('没有符合条件的预订记录可导出');
    }

    // 5. 数据格式化处理
    const exportData = [];
    // 添加表头行
    exportData.push([
      '预订ID', '场地名称', '分类', '预订日期', '开始时间', '结束时间',
      '用户ID', '报名信息', '状态', '是否核销', '核销时间',
      '支付状态', '支付金额(元)', '创建时间'
    ]);

    // 处理数据行
    for (const item of enrollJoinList) {
      // 格式化表单数据为字符串
      let formsStr = '';
      if (item.ENROLL_JOIN_FORMS && item.ENROLL_JOIN_FORMS.length) {
        formsStr = item.ENROLL_JOIN_FORMS.map(f => `${f.label}:${f.val}`).join('; ');
      }

      // 状态转换
      const statusDesc = EnrollJoinModel.STATUS_DESC[
        Object.keys(EnrollJoinModel.STATUS).find(
          key => EnrollJoinModel.STATUS[key] === item.ENROLL_JOIN_STATUS
        )
      ] || '未知';

      // 支付状态转换
      let payStatusDesc = '未支付';
      switch (item.ENROLL_JOIN_PAY_STATUS) {
        case 1: payStatusDesc = '已支付'; break;
        case 8: payStatusDesc = '已退款'; break;
        case 99: payStatusDesc = '无需支付'; break;
      }

      // 时间格式化
      const checkinTime = item.ENROLL_JOIN_CHECKIN_TIME 
        ? timeUtil.timestamp2Time(item.ENROLL_JOIN_CHECKIN_TIME) 
        : '未核销';

      exportData.push([
        item._id,
        item.ENROLL_JOIN_ENROLL_TITLE || '',
        item.ENROLL_JOIN_CATE_NAME || '',
        item.ENROLL_JOIN_DAY || '',
        item.ENROLL_JOIN_START || '',
        item.ENROLL_JOIN_END_POINT || '',
        item.ENROLL_JOIN_USER_ID || '',
        formsStr,
        statusDesc,
        item.ENROLL_JOIN_IS_CHECKIN ? '是' : '否',
        checkinTime,
        payStatusDesc,
        item.ENROLL_JOIN_PAY_FEE ? (item.ENROLL_JOIN_PAY_FEE / 100).toFixed(2) : '0.00',
        timeUtil.timestamp2Time(item.ENROLL_JOIN_ADD_TIME)
      ]);
    }

    // 6. 生成导出文件
    return await exportUtil.exportDataExcel(
      EXPORT_ENROLL_JOIN_DATA_KEY,
      `场地预订记录_${timeUtil.time('Y-M-D')}`,
      enrollJoinList.length,
      exportData
    );
  }



	/** 计算排期 */
  /** 计算排期 */
  async statDayCnt(enrollId) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证场地是否存在且属于当前项目
    const whereEnroll = {
        _id: enrollId,
        _pid: this.getProjectId()
    };
    const enroll = await EnrollModel.getOne(whereEnroll, 'ENROLL_TITLE');
    if (!enroll) {
        this.AppError('该场地不存在或已被删除');
    }

    // 2. 清理过期日期数据（小于当前日期的记录）
    const nowDay = timeUtil.time('Y-M-D');
    const whereExpired = {
        DAY_ENROLL_ID: enrollId,
        day: ['<', nowDay],
        _pid: this.getProjectId()
    };
    await DayModel.del(whereExpired);
    console.log(`清理场地[${enroll.ENROLL_TITLE}]过期日期数据（< ${nowDay}）`);

    // 3. 统计有效日期数量（大于等于当前日期）
    const whereValid = {
        DAY_ENROLL_ID: enrollId,
        day: ['>=', nowDay],
        _pid: this.getProjectId()
    };
    const validDayCount = await DayModel.count(whereValid);

    // 4. 获取有效日期列表
    const validDays = await DayModel.getAll(whereValid, 'day');
    const dayList = validDays.map(day => day.day);

    // 5. 更新场地的日期统计信息
    await EnrollModel.edit(whereEnroll, {
        ENROLL_DAY_CNT: validDayCount,
        ENROLL_DAYS: dayList,
        ENROLL_EDIT_TIME: timeUtil.time(),
        ENROLL_EDIT_IP: this._ip
    });

    // 6. 记录操作日志
    // this.insertLog(
    //     `计算了场地《${enroll.ENROLL_TITLE}》的排期，有效日期共${validDayCount}天`,
    //     await this.getAdminInfo(),
    //     LogModel.TYPE.OPER
    // );

    return {
        success: true,
        dayCnt: validDayCount,
        days: dayList
    };
  }

	/** 更新日期设置 */
  /** 更新日期设置 */
  async editDays({
    enrollId,
    days
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证场地是否存在且属于当前项目
    const whereEnroll = {
      _id: enrollId,
      _pid: this.getProjectId()
    };
    const enroll = await EnrollModel.getOne(whereEnroll, 'ENROLL_TITLE');
    if (!enroll) {
      this.AppError('该场地不存在或已被删除');
    }

    // 2. 验证日期数据有效性
    if (!Array.isArray(days) || days.length === 0) {
      this.AppError('请至少设置一个日期');
    }

    const validDays = [];
    for (const dayItem of days) {
      // 验证日期格式
      // if (!dayItem.day || !timeUtil.isValidDate(dayItem.day)) {
      //   this.AppError(`日期格式无效：${dayItem.day}，应为YYYY-MM-DD`);
      // }

      // 验证时间段数据
      if (!Array.isArray(dayItem.times) || dayItem.times.length === 0) {
        this.AppError(`日期${dayItem.day}未设置有效的时间段`);
      }

      // 验证每个时间段结构
      for (const time of dayItem.times) {
        if (!time.mark || !time.start || !time.end || time.price === undefined) {
          this.AppError(`日期${dayItem.day}的时间段结构不完整，需包含mark、start、end、price`);
        }
        if (time.start >= time.end) {
          this.AppError(`日期${dayItem.day}的时间段开始时间不能晚于结束时间`);
        }
        if (!Number.isFinite(time.price) || time.price < 0) {
          this.AppError(`日期${dayItem.day}的时间段价格必须为非负数字`);
        }
      }

      validDays.push({
        day: dayItem.day,
        dayDesc: dayItem.dayDesc || '',
        times: dayItem.times
      });
    }

    // 3. 清理该场地已有的日期设置
    const whereDay = {
      DAY_ENROLL_ID: enrollId,
      _pid: this.getProjectId()
    };
    await DayModel.del(whereDay);
    console.log(`已清理场地[${enroll.ENROLL_TITLE}]的旧日期设置`);

    // 4. 批量插入新的日期设置
    const now = timeUtil.time();
    const insertData = validDays.map(dayItem => ({
      _pid: this.getProjectId(),
      DAY_ENROLL_ID: enrollId,
      DAY_CATE_ID: enroll.ENROLL_CATE_ID, // 关联分类ID
      day: dayItem.day,
      dayDesc: dayItem.dayDesc,
      times: dayItem.times,
      DAY_ADD_TIME: now,
      DAY_EDIT_TIME: now,
      DAY_ADD_IP: this._ip,
      DAY_EDIT_IP: this._ip
    }));

    // await DayModel.insertMany(insertData);

    // 5. 重新计算排期统计
    await this.statDayCnt(enrollId);

    // 6. 记录操作日志
    // this.insertLog(
    //   `更新了场地《${enroll.ENROLL_TITLE}》的日期设置，共${validDays.length}天`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.OPER
    // );

    return {
      success: true,
      count: validDays.length
    };
  }

	async getAllDays(enrollId) {
		// 删除之前超时数据
		let nowDay = timeUtil.time('Y-M-D');
		let whereOut = {
			DAY_ENROLL_ID: enrollId,
			day: ['<', nowDay]
		}
		console.log(whereOut)
		await DayModel.del(whereOut);

		let where = {
			DAY_ENROLL_ID: enrollId,
		}
		return DayModel.getAll(where, 'day, dayDesc, times');
	}

	/****************模板 */

	/**添加模板 */
  /**添加模板 */
  async insertTemp({
    name,
    times,
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证输入数据
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      this.AppError('模板名称不能为空');
    }
    if (!Array.isArray(times) || times.length === 0) {
      this.AppError('请至少设置一个时间段');
    }

    // 2. 验证时间段结构有效性
    for (const time of times) {
      if (!time.mark || !time.start || !time.end || time.price === undefined) {
        this.AppError('时间段结构不完整，需包含mark、start、end、price字段');
      }
      if (typeof time.start !== 'number' || typeof time.end !== 'number') {
        this.AppError('时间段的start和end必须为数字');
      }
      if (time.start >= time.end) {
        this.AppError('时间段的开始时间不能晚于结束时间');
      }
      if (!Number.isFinite(time.price) || time.price < 0) {
        this.AppError('时间段价格必须为非负数字');
      }
    }

    // 3. 检查模板名称唯一性
    const nameCount = await TempModel.count({
      TEMP_NAME: name.trim(),
      _pid: this.getProjectId()
    });
    if (nameCount > 0) {
      this.AppError(`已存在同名模板「${name}」，请更换名称`);
    }

    // 4. 准备插入数据
    const now = timeUtil.time();
    const data = {
      _pid: this.getProjectId(), // 关联当前项目
      TEMP_ID: dataUtil.genId(), // 生成唯一ID
      TEMP_NAME: name.trim(),
      TEMP_TIMES: times,
      TEMP_ADD_TIME: now,
      TEMP_EDIT_TIME: now,
      TEMP_ADD_IP: this._ip,
      TEMP_EDIT_IP: this._ip
    };

    // 5. 执行插入操作
    const result = await TempModel.insert(data);

    // 6. 记录操作日志
    // this.insertLog(
    //   `添加了预订时间段模板「${name}」，包含${times.length}个时间段`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.OPER
    // );

    return result;
  }
	/**更新数据 */
  /**更新数据 */
  async editTemp({
    id,
    price,
  }) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证模板是否存在且属于当前项目
    const where = {
      _id: id,
      _pid: this.getProjectId()
    };
    const temp = await TempModel.getOne(where, 'TEMP_NAME, TEMP_TIMES');
    if (!temp) {
      this.AppError('该模板不存在或已被删除');
    }

    // 2. 验证价格有效性
    if (price === undefined || !Number.isFinite(price) || price < 0) {
      this.AppError('价格必须为非负数字');
    }

    // 3. 更新时间段中的价格（统一更新所有时间段的价格）
    const updatedTimes = temp.TEMP_TIMES.map(time => ({
      ...time,
      price: Number(price) // 确保价格为数字类型
    }));

    // 4. 准备更新数据
    const updateData = {
      TEMP_TIMES: updatedTimes,
      TEMP_EDIT_TIME: timeUtil.time(), // 更新修改时间
      TEMP_EDIT_IP: this._ip // 记录操作IP
    };

    // 5. 执行更新操作
    await TempModel.edit(where, updateData);

    // 6. 记录操作日志
    // this.insertLog(
    //   `更新了预订时间段模板「${temp.TEMP_NAME}」的价格为${price}元`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.OPER
    // );

    return {
      success: true,
      id: id
    };
  }


	/**删除数据 */
  /**删除数据 */
  async delTemp(id) {
        // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证模板是否存在且属于当前项目
    const where = {
        _id: id,
        _pid: this.getProjectId()
    };
    const temp = await TempModel.getOne(where, 'TEMP_NAME');
    if (!temp) {
        this.AppError('该模板不存在或已被删除');
    }

    // 2. 执行删除操作
    await TempModel.del(where);

    // 3. 记录操作日志
    // this.insertLog(
    //     `删除了预订时间段模板「${temp.TEMP_NAME}」`,
    //     await this.getAdminInfo(),
    //     LogModel.TYPE.SYS
    // );

    return {
        success: true,
        id: id
    };
  }


	/**分页列表 */
	async getTempList() {
		let orderBy = {
			'TEMP_ADD_TIME': 'desc'
		};
		let fields = 'TEMP_NAME,TEMP_TIMES';

		let where = {
		};
		return await TempModel.getAll(where, fields, orderBy);
	}

}

module.exports = AdminEnrollService;