const BaseModel = require('./base_model.js');

class TeamModel extends BaseModel {
  // 表名
  static get TABLE() {
    return 'team';
  }

  // 状态常量
  static get STATUS() {
    return {
      PENDING: 0,     // 待处理
      AGREED: 1,      // 已同意
      REFUSED: 2,     // 已拒绝
      CANCELLED: 3    // 已取消
    };
  }

  // 状态描述
  static get STATUS_DESC() {
    return {
      0: '待处理',
      1: '已同意',
      2: '已拒绝',
      3: '已取消'
    };
  }

  /**
   * 获取组队列表
   * @param {Object} where 查询条件
   * @param {string} fields 字段
   * @param {Object} order 排序
   * @param {number} page 页码
   * @param {number} size 每页条数
   */
  static async getList(where, fields, order, page, size) {
    return await this._getList(
      this.TABLE,
      where,
      fields,
      order,
      page,
      size
    );
  }

  /**
   * 获取单条组队记录
   * @param {Object} where 查询条件
   * @param {string} fields 字段
   */
  static async getOne(where, fields = '*') {
    return await this._getOne(
      this.TABLE,
      where,
      fields
    );
  }

  /**
   * 更新组队记录
   * @param {Object} where 更新条件
   * @param {Object} data 更新数据
   */
  static async edit(where, data) {
    return await this._edit(
      this.TABLE,
      where,
      data
    );
  }

  /**
   * 删除组队记录
   * @param {Object} where 删除条件
   */
  static async del(where) {
    return await this._del(
      this.TABLE,
      where
    );
  }

  /**
   * 新增组队记录
   * @param {Object} data 组队数据
   */
  static async insert(data) {
    return await this._insert(
      this.TABLE,
      data
    );
  }
}

module.exports = TeamModel;
