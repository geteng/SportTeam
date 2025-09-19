/**
 * Notes: 组队模块控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2021-12-10 04:00:00 
 */

const BaseProjectController = require('./base_project_controller.js');
const TeamService = require('../service/team_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');
// 新增导入 TeamModel
const TeamModel = require('../model/team_model.js'); 

class TeamController extends BaseProjectController {

  // 在控制器中调用（如 team_controller.js）
// await teamService.editStatus('组队记录ID', 2); // 2=已同意


//   // 组装数据
//   const data = {
//     TEAM_TITLE: input.title,
//     TEAM_CREATOR_ID: this._userId, // 当前用户
//     TEAM_JOINER_ID: input.joinerId,
//     TEAM_STATUS: TeamModel.STATUS.PENDING // 使用模型定义的状态常量
//   };
  
//   // 调用服务层
//   const service = new TeamService();
//   return await service.insert(data); 
// }

// 小程序组件中触发提交（my_time_select_cmpt.js）
// submitTeamApply() {
//   this.triggerEvent('teamApply', {
//     joinId: this.data.currentJoinId,
//     name: teamName,
//     mobile: teamMobile
//   });
// }



  /**
   * 获取我的组队列表（仅包含我创建的组队）
   * @param {Object} params 查询参数
   */
  async myList(params) {
    // 数据校验：仅保留分页参数（服务层默认按状态1=待确认、2=已同意筛选）
    let rules = {
      page: 'int|default=1', // 页码，默认第1页
      size: 'int|default=10' // 每页条数，默认10条
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);
    const { page, size } = input;
    const ownerId = this._userId; // 当前用户ID（作为创建者owner）

    // 实例化服务层
    const service = new TeamService();
    
    // 调用服务层查询“我创建的组队”方法
    let result = await service.getListByOwner(ownerId, page, size);

    // 格式化时间字段（使用模型中定义的时间字段）
    if (result.list && result.list.length > 0) {
      result.list.forEach(item => {
        // 转换创建时间和修改时间为可读格式
        item.TEAM_ADD_TIME = timeUtil.timestamp2Time(item.TEAM_ADD_TIME, 'Y-M-D h:m');
        item.TEAM_EDIT_TIME = timeUtil.timestamp2Time(item.TEAM_EDIT_TIME, 'Y-M-D h:m');
        // 补充状态描述（关联TeamModel的状态常量）
        item.TEAM_STATUS_DESC = TeamModel.STATUS_DESC[item.TEAM_STATUS] || '';
      });
    }
    return result;
  }


    /**
   * 获取我的组队列表（仅包含我创建的组队）
   * @param {Object} params 查询参数
   */
  async myReList(params) {
    // 数据校验：仅保留分页参数（服务层默认按状态1=待确认、2=已同意筛选）
    let rules = {
      page: 'int|default=1', // 页码，默认第1页
      size: 'int|default=10' // 每页条数，默认10条
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);
    const { page, size } = input;
    const ownerId = this._userId; // 当前用户ID（作为创建者owner）

    // 实例化服务层
    const service = new TeamService();
    
    // 调用服务层查询“我创建的组队”方法
    let result = await service.getListByApplicant(ownerId, page, size);

    // 格式化时间字段（使用模型中定义的时间字段）
    if (result.list && result.list.length > 0) {
      result.list.forEach(item => {
        // 转换创建时间和修改时间为可读格式
        item.TEAM_ADD_TIME = timeUtil.timestamp2Time(item.TEAM_ADD_TIME, 'Y-M-D h:m');
        item.TEAM_EDIT_TIME = timeUtil.timestamp2Time(item.TEAM_EDIT_TIME, 'Y-M-D h:m');
        // 补充状态描述（关联TeamModel的状态常量）
        item.TEAM_STATUS_DESC = TeamModel.STATUS_DESC[item.TEAM_STATUS] || '';
      });
    }
    return result;
  }



  
  /**
   * 同意组队请求
   * @param {Object} params 请求参数
   */
  async agree(params) {
    // 数据校验
    let rules = {
      TEAM_ID: 'must|TEAM_ID' // 组队记录ID必传
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);

    // 实例化服务层
    const service = new TeamService();
    // 调用服务层同意方法
    return await service.editStatus(input.TEAM_ID,1);
  }

  /**
   * 拒绝组队请求
   * @param {Object} params 请求参数
   */
  async refuse(params) {
    // 数据校验
    let rules = {
      id: 'must|id' // 组队记录ID必传
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);

    // 实例化服务层
    const service = new TeamService();
    // 调用服务层拒绝方法
    return await service.editStatus(input.id,2);
  }

  /**
   * 删除组队记录
   * @param {Object} params 请求参数
   */
  async delete(params) {
    // 数据校验
    let rules = {
      id: 'must|id' // 组队记录ID必传
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);

    // 实例化服务层
    const service = new TeamService();
    // 调用服务层删除方法
    return await service.delete(input.id);
  }

  /**
   * 新增组队记录
   * @param {Object} params 请求参数
   */
  async insert(params) {
    // 数据校验规则：根据TeamModel字段定义必填项
    let rules = {
      team_owner_ID: 'string|true|comment=队伍拥有者ID',
      team_owner_name: 'string|true|comment=队伍拥有者姓名',
      team_owner_Mobile: 'string|false|comment=队伍拥有者手机',

      // 申请者信息（被邀请人/加入者）
      // applicantId: 'must|string|name=申请用户ID',
      applicantName: 'must|string|name=申请用户姓名',
      applicantMobile: 'string|name=申请用户手机',

      // 组队基本信息
      date: 'must|string|name=组队日期（yyyy-mm-dd）',
      hour: 'must|string|name=组队时间（hh:mm）',
      place: 'must|string|name=组队场地',
    };

    // 执行数据验证，获取过滤后的参数
    let input = this.validateData(rules, params);

    // 组装新增数据（与TeamModel.DB_STRUCTURE对应）
    const data = {
      // 队伍拥有者信息（当前登录用户）
      TEAM_OWNER_ID: input.team_owner_ID,
      TEAM_OWNER_NAME: input.team_owner_name || '', // 假设基类有用户名属性
      TEAM_OWNER_MOBILE: input.team_owner_Mobile || '', // 可选，根据实际用户信息补充

      // 申请者信息（从参数获取）
      TEAM_APPLICANT_ID: this._userId,
      TEAM_APPLICANT_NAME: input.applicantName,
      TEAM_APPLICANT_MOBILE: input.applicantMobile || '',

      // 组队时间地点
      TEAM_DATE: input.date,
      TEAM_HOUR: input.hour,
      TEAM_PLACE: input.place,

      // 状态默认设为"等待"（0）
      TEAM_STATUS: TeamModel.STATUS.PENDING,

      // 时间和IP信息（从基类获取）
      TEAM_ADD_TIME: this._timestamp,
      TEAM_EDIT_TIME: this._timestamp,
      TEAM_ADD_IP: this._ip,
      TEAM_EDIT_IP: this._ip,
    };

    // 实例化服务层
    const service = new TeamService();
    
    // 调用服务层插入方法（需在TeamService中实现insert）
    const teamId = await service.insert(data);

    // 记录操作日志（可选，根据项目需求）
    // this.logOther(`创建了组队记录（ID：${teamId}）`);

    return {
      success: true,
      teamId, // 返回新增的组队记录ID
      msg: '组队记录创建成功'
    };
  }

  

}

module.exports = TeamController;