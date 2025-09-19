/**
 * Notes: 组队模块控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2021-12-10 04:00:00 
 */

const BaseProjectController = require('./base_project_controller.js');
const TeamService = require('../service/team_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

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
   * 获取我的组队列表
   * @param {Object} params 查询参数
   */
  async myList(params) {
    // 数据校验
    let rules = {
      page: 'int|default=1',
      size: 'int|default=10',
      status: 'int|default=-1' // -1表示不筛选状态
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);

    // 实例化服务层
    const service = new TeamService();
    // 调用服务层方法获取列表
    let result = await service.getMyList(input);

    // 格式化时间字段
    if (result.list && result.list.length > 0) {
      result.list.forEach(item => {
        item.TEAM_CREATE_TIME = timeUtil.timestamp2Time(item.TEAM_CREATE_TIME);
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
      id: 'must|id' // 组队记录ID必传
    };

    // 取得验证后的数据
    let input = this.validateData(rules, params);

    // 实例化服务层
    const service = new TeamService();
    // 调用服务层同意方法
    return await service.agree(input.id);
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
    return await service.refuse(input.id);
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

// /**
//  * 新增组队记录
//  * @param {Object} params 请求参数
//  */
//   async insert(params) {
//     // 数据校验规则：定义新增组队所需参数及验证规则
//     let rules = {
//       title: 'must|string|min:2|max:50|name=组队标题', // 组队标题必填，字符串类型，长度限制
//       joinerId: 'must|id|name=被邀请者ID', // 被邀请者ID必填，需符合ID格式
//       desc: 'string|max:200|name=组队描述' // 组队描述可选，字符串类型，最大长度限制
//     };

//     // 执行数据验证，获取验证后的参数
//     let input = this.validateData(rules, params);

//     // 补充必要数据（从上下文获取）
//     const data = {
//       TEAM_TITLE: input.title,
//       TEAM_CREATOR_ID: this._userId, // 创建者ID（当前登录用户）
//       TEAM_CREATOR_NAME: this._userName, // 假设基类有用户名属性，可根据实际情况调整
//       TEAM_JOINER_ID: input.joinerId,
//       TEAM_DESC: input.desc || '', // 描述为空时设为默认空字符串
//       TEAM_STATUS: TeamModel.STATUS.PENDING, // 初始状态设为待处理
//       TEAM_CREATE_TIME: this._timestamp, // 创建时间（时间戳）
//       TEAM_CREATE_IP: this._ip // 创建时的IP地址
//     };

//     // 实例化服务层
//     const service = new TeamService();
//     // 调用服务层新增方法（需在TeamService中实现对应的insert逻辑）
//     const result = await service.insert(data);

//     return {
//       success: true,
//       teamId: result, // 假设服务层返回新增记录的ID
//       msg: '组队请求已发送'
//     };
//   }

  

}

module.exports = TeamController;