const BaseProjectService = require('./base_project_service.js');
const util = require('../../../framework/utils/util.js');
const TeamModel = require('../model/team_model.js'); 

class TeamService extends BaseProjectService {

//查询有哪些人找我组队
// let teamService = new TeamService();
// let teamList = await teamService.getListByOwner('用户ID');
// cloudfunctions/mcloud/project/placeone/service/team/team_service.js
  async getListByOwner(ownerId,
    page,
    size,
    isTotal = true,
    oldTotal = 0) {
    // 数据校验
    if (!ownerId) throw new Error('ownerId不能为空');
    
    // 查询条件
    let where = {
      TEAM_OWNER_ID: ownerId,
      TEAM_STATUS: ['in', [0, 1, 2]] // 1=待确认, 2=已同意
    };
    
    // 查询字段
    // let fields = 'TEAM_ID,TEAM_NAME,TEAM_PHONE,TEAM_STATUS,TEAM_ADD_TIME';
    // 返回字段
    let fields = `
    TEAM_ID,
    TEAM_OWNER_ID,
    TEAM_APPLICANT_ID,
    TEAM_APPLICANT_NAME,
    TEAM_APPLICANT_MOBILE,
    TEAM_DATE,
    TEAM_HOUR,
    TEAM_PLACE,
    TEAM_STATUS,
    TEAM_ADD_TIME,
    TEAM_EDIT_TIME
  `;
    // 排序规则（按申请时间倒序）
    let orderBy = { TEAM_ADD_TIME: 'desc' };
    
    // 调用数据库工具查询
    return await TeamModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
  }

//查询我参加了哪些组队
// {
//   list: [
//     {
//       TEAM_ID: '组队记录ID',
//       TEAM_OWNER_ID: '队伍拥有者ID',
//       TEAM_NAME: '申请人姓名',
//       TEAM_PHONE: '申请人电话',
//       TEAM_STATUS: 1, // 状态值
//       TEAM_ADD_TIME: '2023-01-01 00:00:00' // 申请时间
//     }
//   ],
//   total: 10 // 符合条件的总记录数
// }

// let teamService = new TeamService();
// let result = await teamService.getListByApplicant('用户ID', 1, 10);


  // cloudfunctions/mcloud/project/placeone/service/team/team_service.js
  async getListByApplicant(applicantId, page, size, isTotal = true, oldTotal = 0) {
    // 参数校验
    if (!applicantId) throw new Error('applicantId不能为空');
    
    // 查询条件
    let where = {
      TEAM_APPLICANT_ID: applicantId,
      TEAM_STATUS: ['in', [0, 1, 2]] // 1=待确认, 2=已同意
    };
    
    // 返回字段
    let fields = `
      TEAM_ID,
      TEAM_OWNER_ID,
      TEAM_OWNER_NAME,
      TEAM_OWNER_MOBILE,
      TEAM_DATE,
      TEAM_HOUR,
      TEAM_PLACE,
      TEAM_STATUS,
      TEAM_ADD_TIME,
      TEAM_EDIT_TIME
    `;
    
    // 排序规则（按申请时间倒序）
    let orderBy = { TEAM_ADD_TIME: 'desc' };
    
    // 调用模型层查询
    return await TeamModel.getList(
      where, 
      fields, 
      orderBy, 
      page, 
      size, 
      isTotal, 
      oldTotal
    );
  }

// 修改申请状态
// cloudfunctions/mcloud/project/placeone/service/team/team_service.js
  async editStatus(teamId, status) {
    // 参数校验
    if (!teamId || !status) throw new Error('参数不全');
    
    // 更新条件
    let where = { TEAM_ID: teamId };
    
    // 更新数据
    let data = {
      TEAM_STATUS: status,
      TEAM_EDIT_TIME: this._time() // 使用基类的时间方法
    };
    
    // 调用模型层
    return await TeamModel.edit(where, data);
  }
// 在TeamService中添加
  async insert(data) {
    // 可添加业务校验（如避免重复申请等）
    return await TeamModel.insert(data);
  }
}

module.exports = TeamService;
