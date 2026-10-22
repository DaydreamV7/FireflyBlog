// 工具栏类型定义 - 前台小工具的注册表结构
// Tools type definitions - registry structure for the front-end tools area

export type ToolItem = {
	/** 唯一标识，用于 key 与下载文件名等 */
	id: string;
	/** 工具名称，显示在导航菜单与工具卡片上 */
	name: string;
	/** 一句话说明，显示在工具卡片上 */
	description: string;
	/** 工具页面地址，如 "/tools/pdf-to-image/" */
	url: string;
	/** 图标（Iconify 名称，如 material-symbols:picture-as-pdf-outline） */
	icon?: string;
	/** 标签，用于卡片上的分类标识 */
	tags?: string[];
	/** 是否启用，false 时不会出现在导航栏与工具列表中 */
	enabled?: boolean;
	/** 是否已经实现完毕，false 时卡片显示"即将上线" */
	ready?: boolean;
	/** 关联 siteConfig.pages 的开关 key，默认 "tools" */
	pageKey?: string;
};

export type ToolsConfig = {
	/** 导航栏一级菜单名称 */
	navName: string;
	/** 导航栏一级菜单图标 */
	navIcon?: string;
	/** 导航栏一级菜单地址（无子菜单时使用） */
	navUrl?: string;
	/** 工具总览页标题 */
	title: string;
	/** 工具总览页简介 */
	description: string;
	/** 是否在导航栏入口显示图标，默认显示（设为 false 可再省一点顶栏宽度） */
	showNavIcon?: boolean;
	/** 工具列表 */
	tools: ToolItem[];
};
