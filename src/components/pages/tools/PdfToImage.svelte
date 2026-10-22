<script lang="ts">
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { onDestroy } from "svelte";
import Icon from "@/components/common/Icon.svelte";

type OutputFormat = "png" | "jpeg" | "webp";

interface FormatOption {
	value: OutputFormat;
	label: string;
	mime: string;
	ext: string;
}

interface DpiOption {
	value: number;
	label: string;
}

interface RenderedPage {
	pageNumber: number;
	blob: Blob;
	url: string;
	width: number;
	height: number;
}

const FORMAT_OPTIONS: FormatOption[] = [
	{ value: "png", label: "PNG（无损，体积大）", mime: "image/png", ext: "png" },
	{
		value: "jpeg",
		label: "JPEG（有损，体积小）",
		mime: "image/jpeg",
		ext: "jpg",
	},
	{ value: "webp", label: "WebP（体积最小）", mime: "image/webp", ext: "webp" },
];

const DPI_OPTIONS: DpiOption[] = [
	{ value: 150, label: "标准 150 DPI（屏幕阅读）" },
	{ value: 300, label: "高清 300 DPI（打印 / 放大）" },
	{ value: 72, label: "原始 72 DPI（最省内存）" },
];

const MAX_DIRECT_PAGES = 60;

// pdfDocument 参与模板（按钮 disabled 状态），必须用 $state.raw 让它可被追踪；
// 用 raw 避免 Svelte 深度代理 pdf.js 内部对象。
let pdfDocument: PDFDocumentProxy | null = $state.raw(null);
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
let currentFile: File | null = null;

let fileName = $state("");
let pageCount = $state(0);
let fileSize = $state(0);
let loading = $state(false);
let converting = $state(false);
let zipping = $state(false);
let isDragging = $state(false);
let needsPassword = $state(false);
let password = $state("");
let errorMessage = $state("");
let format = $state<OutputFormat>("png");
let dpi = $state(150);
let rangeInput = $state("");
let doneCount = $state(0);
let totalCount = $state(0);
let pages = $state<RenderedPage[]>([]);
let fileInput: HTMLInputElement | undefined = $state(undefined);

const isBusy = $derived(loading || converting || zipping);
const progressPercent = $derived(
	totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100),
);
const selectedFormat = $derived(
	FORMAT_OPTIONS.find((option) => option.value === format) ?? FORMAT_OPTIONS[0],
);
const baseName = $derived(fileName.replace(/\.pdf$/i, "") || "document");

/** 懒加载 pdf.js，只在真正需要解析 PDF 时才下载解析器与 worker */
async function loadPdfJs(): Promise<typeof import("pdfjs-dist")> {
	if (!pdfjsPromise) {
		pdfjsPromise = (async () => {
			const pdfjs = await import("pdfjs-dist");
			pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
			return pdfjs;
		})();
	}
	return pdfjsPromise;
}

function clearResults(): void {
	for (const page of pages) {
		URL.revokeObjectURL(page.url);
	}
	pages = [];
	doneCount = 0;
	totalCount = 0;
}

function resetAll(): void {
	clearResults();
	pdfDocument?.destroy();
	pdfDocument = null;
	fileName = "";
	pageCount = 0;
	fileSize = 0;
	rangeInput = "";
	password = "";
	needsPassword = false;
	errorMessage = "";
	if (fileInput) fileInput.value = "";
}

async function openPdf(file: File): Promise<void> {
	if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
		errorMessage = "请选择 PDF 文件。";
		return;
	}

	clearResults();
	errorMessage = "";
	needsPassword = false;
	currentFile = file;
	fileName = file.name;
	fileSize = file.size;
	pageCount = 0;
	loading = true;

	try {
		const pdfjs = await loadPdfJs();
		const bytes = new Uint8Array(await file.arrayBuffer());
		pdfDocument?.destroy();
		pdfDocument = await pdfjs.getDocument({
			data: bytes,
			password: password || undefined,
		}).promise;
		pageCount = pdfDocument.numPages;
	} catch (error) {
		pdfDocument = null;
		const name = (error as { name?: string }).name;
		if (name === "PasswordException") {
			needsPassword = true;
			errorMessage = "这个 PDF 有密码保护，请输入密码后重试。";
		} else {
			errorMessage = `解析失败：${(error as Error).message || "文件可能已损坏"}`;
		}
	} finally {
		loading = false;
	}
}

async function retryWithPassword(): Promise<void> {
	if (!currentFile) return;
	await openPdf(currentFile);
}

function onFileChange(event: Event): void {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (file) openPdf(file);
}

function onDrop(event: DragEvent): void {
	event.preventDefault();
	isDragging = false;
	const file = event.dataTransfer?.files?.[0];
	if (file) openPdf(file);
}

function onDragOver(event: DragEvent): void {
	event.preventDefault();
	isDragging = true;
}

function onDragLeave(): void {
	isDragging = false;
}

/** 解析 "1-3,5,7-" 这样的页码范围，留空代表全部页 */
function parsePageRange(input: string, total: number): number[] | null {
	const trimmed = input.trim();
	if (!trimmed) {
		return Array.from({ length: total }, (_, index) => index + 1);
	}

	const result = new Set<number>();
	for (const part of trimmed.split(/[,，;；\s]+/).filter(Boolean)) {
		const match = part.match(/^(\d+)(?:[-~](\d*))?$/);
		if (!match) return null;

		const start = Number.parseInt(match[1], 10);
		const isRange = part.includes("-") || part.includes("~");
		const endText = match[2];
		const end = isRange
			? endText
				? Number.parseInt(endText, 10)
				: total
			: start;

		const from = Math.max(1, Math.min(start, end));
		const to = Math.min(total, Math.max(start, end));
		for (let page = from; page <= to; page++) result.add(page);
	}

	if (result.size === 0) return null;
	return [...result].sort((a, b) => a - b);
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) resolve(blob);
				else reject(new Error("导出图片失败"));
			},
			mime,
			0.92,
		);
	});
}

async function convert(): Promise<void> {
	if (!pdfDocument || converting) return;

	const targets = parsePageRange(rangeInput, pageCount);
	if (!targets) {
		errorMessage = '页码范围格式不正确，示例："1-3,5,7-" ，留空表示全部页。';
		return;
	}

	errorMessage = "";
	clearResults();
	converting = true;
	totalCount = targets.length;

	const scale = dpi / 72;
	const formatOption = selectedFormat;

	try {
		for (const pageNumber of targets) {
			const page = await pdfDocument.getPage(pageNumber);
			const viewport = page.getViewport({ scale });
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.floor(viewport.width));
			canvas.height = Math.max(1, Math.floor(viewport.height));

			const context = canvas.getContext("2d");
			if (!context) throw new Error("当前浏览器不支持 Canvas 导出");

			// JPEG / WebP 没有透明通道，先铺白底，避免出现黑底
			if (formatOption.value !== "png") {
				context.fillStyle = "#ffffff";
				context.fillRect(0, 0, canvas.width, canvas.height);
			}

			await page.render({ canvas, viewport }).promise;
			const blob = await canvasToBlob(canvas, formatOption.mime);

			pages = [
				...pages,
				{
					pageNumber,
					blob,
					url: URL.createObjectURL(blob),
					width: canvas.width,
					height: canvas.height,
				},
			];

			page.cleanup();
			canvas.width = 0;
			canvas.height = 0;
			doneCount = pages.length;

			// 让出主线程，保证进度条与缩略图能及时绘制
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	} catch (error) {
		errorMessage = `转换中断：${(error as Error).message}`;
	} finally {
		converting = false;
	}
}

function buildFileName(pageNumber: number): string {
	const padding = String(pageCount).length;
	const safeBase = baseName.replace(/[\\/:*?"<>|]/g, "_");
	return `${safeBase}-p${String(pageNumber).padStart(padding, "0")}.${selectedFormat.ext}`;
}

function downloadBlob(blob: Blob, name: string): void {
	const anchor = document.createElement("a");
	const objectUrl = URL.createObjectURL(blob);
	anchor.href = objectUrl;
	anchor.download = name;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function downloadPage(page: RenderedPage): void {
	downloadBlob(page.blob, buildFileName(page.pageNumber));
}

async function downloadZip(): Promise<void> {
	if (pages.length === 0 || zipping) return;
	zipping = true;
	errorMessage = "";
	try {
		const { default: JSZip } = await import("jszip");
		const zip = new JSZip();
		for (const page of pages) {
			zip.file(buildFileName(page.pageNumber), page.blob);
		}
		const blob = await zip.generateAsync({
			type: "blob",
			compression: "STORE",
		});
		const safeBase = baseName.replace(/[\\/:*?"<>|]/g, "_");
		downloadBlob(blob, `${safeBase}-images.zip`);
	} catch (error) {
		errorMessage = `打包失败：${(error as Error).message}`;
	} finally {
		zipping = false;
	}
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

onDestroy(() => {
	clearResults();
	pdfDocument?.destroy();
});
</script>

<div class="space-y-5">
	<input
		type="file"
		accept="application/pdf,.pdf"
		class="hidden"
		bind:this={fileInput}
		onchange={onFileChange}
	/>

	<!-- 上传区 -->
	<button
		type="button"
		class={[
			"group w-full rounded-(--radius-large) border-2 border-dashed px-6 py-9 transition-colors",
			isDragging
				? "border-(--primary) bg-(--btn-regular-bg)"
				: "border-(--line-divider) hover:border-(--primary) hover:bg-(--btn-regular-bg)",
		].join(" ")}
		onclick={() => fileInput?.click()}
		ondrop={onDrop}
		ondragover={onDragOver}
		ondragleave={onDragLeave}
	>
		<div class="flex flex-col items-center gap-2 text-center">
			<Icon
				icon="material-symbols:upload-file"
				class="text-3xl text-(--primary)"
			/>
			<span class="text-90 font-bold">
				{fileName ? "重新选择 / 拖入另一个 PDF" : "点击选择 或 拖拽 PDF 到这里"}
			</span>
			<span class="text-50 text-sm">
				文件只在你的浏览器里解析，不会上传到服务器
			</span>
		</div>
	</button>

	{#if fileName}
		<div
			class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-(--btn-regular-bg) px-4 py-3 text-sm"
		>
			<span class="text-90 font-bold break-all">{fileName}</span>
			<span class="text-50">{formatBytes(fileSize)}</span>
			{#if pageCount > 0}
				<span class="text-50">共 {pageCount} 页</span>
			{/if}
			{#if loading}
				<Icon
					icon="svg-spinners:ring-resize"
					class="text-base text-(--primary)"
				/>
			{/if}
		</div>
	{/if}

	{#if needsPassword}
		<div class="flex flex-wrap items-end gap-3">
			<label class="flex-1 min-w-56">
				<span class="text-75 text-sm mb-1 block">PDF 密码</span>
				<input
					type="password"
					bind:value={password}
					class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10"
					placeholder="输入密码后重新选择该文件"
				/>
			</label>
			<button
				type="button"
				class="btn-regular h-10 rounded-lg px-4 text-sm font-bold"
				onclick={retryWithPassword}
			>
				重新选择文件
			</button>
		</div>
	{/if}

	<!-- 选项区 -->
	<div class="grid gap-3 sm:grid-cols-3">
		<label class="block">
			<span class="text-75 text-sm mb-1 block">输出格式</span>
			<select
				bind:value={format}
				class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10 dark:bg-(--card-bg)"
			>
				{#each FORMAT_OPTIONS as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>

		<label class="block">
			<span class="text-75 text-sm mb-1 block">清晰度</span>
			<select
				bind:value={dpi}
				class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10 dark:bg-(--card-bg)"
			>
				{#each DPI_OPTIONS as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>

		<label class="block">
			<span class="text-75 text-sm mb-1 block">页码范围（留空为全部）</span>
			<input
				type="text"
				bind:value={rangeInput}
				placeholder="1-3,5,7-"
				class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10"
			/>
		</label>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		<button
			type="button"
			class="btn-regular h-11 rounded-lg px-5 font-bold"
			disabled={!pdfDocument || isBusy}
			class:opacity-50={!pdfDocument || isBusy}
			onclick={convert}
		>
			<Icon icon="material-symbols:picture-as-pdf-outline" class="mr-2 text-lg" />
			{converting ? "转换中…" : "开始转换"}
		</button>

		{#if pageCount > 0}
			<button
				type="button"
				class="btn-plain h-11 rounded-lg px-4 text-sm font-bold"
				onclick={resetAll}
				disabled={isBusy}
			>
				清空重置
			</button>
		{/if}

		{#if pageCount > MAX_DIRECT_PAGES}
			<span class="text-50 text-xs">
				页数较多（{pageCount} 页），建议先用页码范围分批转换
			</span>
		{/if}
	</div>

	{#if converting || (totalCount > 0 && doneCount < totalCount)}
		<div class="space-y-1">
			<div class="h-1.5 overflow-hidden rounded-full bg-(--btn-regular-bg)">
				<div
					class="h-full bg-(--primary) transition-all duration-150"
					style={`width: ${progressPercent}%`}
				></div>
			</div>
			<p class="text-50 text-xs">已渲染 {doneCount} / {totalCount} 页</p>
		</div>
	{/if}

	{#if errorMessage}
		<p class="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">
			{errorMessage}
		</p>
	{/if}

	<!-- 结果区 -->
	{#if pages.length > 0}
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-(--line-divider) pt-4">
			<span class="text-90 font-bold">已生成 {pages.length} 张图片</span>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="btn-regular h-10 rounded-lg px-4 text-sm font-bold"
					disabled={zipping}
					class:opacity-50={zipping}
					onclick={downloadZip}
				>
					<Icon icon="material-symbols:folder-zip" class="mr-2 text-lg" />
					{zipping ? "打包中…" : "打包下载 ZIP"}
				</button>
				<button
					type="button"
					class="btn-plain h-10 rounded-lg px-3 text-sm"
					onclick={clearResults}
				>
					清除结果
				</button>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
			{#each pages as page (page.pageNumber)}
				<div class="overflow-hidden rounded-lg border border-(--line-divider)">
					<img
						src={page.url}
						alt={`第 ${page.pageNumber} 页`}
						class="h-40 w-full bg-(--btn-regular-bg) object-contain"
						loading="lazy"
					/>
					<div class="flex items-center justify-between gap-2 px-2 py-1.5">
						<span class="text-50 text-xs">
							第 {page.pageNumber} 页 · {formatBytes(page.blob.size)}
						</span>
						<button
							type="button"
							class="btn-plain flex h-7 w-7 items-center justify-center rounded-md"
							title="下载这一页"
							aria-label={`下载第 ${page.pageNumber} 页`}
							onclick={() => downloadPage(page)}
						>
							<Icon icon="material-symbols:download" class="text-base" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
