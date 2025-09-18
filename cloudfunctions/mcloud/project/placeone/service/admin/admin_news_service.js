/**
 * Notes: 资讯后台管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY gttt999 (wechat)
 * Date: 2021-07-11 07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const AdminHomeService = require('../admin/admin_home_service.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const util = require('../../../../framework/utils/util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const cloudUtil = require('../../../../framework/cloud/cloud_util.js');

const NewsModel = require('../../model/news_model.js');

class AdminNewsService extends BaseProjectAdminService {


	/**添加资讯 */
	async insertNews({
		title,
		cateId, //分类
		cateName,
		order,
		desc = '',
		forms
	}) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 准备基础数据
    const now = timeUtil.time();
    const data = {
      _pid: this.getProjectId(), // 项目ID
      NEWS_TITLE: title,
      NEWS_DESC: desc,
      NEWS_CATE_ID: cateId,
      NEWS_CATE_NAME: cateName,
      NEWS_ORDER: order || 9999, // 默认排序值
      NEWS_STATUS: 1, // 默认启用状态
      NEWS_VOUCH: 0, // 默认不推荐到首页
      NEWS_FORMS: forms || [],
      NEWS_OBJ: {}, // 预留对象字段
      NEWS_CONTENT: [], // 初始化为空富文本
      NEWS_PIC: [], // 初始化为空图片数组
      NEWS_VIEW_CNT: 0, // 初始浏览量
      NEWS_ADD_TIME: now,
      NEWS_EDIT_TIME: now,
      NEWS_ADD_IP: this._ip,
      NEWS_EDIT_IP: this._ip
    };

    // 2. 检查标题唯一性（同一分类下标题不重复）
    const titleCount = await NewsModel.count({
      NEWS_TITLE: title,
      NEWS_CATE_ID: cateId,
      _pid: this.getProjectId()
    });
    if (titleCount > 0) {
      this.AppError(`分类「${cateName}」下已存在相同标题的资讯`);
    }

    // 3. 执行插入操作
    const result = await NewsModel.insert(data);

    // 4. 如果是置顶排序（order=0），同步更新首页推荐状态
    if (order === 0) {
      const homeService = new AdminHomeService();
      await homeService.updateHomeVouch({
        id: result._id,
        type: 'news',
        title: title,
        pic: data.NEWS_PIC[0] || '',
        ext: cateId
      });
    }

    return result;
	}

	/**删除资讯数据 */
	async delNews(id) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证资讯是否存在
    const news = await NewsModel.getOne({ _id: id, _pid: this.getProjectId() }, 'NEWS_TITLE, NEWS_VOUCH');
    if (!news) {
        this.AppError('该资讯不存在或已被删除');
    }

    // 2. 如果是首页推荐资讯，同步移除首页推荐
    if (news.NEWS_VOUCH === 1) {
        const homeService = new AdminHomeService();
        await homeService.delHomeVouch(id);
    }

    // 3. 执行删除操作（仅删除当前项目下的数据）
    await NewsModel.del({
        _id: id,
        _pid: this.getProjectId()
    });

    // 4. 记录操作日志
    // this.insertLog(
    //     `删除了资讯《${news.NEWS_TITLE}》`,
    //     await this.getAdminInfo(), // 获取当前管理员信息
    //     LogModel.TYPE.SYS
    // );
	}

	/**获取资讯信息 */
	async getNewsDetail(id) {
		let fields = '*';

		let where = {
			_id: id
		}
		let news = await NewsModel.getOne(where, fields);
		if (!news) return null;

		return news;
	}

	// 更新forms信息
	async updateNewsForms({
		id,
		hasImageForms
	}) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 处理表单数据（转换为对象格式便于查询）
    const newsObj = dataUtil.dbForms2Obj(hasImageForms);

    // 3. 准备更新数据
    const data = {
      NEWS_FORMS: hasImageForms, // 保存原始表单结构
      NEWS_OBJ: newsObj, // 转换为对象用于快速查询
      NEWS_EDIT_TIME: timeUtil.time(), // 更新修改时间
      NEWS_EDIT_IP: this._ip // 记录操作IP
    };

    // 4. 执行更新操作
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);
	}


	/**
	 * 更新富文本详细的内容及图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateNewsContent({
		id,
		content // 富文本数组
	}) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE, NEWS_CONTENT');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 处理富文本中的图片资源（清理旧图、保留新图）
    await cloudUtil.handlerCloudFilesByRichEditor(
      news.NEWS_CONTENT || [], // 旧内容
      content // 新内容
    );

    // 3. 提取富文本中的图片URL列表用于返回
    const urls = [];
    content.forEach(item => {
      if (item.type === 'image' && item.val) {
        urls.push(item.val);
      }
    });

    // 4. 准备更新数据
    const data = {
      NEWS_CONTENT: content,
      NEWS_EDIT_TIME: timeUtil.time(),
      NEWS_EDIT_IP: this._ip
    };

    // 5. 执行更新操作（限定当前项目）
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);

    // 6. 记录操作日志
    // this.insertLog(
    //   `更新了资讯《${news.NEWS_TITLE}》的富文本内容`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );

    return urls;

	}

	/**
	 * 更新资讯图片信息
	 * @returns 返回 urls数组 [url1, url2, url3, ...]
	 */
	async updateNewsPic({
		id,
		imgList // 图片数组
	}) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE, NEWS_PIC, NEWS_VOUCH');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 处理图片资源（清理旧图、保留新图）
    await cloudUtil.handlerCloudFiles(
      news.NEWS_PIC || [], // 旧图片列表
      imgList // 新图片列表
    );

    // 3. 准备更新数据
    const data = {
      NEWS_PIC: imgList,
      NEWS_EDIT_TIME: timeUtil.time(),
      NEWS_EDIT_IP: this._ip
    };

    // 4. 执行更新操作（限定当前项目）
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);

    // 5. 如果是首页推荐资讯，同步更新首页推荐的图片
    if (news.NEWS_VOUCH === 1) {
      const homeService = new AdminHomeService();
      await homeService.updateHomeVouch({
        id: id,
        type: 'news',
        title: news.NEWS_TITLE,
        pic: imgList[0] || '', // 取第一张图作为首页展示图
        ext: news.NEWS_CATE_ID
      });
    }

    // 6. 记录操作日志
    // this.insertLog(
    //   `更新了资讯《${news.NEWS_TITLE}》的图片，共${imgList.length}张`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );

    return imgList;
	}


	/**更新资讯数据 */
	async editNews({
		id,
		title,
		cateId, //分类
		cateName,
		order,
		desc = '',
		forms
	}) {
    // this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
      // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE, NEWS_VOUCH');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 处理表单数据（转换为对象格式便于查询）
    const newsObj = dataUtil.dbForms2Obj(forms || []);

    // 3. 准备更新数据
    const data = {
      NEWS_TITLE: title,
      NEWS_CATE_ID: cateId,
      NEWS_CATE_NAME: cateName,
      NEWS_ORDER: order,
      NEWS_DESC: desc,
      NEWS_FORMS: forms || [],
      NEWS_OBJ: newsObj,
      NEWS_EDIT_TIME: timeUtil.time(), // 更新修改时间
      NEWS_EDIT_IP: this._ip // 记录操作IP
    };

    // 4. 执行更新操作（限定当前项目）
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);

    // 5. 如果是首页推荐资讯，同步更新首页推荐信息
    if (news.NEWS_VOUCH === 1) {
      const homeService = new AdminHomeService();
      await homeService.updateHomeVouch({
        id: id,
        type: 'news',
        title: title,
        pic: news.NEWS_PIC?.[0] || '', // 保留原首图
        ext: cateId
      });
    }

    // 6. 记录操作日志
    // this.insertLog(
    //   `修改了资讯《${title}》`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );
	}

	/**取得资讯分页列表 */
	async getAdminNewsList({
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

		orderBy = orderBy || {
			'NEWS_ORDER': 'asc',
			'NEWS_ADD_TIME': 'desc'
		};
		let fields = 'NEWS_TITLE,NEWS_DESC,NEWS_CATE_ID,NEWS_CATE_NAME,NEWS_EDIT_TIME,NEWS_ADD_TIME,NEWS_ORDER,NEWS_STATUS,NEWS_CATE2_NAME,NEWS_VOUCH,NEWS_QR,NEWS_OBJ';

		let where = {};
		where.and = {
			_pid: this.getProjectId() //复杂的查询在此处标注PID
		};

		if (util.isDefined(search) && search) {
			where.or = [
				{ NEWS_TITLE: ['like', search] },
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'cateId': {
					where.and.NEWS_CATE_ID = String(sortVal);
					break;
				}
				case 'status': {
					where.and.NEWS_STATUS = Number(sortVal);
					break;
				}
				case 'vouch': {
					where.and.NEWS_VOUCH = 1;
					break;
				}
				case 'top': {
					where.and.NEWS_ORDER = 0;
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'NEWS_ADD_TIME');
					break;
				}

			}
		}

		return await NewsModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
	}

    /**修改资讯状态 */
  async statusNews(id, status) {
    // 	this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 准备更新数据
    const data = {
      NEWS_STATUS: status,
      NEWS_EDIT_TIME: timeUtil.time(),
      NEWS_EDIT_IP: this._ip
    };

    // 3. 执行更新操作（限定当前项目）
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);

    // 4. 记录操作日志
    // this.insertLog(
    //   `将资讯《${news.NEWS_TITLE}》状态修改为${status === 1 ? '启用' : '禁用'}`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );
  }

  /**置顶与排序设定 */
  async sortNews(id, sort) {
    // 	this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 准备更新数据（排序值通常0为置顶，数字越大排序越靠后）
    const data = {
      NEWS_ORDER: sort,
      NEWS_EDIT_TIME: timeUtil.time(),
      NEWS_EDIT_IP: this._ip
    };

    // 3. 执行更新操作（限定当前项目）
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);

    // 4. 记录操作日志
    // this.insertLog(
    //   `将资讯《${news.NEWS_TITLE}》排序值设置为${sort}`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );
  }

  /**首页设定 */
  async vouchNews(id, vouch) {
    // 	this.AppError('[场地预订P]该功能暂不开放，如有需要请加作者微信：gttt999');
    // 1. 验证资讯是否存在且属于当前项目
    const news = await NewsModel.getOne({
      _id: id,
      _pid: this.getProjectId()
    }, 'NEWS_TITLE, NEWS_PIC, NEWS_CATE_ID');
    if (!news) {
      this.AppError('该资讯不存在或已被删除');
    }

    // 2. 准备更新数据（1=首页推荐，0=取消推荐）
    const data = {
      NEWS_VOUCH: vouch,
      NEWS_EDIT_TIME: timeUtil.time(),
      NEWS_EDIT_IP: this._ip
    };

    // 3. 执行更新操作（限定当前项目）
    await NewsModel.edit({
      _id: id,
      _pid: this.getProjectId()
    }, data);

    // 4. 同步首页推荐数据
    const homeService = new AdminHomeService();
    if (vouch === 1) {
      // 添加到首页推荐
      await homeService.updateHomeVouch({
        id: id,
        type: 'news',
        title: news.NEWS_TITLE,
        pic: news.NEWS_PIC?.[0] || '', // 取第一张图作为首页展示图
        ext: news.NEWS_CATE_ID
      });
    } else {
      // 从首页推荐移除
      await homeService.delHomeVouch(id);
    }

    // 5. 记录操作日志
    // this.insertLog(
    //   `将资讯《${news.NEWS_TITLE}》${vouch === 1 ? '添加到' : '移除出'}首页推荐`,
    //   await this.getAdminInfo(),
    //   LogModel.TYPE.SYS
    // );
  }
}

module.exports = AdminNewsService;