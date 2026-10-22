import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";
import { toolsConfig } from "./toolsConfig";

// ============================================================================
// 导航栏配置 - 根据顺序动态生成导航栏链接
// NavBar Configuration - Dynamically generate navigation bar links based on order
// ============================================================================
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: NavBarLink[] = [
		// 主页
		LinkPresets.Home,
	];

	// 文章及其子菜单
	links.push({
		name: "文章",
		url: "#",
		icon: "material-symbols:article",
		children: [
			// 归档
			LinkPresets.Archive,

			// 分类
			LinkPresets.Categories,

			// 标签
			LinkPresets.Tags,
		],
	});

	// 友链
	links.push(LinkPresets.Friends);

	// 留言板
	links.push(LinkPresets.Guestbook);

	// 工具（功能区）- 菜单项由 toolsConfig 自动生成，无需在这里重复维护
	const enabledTools = toolsConfig.tools.filter(
		(tool) => tool.enabled !== false,
	);

	if (enabledTools.length > 0) {
		// 注意：顶栏中心菜单在 1440px 宽度下已经顶到预算（再多一项文字就会换行），
		// 所以这里只放一个"工具"入口指向工具箱总览页，不再展开下拉子菜单，
		// 具体工具有哪些交给 /tools/ 页面用卡片展示。
		links.push({
			name: toolsConfig.navName,
			url: toolsConfig.navUrl ?? "/tools/",
			icon: toolsConfig.showNavIcon === false ? undefined : toolsConfig.navIcon,
		});
	}

	// 我的及其子菜单
	links.push({
		name: "我的",
		url: "#",
		icon: "material-symbols:person",
		children: [
			// 相册
			LinkPresets.Gallery,

			// 追番
			LinkPresets.Anime,

			// 番组计划
			LinkPresets.Bangumi,
		],
	});

	// 关于及其子菜单
	links.push({
		name: "关于",
		url: "#",
		icon: "material-symbols:info",
		children: [
			// 打赏
			LinkPresets.Sponsor,

			// 关于页面
			LinkPresets.About,
		],
	});

	// 自定义导航栏链接
	links.push({
		name: "链接",
		url: "#",
		icon: "material-symbols:link",
		// 子菜单
		children: [
			{
				name: "GitHub",
				url: "https://github.com/DaydreamV7",
				external: true,
				icon: "fa7-brands:github",
			},
			// {
			// 	name: "Gitee",
			// 	url: "https://gitee.com/CuteLeaf/Firefly",
			// 	external: true,
			// 	icon: "fa7-brands:gitee",
			// },
			// {
			// 	name: "QQ交流群",
			// 	url: "https://qm.qq.com/q/ZGsFa8qX2G",
			// 	external: true,
			// 	icon: "fa7-brands:qq",
			// },
			{
				name: "Firefly使用文档",
				url: "https://docs-firefly.cuteleaf.cn/",
				external: true,
			},
		],
	});

	// 文档链接
	// links.push({
	// 	name: "文档",
	// 	url: "https://docs-firefly.cuteleaf.cn",
	// 	external: true,
	// 	icon: "material-symbols:docs",
	// });

	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

// ============================================================================
// 链接预设 - 可自由自定义导航栏链接的名称、图标和URL
// Link Presets - Allows free customization of the name, icon, and URL of navigation bar links
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "主页",
		url: "/",
		icon: "material-symbols:home",
	},
	Archive: {
		name: "归档",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Categories: {
		name: "分类",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Tags: {
		name: "标签",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	Friends: {
		name: "友链",
		url: "/friends/",
		icon: "material-symbols:group",
		pageKey: "friends",
	},
	Sponsor: {
		name: "打赏",
		url: "/sponsor/",
		icon: "material-symbols:favorite",
		pageKey: "sponsor",
	},
	Guestbook: {
		name: "留言",
		url: "/guestbook/",
		icon: "material-symbols:chat",
		pageKey: "guestbook",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Bangumi: {
		name: "番组计划",
		url: "/bangumi/",
		icon: "material-symbols:movie",
		pageKey: "bangumi",
	},
	Gallery: {
		name: "相册",
		url: "/gallery/",
		icon: "material-symbols:photo-library",
		pageKey: "gallery",
	},
	Anime: {
		name: "追番",
		url: "/anime/",
		icon: "material-symbols:live-tv",
		pageKey: "anime",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
