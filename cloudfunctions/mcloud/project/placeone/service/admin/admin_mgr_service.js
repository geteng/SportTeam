/**
 * Notes: 管理员管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2021-07-11 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const AdminModel = require('../../model/admin_model.js');
const LogModel = require('../../../../framework/platform/model/log_model.js');
const md5Lib = require('../../../../framework/lib/md5_lib.js');

class AdminMgrService extends BaseProjectAdminService {

	//**管理员登录  */
	async adminLogin(name, password) {

		// 判断是否存在
		let where = {
			ADMIN_STATUS: 1,
			ADMIN_NAME: name,
			ADMIN_PASSWORD: md5Lib.md5(password)
		}
		let fields = 'ADMIN_ID,ADMIN_NAME,ADMIN_DESC,ADMIN_TYPE,ADMIN_LOGIN_TIME,ADMIN_LOGIN_CNT';
		let admin = await AdminModel.getOne(where, fields);
		if (!admin)
			this.AppError('管理员不存在或者已停用');

		let cnt = admin.ADMIN_LOGIN_CNT;

		// 生成token
		let token = dataUtil.genRandomString(32);
		let tokenTime = timeUtil.time();
		let data = {
			ADMIN_TOKEN: token,
			ADMIN_TOKEN_TIME: tokenTime,
			ADMIN_LOGIN_TIME: timeUtil.time(),
			ADMIN_LOGIN_CNT: cnt + 1
		}
		await AdminModel.edit(where, data);

		let type = admin.ADMIN_TYPE;
		let last = (!admin.ADMIN_LOGIN_TIME) ? '尚未登录' : timeUtil.timestamp2Time(admin.ADMIN_LOGIN_TIME);

		// 写日志
		this.insertLog('登录了系统', admin, LogModel.TYPE.SYS);

		return {
			token,
			name: admin.ADMIN_NAME,
			type,
			last,
			cnt
		}

	}

	async clearLog() {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证当前管理员是否为超级管理员
    const myAdmin = await AdminModel.getOne({ _id: this._adminId }, 'ADMIN_TYPE, ADMIN_NAME, ADMIN_DESC');
    if (!myAdmin || myAdmin.ADMIN_TYPE !== 1) {
        this.AppError('仅超级管理员可清除操作日志');
    }

    // 2. 执行日志清除（保留当前项目下的日志数据）
    const where = {
        _pid: this.getProjectId()
    };
    await LogModel.del(where);

    // 3. 记录清除日志的操作（避免被自身清除，使用系统级项目ID）
    this.insertLog(
        '清除了系统所有操作日志',
        myAdmin,
        LogModel.TYPE.SYS,
        // { _pid: constants.PLATFORM_PID } // 存储到平台级日志，防止被项目日志清除影响
    );
	}

	/** 取得日志分页列表 */
	async getLogList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件 
		page,
		size,
		oldTotal = 0
	}) {

		orderBy = orderBy || {
			LOG_ADD_TIME: 'desc'
		};
		let fields = 'LOG_ADMIN_ID,LOG_ADMIN_DESC,LOG_ADMIN_NAME,LOG_CONTENT,LOG_TYPE,LOG_ADD_TIME,admin.ADMIN_TYPE';
		let where = {};


		if (util.isDefined(search) && search) {
			where.or = [
				{ LOG_CONTENT: ['like', search] },
				{ LOG_ADMIN_DESC: ['like', search] },
				{ LOG_ADMIN_NAME: ['like', search] }
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'type':
					// 按类型
					where.LOG_TYPE = Number(sortVal);
					break;
			}
		}


		let joinParams = {
			from: AdminModel.CL,
			localField: 'LOG_ADMIN_ID',
			foreignField: '_id',
			as: 'admin',
		};

		let result = await LogModel.getListJoin(joinParams, where, fields, orderBy, page, size, true, oldTotal);


		return result;
	}

	/** 获取所有管理员 */
	async getMgrList({
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
		orderBy = {
			ADMIN_ADD_TIME: 'desc'
		}
		let fields = 'ADMIN_ADD_TIME,ADMIN_NAME,ADMIN_STATUS,ADMIN_PHONE,ADMIN_TYPE,ADMIN_LOGIN_CNT,ADMIN_LOGIN_TIME,ADMIN_DESC,ADMIN_EDIT_TIME,ADMIN_EDIT_IP';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};


		if (util.isDefined(search) && search) {
			where.or = [
				{ ADMIN_NAME: ['like', search] },
				{ ADMIN_PHONE: ['like', search] },
				{ ADMIN_DESC: ['like', search] }
			];
		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					// 按类型
					where.and.ADMIN_STATUS = Number(sortVal);
					break;
				case 'type':
					// 按类型
					where.and.ADMIN_TYPE = Number(sortVal);
					break;
			}
		}

		return await AdminModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

	/** 删除管理员 */
	async delMgr(id, myAdminId) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证当前操作的管理员是否为超级管理员
    const myAdmin = await AdminModel.getOne({ _id: myAdminId }, 'ADMIN_TYPE');
    if (!myAdmin || myAdmin.ADMIN_TYPE !== 1) {
        this.AppError('仅超级管理员可执行删除操作');
    }

    // 2. 验证目标管理员是否存在
    const targetAdmin = await AdminModel.getOne({ _id: id }, 'ADMIN_NAME, ADMIN_TYPE, ADMIN_STATUS');
    if (!targetAdmin) {
        this.AppError('目标管理员不存在');
    }

    // 3. 禁止删除自己
    if (id === myAdminId) {
        this.AppError('不能删除当前登录的管理员账号');
    }

    // 4. 禁止删除最后一个超级管理员
    if (targetAdmin.ADMIN_TYPE === 1) {
        const superAdminCount = await AdminModel.count({
            ADMIN_TYPE: 1,
            _id: ['<>', id], // 排除当前要删除的超级管理员
            ADMIN_STATUS: 1
        });
        if (superAdminCount === 0) {
            this.AppError('不能删除最后一个超级管理员');
        }
    }

    // 5. 执行删除操作
    await AdminModel.del({ _id: id });

    // 6. 记录操作日志
    this.insertLog(
        `删除了管理员「${targetAdmin.ADMIN_NAME}」（ID: ${id}）`,
        myAdmin,
        LogModel.TYPE.SYS
    );
	}

	/** 添加新的管理员 */
	async insertMgr({
		type,
		name,
		desc,
		phone,
		password
	}) {
		// this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
        // 1. 验证当前操作的管理员是否为超级管理员
    const myAdmin = await AdminModel.getOne({ _id: this._adminId }, 'ADMIN_TYPE');
    if (!myAdmin || myAdmin.ADMIN_TYPE !== 1) {
      this.AppError('仅超级管理员可添加新管理员');
    }

    // 2. 验证管理员账号是否已存在
    const nameCount = await AdminModel.count({
      ADMIN_NAME: name,
      _pid: this.getProjectId()
    });
    if (nameCount > 0) {
      this.AppError('该管理员账号已存在');
    }

    // 3. 验证手机号格式（如果提供）
    if (phone && !util.isMobile(phone)) {
      this.AppError('手机号格式不正确');
    }

    // 4. 验证管理员类型合法性
    if (![0, 1].includes(type)) {
      this.AppError('管理员类型值无效');
    }

    // 5. 密码加密处理
    const encryptPwd = md5Lib.md5(password);

    // 6. 准备插入数据
    const data = {
      _pid: this.getProjectId(),
      ADMIN_NAME: name,
      ADMIN_DESC: desc,
      ADMIN_PHONE: phone || '',
      ADMIN_PASSWORD: encryptPwd,
      ADMIN_TYPE: type,
      ADMIN_STATUS: 1, // 默认启用状态
      ADMIN_ADD_TIME: timeUtil.time(),
      ADMIN_EDIT_TIME: timeUtil.time(),
      ADMIN_ADD_IP: this._ip,
      ADMIN_EDIT_IP: this._ip,
      ADMIN_LOGIN_CNT: 0,
      ADMIN_LOGIN_TIME: 0
    };

    // 7. 执行插入操作
    await AdminModel.insert(data);

    // 8. 记录操作日志
    this.insertLog(
      `添加了管理员「${desc || name}」（账号：${name}，类型：${type === 1 ? '超级管理员' : '普通管理员'}）`,
      myAdmin,
      LogModel.TYPE.SYS
    );

	}

	/** 修改状态 */
	async statusMgr(id, status, myAdminId) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证当前操作的管理员是否为超级管理员
    // console.log('myAdmin:', myAdminId)

    const myAdmin = await AdminModel.getOne({ _id: myAdminId }, 'ADMIN_TYPE');
    console.log('myAdmin:', myAdmin)

    if (!myAdmin || myAdmin.ADMIN_TYPE !== 1) {
        this.AppError('仅超级管理员可修改管理员状态');
    }

    // 2. 验证目标管理员是否存在
    const targetAdmin = await AdminModel.getOne({ _id: id }, 'ADMIN_NAME, ADMIN_TYPE, ADMIN_STATUS');
    if (!targetAdmin) {
        this.AppError('目标管理员不存在');
    }

    // 3. 禁止修改自己的状态
    if (id === myAdminId) {
        this.AppError('不能修改当前登录的管理员账号状态');
    }

    // 4. 验证状态值合法性
    if (![0, 1].includes(status)) {
        this.AppError('状态值必须为0（禁用）或1（启用）');
    }

    // 5. 禁止禁用最后一个超级管理员
    if (targetAdmin.ADMIN_TYPE === 1 && status === 0) {
        const activeSuperAdminCount = await AdminModel.count({
            ADMIN_TYPE: 1,
            ADMIN_STATUS: 1,
            _id: ['<>', id] // 排除当前要禁用的超级管理员
        });
        if (activeSuperAdminCount === 0) {
            this.AppError('不能禁用最后一个超级管理员');
        }
    }

    // 6. 状态未发生变化则无需操作
    if (targetAdmin.ADMIN_STATUS === status) {
        this.AppError('管理员状态未发生变化');
    }

    // 7. 执行状态更新
    await AdminModel.edit(
        { _id: id },
        {
            ADMIN_STATUS: status,
            ADMIN_EDIT_TIME: timeUtil.time(),
            ADMIN_EDIT_IP: this._ip
        }
    );

    // 8. 记录操作日志
    const statusDesc = status === 1 ? '启用' : '禁用';
    this.insertLog(
        `将管理员「${targetAdmin.ADMIN_NAME}」${statusDesc}（原状态：${targetAdmin.ADMIN_STATUS === 1 ? '启用' : '禁用'}）`,
        myAdmin,
        LogModel.TYPE.SYS
    );
	}


	/** 获取管理员信息 */
	async getMgrDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let mgr = await AdminModel.getOne(where, fields);
		if (!mgr) return null;

		return mgr;
	}

	/** 修改管理员 */
	async editMgr(id, {
		type,
		name,
		desc,
		phone,
		password
	}) {

    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证当前操作的管理员是否为超级管理员
    const myAdmin = await AdminModel.getOne({ _id: this._adminId }, 'ADMIN_TYPE');
    if (!myAdmin || myAdmin.ADMIN_TYPE !== 1) {
      this.AppError('仅超级管理员可修改管理员信息');
    }

    // 2. 验证目标管理员是否存在
    const targetAdmin = await AdminModel.getOne({ _id: id }, 'ADMIN_NAME, ADMIN_TYPE');
    if (!targetAdmin) {
      this.AppError('目标管理员不存在');
    }

    // 3. 验证管理员账号唯一性（排除自身）
    const nameCount = await AdminModel.count({
      ADMIN_NAME: name,
      _id: ['<>', id],
      _pid: this.getProjectId()
    });
    if (nameCount > 0) {
      this.AppError('该管理员账号已存在');
    }

    // 4. 验证手机号格式（如果提供）
    if (phone && !util.isMobile(phone)) {
      this.AppError('手机号格式不正确');
    }

    // 5. 验证管理员类型合法性
    if (![0, 1].includes(type)) {
      this.AppError('管理员类型值无效');
    }

    // 6. 禁止将最后一个超级管理员修改为普通管理员
    if (targetAdmin.ADMIN_TYPE === 1 && type === 0) {
      const superAdminCount = await AdminModel.count({
        ADMIN_TYPE: 1,
        _id: ['<>', id],
        ADMIN_STATUS: 1
      });
      if (superAdminCount === 0) {
        this.AppError('不能将最后一个超级管理员修改为普通管理员');
      }
    }

    // 7. 准备更新数据
    const data = {
      ADMIN_TYPE: type,
      ADMIN_NAME: name,
      ADMIN_DESC: desc,
      ADMIN_PHONE: phone || '',
      ADMIN_EDIT_TIME: timeUtil.time(),
      ADMIN_EDIT_IP: this._ip
    };

    // 8. 处理密码（如果提供新密码）
    if (password) {
      data.ADMIN_PASSWORD = md5Lib.md5(password);
    }

    // 9. 执行更新操作
    await AdminModel.edit({ _id: id }, data);

    // 10. 记录操作日志
    this.insertLog(
      `修改了管理员「${desc || name}」（账号：${name}，类型：${type === 1 ? '超级管理员' : '普通管理员'}）`,
      myAdmin,
      LogModel.TYPE.SYS
    );
	}

	/** 修改自身密码 */
	async pwdtMgr(adminId, oldPassword, password) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证当前管理员是否存在
    const admin = await AdminModel.getOne({ _id: adminId }, 'ADMIN_PASSWORD, ADMIN_NAME, ADMIN_DESC');
    if (!admin) {
        this.AppError('管理员不存在');
    }

    // 2. 验证旧密码是否正确
    const encryptOldPwd = md5Lib.md5(oldPassword);
    if (admin.ADMIN_PASSWORD !== encryptOldPwd) {
        this.AppError('旧密码不正确');
    }

    // 3. 验证新密码格式
    if (password.length < 6 || password.length > 30) {
        this.AppError('新密码长度必须在6-30位之间');
    }

    // 4. 加密新密码
    const encryptNewPwd = md5Lib.md5(password);

    // 5. 避免新旧密码相同
    if (encryptNewPwd === admin.ADMIN_PASSWORD) {
        this.AppError('新密码不能与旧密码相同');
    }

    // 6. 执行密码更新
    await AdminModel.edit(
        { _id: adminId },
        {
            ADMIN_PASSWORD: encryptNewPwd,
            ADMIN_EDIT_TIME: timeUtil.time(),
            ADMIN_EDIT_IP: this._ip
        }
    );

    // 7. 记录操作日志
    this.insertLog(
        `修改了自身登录密码`,
        admin,
        LogModel.TYPE.SYS
    );
	}
}

module.exports = AdminMgrService;