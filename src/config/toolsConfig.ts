import type { ToolsConfig } from "../types/toolsConfig";

// ============================================================================
// 工具栏配置 - 前台小工具的唯一数据源
// 新增一个工具：在这里加一项 + 在 src/pages/tools/ 下建对应页面即可，
// 导航栏、移动端菜单、工具总览页都会自动同步。
// Tools Configuration - single source of truth for the front-end tools area
// ============================================================================
export const toolsConfig: ToolsConfig = {
	// 导航栏一级菜单
	navName: "工具",
	navIcon: "material-symbols:handyman-outline",
	navUrl: "/tools/",

	// 工具总览页
	title: "工具箱",
	description:
		"一些纯前端的小工具，全部在浏览器本地运行，文件不会上传到任何服务器。",
	showNavIcon: true,

	tools: [
		{
			id: "pdf-to-image",
			name: "PDF 转图片",
			description:
				"把 PDF 逐页导出为 PNG / JPEG / WebP，可自选清晰度与页码范围，支持单页下载或打包 ZIP。",
			url: "/tools/pdf-to-image/",
			icon: "material-symbols:picture-as-pdf-outline",
			tags: ["PDF", "图片"],
			enabled: true,
			ready: true,
			pageKey: "tools",
		},
		{
			id: "image-stitch",
			name: "图片拼接",
			description:
				"把多张图片自上而下拼成一张长图，可调整顺序、间距与横向对齐，适合拼接聊天记录、网页长截图、分镜稿。",
			url: "/tools/image-stitch/",
			icon: "material-symbols:view-agenda-outline",
			tags: ["图片", "拼接"],
			enabled: true,
			ready: true,
			pageKey: "tools",
		},
	],
};
