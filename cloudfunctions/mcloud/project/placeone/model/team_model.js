/**
 * Notes: 组队实体
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2022-05-24 19:20:00 
 */


const BaseProjectModel = require('./base_project_model.js');

class TeamModel extends BaseProjectModel {

}

// 集合名
TeamModel.CL = BaseProjectModel.C('team');

TeamModel.DB_STRUCTURE = {
	_pid: 'string|true', // 项目ID
	TEAM_ID: 'string|true', // 组队记录ID

	TEAM_OWNER_ID: 'string|true|comment=队伍拥有者ID',
	TEAM_OWNER_NAME: 'string|true|comment=队伍拥有者姓名',
	TEAM_OWNER_MOBILE: 'string|false|comment=队伍拥有者手机',

	TEAM_DATE: 'string|true|comment=组队日期（yyyy-mm-dd）',
	TEAM_HOUR: 'string|true|comment=组队时间（hh:mm）',
	TEAM_PLACE: 'string|true|comment=组队场地',

	TEAM_APPLICANT_ID: 'string|true|comment=申请组队人ID',
	TEAM_APPLICANT_NAME: 'string|true|comment=申请组队人姓名',
	TEAM_APPLICANT_MOBILE: 'string|false|comment=申请组队人手机',

	TEAM_STATUS: 'int|true|default=0|comment=申请状态 0=等待 1=通过 2=拒绝',

	TEAM_ADD_TIME: 'int|true|comment=创建时间戳',
	TEAM_EDIT_TIME: 'int|true|comment=修改时间戳',
	TEAM_ADD_IP: 'string|false|comment=创建IP',
	TEAM_EDIT_IP: 'string|false|comment=修改IP',
};

// 字段前缀
TeamModel.FIELD_PREFIX = "TEAM_";

// 状态常量定义
TeamModel.STATUS = {
	PENDING: 0,  // 等待
	AGREED: 1,   // 通过
	REFUSED: 2   // 拒绝
};

// 状态描述
TeamModel.STATUS_DESC = {
	0: '等待',
	1: '通过',
	2: '拒绝'
};

module.exports = TeamModel;