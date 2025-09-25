/**
 * Notes: 用户管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2022-01-22  07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const util = require('../../../../framework/utils/util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const UserModel = require('../../model/user_model.js');
const AdminHomeService = require('./admin_home_service.js');

// 导出用户数据KEY
const EXPORT_USER_DATA_KEY = 'EXPORT_USER_DATA';

class AdminUserService extends BaseProjectAdminService {

	/** 获得某个用户信息 */
	async getUser({
		userId,
		fields = '*'
	}) {
		let where = {
			USER_MINI_OPENID: userId,
		}
		return await UserModel.getOne(where, fields);
	}

	/** 取得用户分页列表 */
	async getUserList({
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
			USER_ADD_TIME: 'desc'
		};
		let fields = '*';


		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [{
				USER_NAME: ['like', search]
			},
			{
				USER_MOBILE: ['like', search]
			},
			{
				USER_MEMO: ['like', search]
			},
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'status':
					where.and.USER_STATUS = Number(sortVal);
					break;
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'USER_ADD_TIME');
					break;
				}
			}
		}
		let result = await UserModel.getList(where, fields, orderBy, page, size, true, oldTotal, false);


		// 为导出增加一个参数condition
		result.condition = encodeURIComponent(JSON.stringify(where));

		return result;
	}

	async statusUser(id, status, reason) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
        // 1. 验证用户是否存在
    const where = { USER_MINI_OPENID: id };
    const user = await UserModel.getOne(where);
    if (!user) {
      this.AppError('用户不存在');
    }

    // 2. 验证状态合法性
    const validStatus = Object.values(UserModel.STATUS);
    if (!validStatus.includes(Number(status))) {
      this.AppError('无效的用户状态值');
    }

    // 3. 准备更新数据
    const data = {
      USER_STATUS: Number(status),
      USER_EDIT_TIME: this._timestamp,
      USER_EDIT_IP: this._ip,
    };

    // 4. 若状态为审核未过，需记录理由
    if (status === UserModel.STATUS.UNCHECK && reason) {
      data.USER_CHECK_REASON = reason;
    }

    // 5. 执行更新
    await UserModel.edit(where, data);

    // 6. 记录操作日志
    // const statusDesc = UserModel.STATUS_DESC[Object.keys(UserModel.STATUS).find(key => UserModel.STATUS[key] === status)];
    // this.logUser(`将用户「${user.USER_NAME || user.USER_MOBILE}」状态修改为「${statusDesc}」`);
	}

	/**删除用户 */
	async delUser(id) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证用户是否存在
    const where = { USER_MINI_OPENID: id };
    const user = await UserModel.getOne(where, 'USER_NAME, USER_MOBILE');
    if (!user) {
      this.AppError('用户不存在');
    }

    // 2. 清理用户关联数据（如报名记录等）
    const adminHomeService = new AdminHomeService();
    await adminHomeService.clearUserData(id); // 调用已有方法清理关联数据

    // 3. 删除用户记录
    await UserModel.del(where);

    // 4. 记录操作日志
    // const userName = user.USER_NAME || user.USER_MOBILE;
    // this.logUser(`删除了用户「${userName}」`);
	}

	// #####################导出用户数据

	/**获取用户数据 */
	async getUserDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_USER_DATA_KEY);
	}

	/**删除用户数据 */
	async deleteUserDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_USER_DATA_KEY);
	}

  // 假设该方法用于处理用户数据导出并返回结果（含总条数）
  /**导出用户数据 */
/** 导出用户数据 */
async exportUserDataExcel(condition, fields) {
  try {
      // 1. 解析查询条件
      let where = {};
      if (condition) {
          where = JSON.parse(decodeURIComponent(condition));
          where.and = {
              ...where.and,
              _pid: this.getProjectId()
          };
      } else {
          where = {
              and: { _pid: this.getProjectId() }
          };
      }

      // 2. 验证导出字段合法性
      const validFields = Object.keys(UserModel.DB_STRUCTURE);
      const exportFields = fields.filter(field => validFields.includes(field));
      if (exportFields.length === 0) {
          this.AppError('导出字段不能为空或不存在');
      }

      // 3. 获取符合条件的总记录数（关键：计算 total）
      const total = await UserModel.count(where);
      if (total === 0) {
          this.AppError('没有符合条件的数据可导出');
      }

      // 4. 查询用户数据（如需分页可添加 limit，但导出通常全量）
      const userList = await UserModel.getAll(where, exportFields.join(','));

      // 5. 数据格式化处理
      const exportData = userList.map(user => {
          const item = {};
          // 处理时间字段
          if (exportFields.includes('USER_ADD_TIME')) {
              item.USER_ADD_TIME = timeUtil.timestamp2Time(user.USER_ADD_TIME);
          }
          if (exportFields.includes('USER_REG_TIME')) {
              item.USER_REG_TIME = timeUtil.timestamp2Time(user.USER_REG_TIME);
          }
          if (exportFields.includes('USER_LOGIN_TIME')) {
              item.USER_LOGIN_TIME = user.USER_LOGIN_TIME 
                  ? timeUtil.timestamp2Time(user.USER_LOGIN_TIME) 
                  : '未登录';
          }
          // 处理状态字段
          if (exportFields.includes('USER_STATUS')) {
              item.USER_STATUS = UserModel.STATUS_DESC[
                  Object.keys(UserModel.STATUS).find(
                      key => UserModel.STATUS[key] === user.USER_STATUS
                  )
              ];
          }
          // 其他字段直接映射
          exportFields.forEach(field => {
              if (!item[field]) {
                  item[field] = user[field] !== undefined ? user[field] : '';
              }
          });
          return Object.values(item); // 转为数组（xlsx 要求行数据为数组）
      });

      // 6. 生成表头（对应字段的中文名称）
      const headerMap = {
          USER_NAME: '用户昵称',
          USER_MOBILE: '手机号码',
          USER_STATUS: '账号状态',
          USER_ADD_TIME: '创建时间',
          USER_REG_TIME: '注册时间',
          USER_LOGIN_TIME: '最后登录时间',
          USER_LOGIN_CNT: '登录次数',
          USER_CHECK_REASON: '审核备注'
      };
      const header = exportFields.map(field => headerMap[field] || field);
      exportData.unshift(header); // 表头插入到数据第一行

      // 7. 调用工具方法导出，传入 total
      const result = await exportUtil.exportDataExcel(
          EXPORT_USER_DATA_KEY, 
          '用户数据', 
          total, // 传入总条数
          exportData
      );

      // 8. 返回包含 total 和 url 的结果
      return {
          total: result.total,
          url: result.url
      };
  } catch (err) {
      if (err.message.includes('AppError')) throw err;
      this.AppError('导出数据失败：' + err.message);
  }
}

}

module.exports = AdminUserService;