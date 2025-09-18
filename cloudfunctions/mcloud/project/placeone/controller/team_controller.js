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

  }
  
    /**
   * 同意组队请求
   * @param {Object} params 请求参数
   */
  async agree(params) {
  }

    /**
   * 拒绝组队请求
   * @param {Object} params 请求参数
   */
  async refuse(params) {
  }
    /**
   * 删除组队记录
   * @param {Object} params 请求参数
   */
  async delete(params) {
  }


}

module.exports = TeamController;