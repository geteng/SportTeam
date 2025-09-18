/**
 * Notes: 组队模块控制器
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2021-12-10 04:00:00 
 */

const BaseProjectController = require('./base_project_controller.js');
const TeamService = require('../service/team_service.js');
const timeUtil = require('../../../framework/utils/time_util.js');

class TeamController extends BaseProjectController {

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


}

module.exports = TeamController;