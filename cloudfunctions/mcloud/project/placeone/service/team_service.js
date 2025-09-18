const BaseProjectService = require('./base_project_service.js');
const util = require('../../../framework/utils/util.js');
const TeamModel = require('../model/team_model.js'); 


class TeamService extends BaseProjectService {


  /**
   * 获取我的组队列表
   * @param {Object} params 查询参数
   * @param {number} params.page 页码
   * @param {number} params.size 每页条数
   * @param {number} params.status 状态筛选
   */
  async getMyList(params) {
    const { page = 1, size = 10, status } = params;
    
    // 构建查询条件：只查询当前用户相关的组队记录
    const where = {
      _pid: this._pid,
      $or: [
        { TEAM_CREATOR_ID: this._userId }, // 我创建的
        { TEAM_JOINER_ID: this._userId }   // 我加入的
      ]
    };
    
    // 如果有状态筛选，添加状态条件
    if (status !== undefined) {
      where.TEAM_STATUS = Number(status);
    }
    
    // 分页查询
    const result = await TeamModel.getList(
      where,
      'TEAM_ID, TEAM_TITLE, TEAM_CREATOR_ID, TEAM_CREATOR_NAME, TEAM_JOINER_ID, TEAM_JOINER_NAME, TEAM_STATUS, TEAM_CREATE_TIME',
      { TEAM_CREATE_TIME: 'desc' },
      page,
      size
    );
    
    // 补充状态描述
    result.list.forEach(item => {
      item.TEAM_STATUS_DESC = this._getStatusDesc(item.TEAM_STATUS);
      // 判断当前用户是创建者还是加入者
      item.isCreator = item.TEAM_CREATOR_ID === this._userId;
    });
    
    return result;
  }

  /**
   * 同意组队请求
   * @param {string} id 组队记录ID
   */
  async agree(id) {
    if (!id) {
      this.AppError('请传入有效的组队记录ID');
    }
    
    // 1. 查询组队记录，验证权限
    const team = await TeamModel.getOne({
      _id: id,
      _pid: this._pid,
      TEAM_JOINER_ID: this._userId, // 只能同意自己收到的请求
      TEAM_STATUS: TeamModel.STATUS.PENDING // 只能同意待处理状态的请求
    });
    
    if (!team) {
      this.AppError('该组队请求不存在或已处理');
    }
    
    // 2. 更新组队状态为已同意
    await TeamModel.edit(
      { _id: id, _pid: this._pid },
      {
        TEAM_STATUS: TeamModel.STATUS.AGREED,
        TEAM_UPDATE_TIME: this._timestamp,
        TEAM_UPDATE_IP: this._ip
      }
    );
    
    // 3. 记录操作日志
    
    return { success: true };
  }

  /**
   * 拒绝组队请求
   * @param {string} id 组队记录ID
   */
  async refuse(id) {
    if (!id) {
      this.AppError('请传入有效的组队记录ID');
    }
    
    // 1. 查询组队记录，验证权限
    const team = await TeamModel.getOne({
      _id: id,
      _pid: this._pid,
      TEAM_JOINER_ID: this._userId, // 只能拒绝自己收到的请求
      TEAM_STATUS: TeamModel.STATUS.PENDING // 只能拒绝待处理状态的请求
    });
    
    if (!team) {
      this.AppError('该组队请求不存在或已处理');
    }
    
    // 2. 更新组队状态为已拒绝
    await TeamModel.edit(
      { _id: id, _pid: this._pid },
      {
        TEAM_STATUS: TeamModel.STATUS.REFUSED,
        TEAM_UPDATE_TIME: this._timestamp,
        TEAM_UPDATE_IP: this._ip
      }
    );
    
    // 3. 记录操作日志
    
    return { success: true };
  }


  /**
 * 新增组队记录
 * @param {Object} data 组队数据
  */
  async insert(data) {
    // 1. 验证被邀请者是否存在（假设通过UserModel查询）
    // const joinerExists = await UserModel.getOne({ _id: data.TEAM_JOINER_ID }, '_id');
    // if (!joinerExists) {
    //   this.AppError('被邀请者不存在');
    // }

    // 2. 验证是否已向该用户发送过未处理的组队请求
    const duplicate = await TeamModel.getOne({
      _pid: this._pid,
      TEAM_CREATOR_ID: data.TEAM_CREATOR_ID,
      TEAM_JOINER_ID: data.TEAM_JOINER_ID,
      TEAM_STATUS: TeamModel.STATUS.PENDING
    }, '_id');
    if (duplicate) {
      this.AppError('已向该用户发送过组队请求，请勿重复发送');
    }

    // 3. 执行新增操作
    return await TeamModel.insert(data);
  }


  /**
   * 删除组队记录
   * @param {string} id 组队记录ID
   */
  async delete(id) {
    if (!id) {
      this.AppError('请传入有效的组队记录ID');
    }
    
    // 1. 查询组队记录，验证权限（创建者或加入者都可以删除）
    const team = await TeamModel.getOne({
      _id: id,
      _pid: this._pid,
      $or: [
        { TEAM_CREATOR_ID: this._userId },
        { TEAM_JOINER_ID: this._userId }
      ]
    });
    
    if (!team) {
      this.AppError('该组队记录不存在或无权删除');
    }
    
    // 2. 执行删除操作
    await TeamModel.del({
      _id: id,
      _pid: this._pid
    });
    
    // 3. 记录操作日志
    
    return { success: true };
  }

  /**
   * 获取状态描述
   * @param {number} status 状态值
   */
  _getStatusDesc(status) {
    const statusMap = {
      [TeamModel.STATUS.PENDING]: '待处理',
      [TeamModel.STATUS.AGREED]: '已同意',
      [TeamModel.STATUS.REFUSED]: '已拒绝',
      [TeamModel.STATUS.CANCELLED]: '已取消'
    };
    return statusMap[status] || '未知状态';
  }
}

module.exports = TeamService;
