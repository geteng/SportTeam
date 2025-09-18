readme
app.json根据项目代码中app.json的pages配置及相关页面逻辑，项目共包含50 个页面，涵盖用户端功能、管理员端功能及基础组件页面，各页面作用如下：
一、用户端核心页面（14 个）
projects/placeone/pages/default/index/default_index
项目首页，展示体育场馆核心信息、可预订场地入口、最新通知等，是用户进入小程序的默认页面。
关于模块（2 个）
projects/placeone/pages/about/list/about_list：展示 “关于我们” 相关内容列表（如场馆介绍、规则说明等分类内容）。
projects/placeone/pages/about/index/about_index：“关于我们” 详情页，展示具体内容（如场馆简介、联系方式等）。
搜索页面
projects/placeone/pages/search/search：提供场地、通知等内容的搜索功能，支持搜索历史记录管理。
用户中心模块（5 个）
projects/placeone/pages/my/index/my_index：用户中心首页，展示个人信息、预订记录、收藏等入口。
projects/placeone/pages/my/reg/my_reg：用户注册页面，填写基本信息完成注册。
projects/placeone/pages/my/edit/my_edit：用户资料编辑页面，修改姓名、手机号等信息。
projects/placeone/pages/my/foot/my_foot：用户浏览足迹页面，记录曾查看的场地 / 内容。
projects/placeone/pages/my/fav/my_fav：用户收藏页面，展示收藏的场地或内容。
通知 / 新闻模块（4 个）
projects/placeone/pages/news/index/news_index：通知 / 新闻列表页，展示所有通知内容。
projects/placeone/pages/news/detail/news_detail：通知 / 新闻详情页，展示单条通知的完整内容。
projects/placeone/pages/news/cate1/news_cate1：通知分类 1 列表（如场馆公告）。
projects/placeone/pages/news/cate2/news_cate2：通知分类 2 列表（如活动通知）。
二、场地预订相关页面（5 个）
projects/placeone/pages/enroll/all/enroll_all：所有可预订场地列表页，展示各类型场地的基本信息。
projects/placeone/pages/enroll/join/enroll_join：场地预订提交页，用户选择时段后填写信息并提交预订。
projects/placeone/pages/enroll/my_join_list/enroll_my_join_list：我的预订列表页，展示用户所有预订记录（支持按状态筛选）。
projects/placeone/pages/enroll/my_join_detail/enroll_my_join_detail：我的预订详情页，展示单条预订的具体信息（含核销二维码）。
projects/placeone/pages/enroll/join_edit/enroll_join_edit：预订信息编辑页，修改已提交的预订信息（如联系人、手机号）。
三、管理员端页面（29 个）
1. 通知管理（3 个）
projects/placeone/pages/admin/news/list/admin_news_list：通知列表管理页，展示所有通知并提供编辑 / 删除入口。
projects/placeone/pages/admin/news/add/admin_news_add：新增通知页，发布新通知（含标题、内容、分类等）。
projects/placeone/pages/admin/news/edit/admin_news_edit：编辑通知页，修改已有通知的内容。
2. 系统设置（3 个）
projects/placeone/pages/admin/setup/about/admin_setup_about：“关于我们” 内容编辑页，修改场馆介绍等静态内容。
projects/placeone/pages/admin/setup/about_list/admin_setup_about_list：“关于我们” 内容列表管理页。
projects/placeone/pages/admin/setup/qr/admin_setup_qr：二维码设置页，管理场馆相关二维码（如公众号、导航码）。
3. 管理员账户管理（5 个）
projects/placeone/pages/admin/index/home/admin_home：管理员首页，展示系统数据概览。
projects/placeone/pages/admin/index/login/admin_login：管理员登录页，验证身份后进入管理后台。
projects/placeone/pages/admin/mgr/log/admin_log_list：管理员操作日志页，记录所有管理操作。
projects/placeone/pages/admin/mgr/edit/admin_mgr_edit：编辑管理员信息页。
projects/placeone/pages/admin/mgr/list/admin_mgr_list：管理员列表页，展示所有管理员账户。
projects/placeone/pages/admin/mgr/add/admin_mgr_add：新增管理员页，创建新的管理员账户。
projects/placeone/pages/admin/mgr/pwd/admin_mgr_pwd：管理员密码修改页。
4. 用户管理（3 个）
projects/placeone/pages/admin/user/list/admin_user_list：用户列表页，展示所有注册用户信息。
projects/placeone/pages/admin/user/detail/admin_user_detail：用户详情页，查看单个用户的资料和预订记录。
projects/placeone/pages/admin/user/export/admin_user_export：用户数据导出页，导出用户信息为文件（如 Excel）。
5. 场地预订管理（11 个）
projects/placeone/pages/admin/enroll/list/admin_enroll_list：场地列表管理页，展示所有可预订场地并提供编辑 / 删除入口。
projects/placeone/pages/admin/enroll/add/admin_enroll_add：新增场地页，添加新的可预订场地（设置类型、时段、价格等）。
projects/placeone/pages/admin/enroll/edit/admin_enroll_edit：编辑场地页，修改已有场地的信息。
projects/placeone/pages/admin/enroll/join_list/admin_enroll_join_list：预订记录列表页，展示所有用户的预订记录。
projects/placeone/pages/admin/enroll/export/admin_enroll_export：预订数据导出页，导出预订记录为文件。
projects/placeone/pages/admin/enroll/temp/admin_enroll_temp：场地模板管理页，管理场地预订的模板配置。
projects/placeone/pages/admin/enroll/day/admin_enroll_day：单日场地预订管理页，查看某一天的场地预订情况。
projects/placeone/pages/admin/enroll/record/admin_enroll_record：预订操作记录页，记录场地预订的变更日志。
projects/placeone/pages/admin/enroll/scan/admin_enroll_scan：扫码核销页，扫描用户预订二维码完成核销。
projects/placeone/pages/admin/enroll/flow/admin_enroll_flow：预订流程设置页，配置预订的规则（如取消政策）。
projects/placeone/pages/admin/enroll/notice/admin_enroll_notice：预订通知设置页，配置预订相关的通知模板。
projects/placeone/pages/admin/enroll/data/admin_enroll_data：预订数据统计页，展示场地预订的数据分析。
projects/placeone/pages/admin/enroll/join_detail/admin_enroll_join_detail：管理员视角的预订详情页，查看单个预订的完整信息。
6. 其他管理页
projects/placeone/pages/admin/content/admin_content：内容管理首页，统一管理系统内的各类内容（如通知、介绍）。
四、表单组件页面（2 个）
cmpts/public/form/form_set/field/form_set_field：表单字段设置组件页，用于配置预订或用户信息中的表单字段（如输入框、选择器）。
cmpts/public/form/form_show/content/form_show_content：表单内容展示组件页，用于展示已提交的表单数据。
总结
项目页面按角色分为用户端（核心为场地预订、个人中心、信息浏览）和管理员端（核心为内容管理、用户管理、场地预订管理），通过模块化设计实现了体育场馆预订的全流程功能。根据项目代码中app.json的pages配置及相关页面逻辑，项目共包含50 个页面，涵盖用户端功能、管理员端功能及基础组件页面，各页面作用如下：
一、用户端核心页面（14 个）
projects/placeone/pages/default/index/default_index
项目首页，展示体育场馆核心信息、可预订场地入口、最新通知等，是用户进入小程序的默认页面。
关于模块（2 个）
projects/placeone/pages/about/list/about_list：展示 “关于我们” 相关内容列表（如场馆介绍、规则说明等分类内容）。
projects/placeone/pages/about/index/about_index：“关于我们” 详情页，展示具体内容（如场馆简介、联系方式等）。
搜索页面
projects/placeone/pages/search/search：提供场地、通知等内容的搜索功能，支持搜索历史记录管理。
用户中心模块（5 个）
projects/placeone/pages/my/index/my_index：用户中心首页，展示个人信息、预订记录、收藏等入口。
projects/placeone/pages/my/reg/my_reg：用户注册页面，填写基本信息完成注册。
projects/placeone/pages/my/edit/my_edit：用户资料编辑页面，修改姓名、手机号等信息。
projects/placeone/pages/my/foot/my_foot：用户浏览足迹页面，记录曾查看的场地 / 内容。
projects/placeone/pages/my/fav/my_fav：用户收藏页面，展示收藏的场地或内容。
通知 / 新闻模块（4 个）
projects/placeone/pages/news/index/news_index：通知 / 新闻列表页，展示所有通知内容。
projects/placeone/pages/news/detail/news_detail：通知 / 新闻详情页，展示单条通知的完整内容。
projects/placeone/pages/news/cate1/news_cate1：通知分类 1 列表（如场馆公告）。
projects/placeone/pages/news/cate2/news_cate2：通知分类 2 列表（如活动通知）。
二、场地预订相关页面（5 个）
projects/placeone/pages/enroll/all/enroll_all：所有可预订场地列表页，展示各类型场地的基本信息。
projects/placeone/pages/enroll/join/enroll_join：场地预订提交页，用户选择时段后填写信息并提交预订。
projects/placeone/pages/enroll/my_join_list/enroll_my_join_list：我的预订列表页，展示用户所有预订记录（支持按状态筛选）。
projects/placeone/pages/enroll/my_join_detail/enroll_my_join_detail：我的预订详情页，展示单条预订的具体信息（含核销二维码）。
projects/placeone/pages/enroll/join_edit/enroll_join_edit：预订信息编辑页，修改已提交的预订信息（如联系人、手机号）。
三、管理员端页面（29 个）
1. 通知管理（3 个）
projects/placeone/pages/admin/news/list/admin_news_list：通知列表管理页，展示所有通知并提供编辑 / 删除入口。
projects/placeone/pages/admin/news/add/admin_news_add：新增通知页，发布新通知（含标题、内容、分类等）。
projects/placeone/pages/admin/news/edit/admin_news_edit：编辑通知页，修改已有通知的内容。
2. 系统设置（3 个）
projects/placeone/pages/admin/setup/about/admin_setup_about：“关于我们” 内容编辑页，修改场馆介绍等静态内容。
projects/placeone/pages/admin/setup/about_list/admin_setup_about_list：“关于我们” 内容列表管理页。
projects/placeone/pages/admin/setup/qr/admin_setup_qr：二维码设置页，管理场馆相关二维码（如公众号、导航码）。
3. 管理员账户管理（5 个）
projects/placeone/pages/admin/index/home/admin_home：管理员首页，展示系统数据概览。
projects/placeone/pages/admin/index/login/admin_login：管理员登录页，验证身份后进入管理后台。
projects/placeone/pages/admin/mgr/log/admin_log_list：管理员操作日志页，记录所有管理操作。
projects/placeone/pages/admin/mgr/edit/admin_mgr_edit：编辑管理员信息页。
projects/placeone/pages/admin/mgr/list/admin_mgr_list：管理员列表页，展示所有管理员账户。
projects/placeone/pages/admin/mgr/add/admin_mgr_add：新增管理员页，创建新的管理员账户。
projects/placeone/pages/admin/mgr/pwd/admin_mgr_pwd：管理员密码修改页。
4. 用户管理（3 个）
projects/placeone/pages/admin/user/list/admin_user_list：用户列表页，展示所有注册用户信息。
projects/placeone/pages/admin/user/detail/admin_user_detail：用户详情页，查看单个用户的资料和预订记录。
projects/placeone/pages/admin/user/export/admin_user_export：用户数据导出页，导出用户信息为文件（如 Excel）。
5. 场地预订管理（11 个）
projects/placeone/pages/admin/enroll/list/admin_enroll_list：场地列表管理页，展示所有可预订场地并提供编辑 / 删除入口。
projects/placeone/pages/admin/enroll/add/admin_enroll_add：新增场地页，添加新的可预订场地（设置类型、时段、价格等）。
projects/placeone/pages/admin/enroll/edit/admin_enroll_edit：编辑场地页，修改已有场地的信息。
projects/placeone/pages/admin/enroll/join_list/admin_enroll_join_list：预订记录列表页，展示所有用户的预订记录。
projects/placeone/pages/admin/enroll/export/admin_enroll_export：预订数据导出页，导出预订记录为文件。
projects/placeone/pages/admin/enroll/temp/admin_enroll_temp：场地模板管理页，管理场地预订的模板配置。
projects/placeone/pages/admin/enroll/day/admin_enroll_day：单日场地预订管理页，查看某一天的场地预订情况。
projects/placeone/pages/admin/enroll/record/admin_enroll_record：预订操作记录页，记录场地预订的变更日志。
projects/placeone/pages/admin/enroll/scan/admin_enroll_scan：扫码核销页，扫描用户预订二维码完成核销。
projects/placeone/pages/admin/enroll/flow/admin_enroll_flow：预订流程设置页，配置预订的规则（如取消政策）。
projects/placeone/pages/admin/enroll/notice/admin_enroll_notice：预订通知设置页，配置预订相关的通知模板。
projects/placeone/pages/admin/enroll/data/admin_enroll_data：预订数据统计页，展示场地预订的数据分析。
projects/placeone/pages/admin/enroll/join_detail/admin_enroll_join_detail：管理员视角的预订详情页，查看单个预订的完整信息。
6. 其他管理页
projects/placeone/pages/admin/content/admin_content：内容管理首页，统一管理系统内的各类内容（如通知、介绍）。
四、表单组件页面（2 个）
cmpts/public/form/form_set/field/form_set_field：表单字段设置组件页，用于配置预订或用户信息中的表单字段（如输入框、选择器）。
cmpts/public/form/form_show/content/form_show_content：表单内容展示组件页，用于展示已提交的表单数据。
总结
项目页面按角色分为用户端（核心为场地预订、个人中心、信息浏览）和管理员端（核心为内容管理、用户管理、场地预订管理），通过模块化设计实现了体育场馆预订的全流程功能。