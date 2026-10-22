<script lang="ts">
import Icon from "@/components/common/Icon.svelte";

type Align = "left" | "center" | "right";
type Background = "white" | "transparent" | "black";

interface StitchItem {
	id: number;
	name: string;
	url: string;
	width: number;
	height: number;
	file: File;
}

interface Option<T> {
	value: T;
	label: string;
}

const GAP_OPTIONS: Option<number>[] = [
	{ value: 0, label: "无间距" },
	{ value: 8, label: "8 px" },
	{ value: 16, label: "16 px" },
	{ value: 32, label: "32 px" },
];

const ALIGN_OPTIONS: Option<Align>[] = [
	{ value: "center", label: "居中" },
	{ value: "left", label: "靠左" },
	{ value: "right", label: "靠右" },
];

const BACKGROUND_OPTIONS: Option<Background>[] = [
	{ value: "white", label: "白色（JPEG 友好）" },
	{ value: "transparent", label: "透明（仅 PNG）" },
	{ value: "black", label: "黑色" },
];

// 浏览器 canvas 高度上限约 16384，超出会得到空白图
const MAX_CANVAS_HEIGHT = 16384;

let items = $state<StitchItem[]>([]);
let gap = $state(0);
let align = $state<Align>("center");
let background = $state<Background>("white");
let loading = $state(false);
let stitching = $state(false);
let isDragging = $state(false);
let errorMessage = $state("");
let resultUrl = $state<string | null>(null);
let resultSize = $state(0);
let resultWidth = $state(0);
let resultHeight = $state(0);
let nextId = 0;
let fileInput: HTMLInputElement | undefined = $state(undefined);

const totalHeight = $derived(
	items.reduce((sum, item, index) => sum + item.height + (index > 0 ? gap : 0), 0),
);
const maxWidth = $derived(items.reduce((max, item) => Math.max(max, item.width), 0));
const tooTall = $derived(totalHeight > MAX_CANVAS_HEIGHT);
const canStitch = $derived(items.length > 0 && !loading && !stitching);

function clearResult(): void {
	if (resultUrl) URL.revokeObjectURL(resultUrl);
	resultUrl = null;
	resultSize = 0;
	resultWidth = 0;
	resultHeight = 0;
}

function readImage(file: File): Promise<StitchItem | null> {
	return new Promise((resolve) => {
		if (!file.type.startsWith("image/")) {
			resolve(null);
			return;
		}
		const url = URL.createObjectURL(file);
		const image = new Image();
		image.onload = () => {
			resolve({
				id: nextId++,
				name: file.name,
				url,
				width: image.naturalWidth,
				height: image.naturalHeight,
				file,
			});
		};
		image.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};
		image.src = url;
	});
}

async function addFiles(files: FileList | File[]): Promise<void> {
	const list = Array.from(files);
	if (list.length === 0) return;
	loading = true;
	errorMessage = "";
	clearResult();

	const loaded: StitchItem[] = [];
	let skipped = 0;
	for (const file of list) {
		const item = await readImage(file);
		if (item) loaded.push(item);
		else skipped++;
	}
	items = [...items, ...loaded];
	loading = false;
	if (skipped > 0) errorMessage = `${skipped} 个文件不是图片，已跳过。`;
}

function onFileChange(event: Event): void {
	const input = event.currentTarget as HTMLInputElement;
	if (input.files) void addFiles(input.files);
	input.value = "";
}

function onDrop(event: DragEvent): void {
	event.preventDefault();
	isDragging = false;
	if (event.dataTransfer?.files) void addFiles(event.dataTransfer.files);
}

function moveItem(index: number, delta: number): void {
	const target = index + delta;
	if (target < 0 || target >= items.length) return;
	const next = [...items];
	const [moved] = next.splice(index, 1);
	next.splice(target, 0, moved);
	items = next;
	clearResult();
}

function removeItem(index: number): void {
	URL.revokeObjectURL(items[index].url);
	items = items.filter((_, i) => i !== index);
	clearResult();
}

function resetAll(): void {
	for (const item of items) URL.revokeObjectURL(item.url);
	items = [];
	clearResult();
	errorMessage = "";
	if (fileInput) fileInput.value = "";
}

function drawImage(
	context: CanvasRenderingContext2D,
	image: HTMLImageElement,
	item: StitchItem,
	y: number,
): void {
	let x = 0;
	if (align === "center") x = Math.round((maxWidth - item.width) / 2);
	else if (align === "right") x = maxWidth - item.width;
	context.drawImage(image, x, y, item.width, item.height);
}

async function stitch(): Promise<void> {
	if (items.length === 0 || stitching) return;
	stitching = true;
	errorMessage = "";
	clearResult();

	const width = Math.max(1, maxWidth);
	const height = Math.max(1, totalHeight);

	try {
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("当前浏览器不支持 Canvas 导出");

		if (background !== "transparent") {
			context.fillStyle = background === "black" ? "#000000" : "#ffffff";
			context.fillRect(0, 0, width, height);
		}

		let y = 0;
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const image = new Image();
			image.src = item.url;
			await image.decode();
			if (index > 0) y += gap;
			drawImage(context, image, item, y);
			y += item.height;
		}

		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob((value) => resolve(value), "image/png");
		});
		if (!blob) throw new Error("导出图片失败");

		resultUrl = URL.createObjectURL(blob);
		resultSize = blob.size;
		resultWidth = width;
		resultHeight = height;
	} catch (error) {
		errorMessage = `拼接失败：${(error as Error).message}`;
	} finally {
		stitching = false;
	}
}

function download(): void {
	if (!resultUrl) return;
	const anchor = document.createElement("a");
	anchor.href = resultUrl;
	anchor.download = `stitched-${Date.now()}.png`;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

$effect(() => {
	// 组件销毁时释放所有 objectURL
	return () => {
		for (const item of items) URL.revokeObjectURL(item.url);
		if (resultUrl) URL.revokeObjectURL(resultUrl);
	};
});
</script>

<div class="space-y-5">
	<input
		type="file"
		accept="image/*"
		multiple
		class="hidden"
		bind:this={fileInput}
		onchange={onFileChange}
	/>

	<button
		type="button"
		class={[
			"w-full rounded-(--radius-large) border-2 border-dashed px-6 py-9 transition-colors",
			isDragging
				? "border-(--primary) bg-(--btn-regular-bg)"
				: "border-(--line-divider) hover:border-(--primary) hover:bg-(--btn-regular-bg)",
		].join(" ")}
		onclick={() => fileInput?.click()}
		ondrop={onDrop}
		ondragover={(event) => {
			event.preventDefault();
			isDragging = true;
		}}
		ondragleave={() => {
			isDragging = false;
		}}
	>
		<div class="flex flex-col items-center gap-2 text-center">
			<Icon icon="material-symbols:add-photo-alternate" class="text-3xl text-(--primary)" />
			<span class="text-90 font-bold">点击选择 或 拖入图片（可多选，按选择顺序自上而下排列）</span>
			<span class="text-50 text-sm">图片只在浏览器本地处理，不会上传到服务器</span>
		</div>
	</button>

	{#if items.length > 0}
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
				<span class="text-90 font-bold">已选 {items.length} 张</span>
				<span class="text-50">合成尺寸 {maxWidth} × {totalHeight} px</span>
				{#if tooTall}
					<span class="text-red-500">超过浏览器画布上限 16384px，建议分批拼接</span>
				{/if}
				<button
					type="button"
					class="btn-plain ml-auto h-9 rounded-lg px-3 text-sm font-bold"
					onclick={resetAll}
				>
					全部清空
				</button>
			</div>

			<ol class="space-y-2">
				{#each items as item, index (item.id)}
					<li
						class="flex items-center gap-3 rounded-lg border border-(--line-divider) px-3 py-2"
					>
						<span class="text-50 w-5 shrink-0 text-center text-sm">{index + 1}</span>
						<img
							src={item.url}
							alt={item.name}
							class="h-14 w-20 shrink-0 rounded bg-(--btn-regular-bg) object-contain"
						/>
						<div class="min-w-0 flex-1">
							<p class="text-75 truncate text-sm">{item.name}</p>
							<p class="text-50 text-xs">{item.width} × {item.height}</p>
						</div>
						<div class="flex shrink-0 items-center gap-1">
							<button
								type="button"
								class="btn-plain flex h-8 w-8 items-center justify-center rounded-md"
								title="上移"
								aria-label="上移"
								disabled={index === 0}
								class:opacity-30={index === 0}
								onclick={() => moveItem(index, -1)}
							>
								<Icon icon="material-symbols:arrow-upward" class="text-base" />
							</button>
							<button
								type="button"
								class="btn-plain flex h-8 w-8 items-center justify-center rounded-md"
								title="下移"
								aria-label="下移"
								disabled={index === items.length - 1}
								class:opacity-30={index === items.length - 1}
								onclick={() => moveItem(index, 1)}
							>
								<Icon icon="material-symbols:arrow-downward" class="text-base" />
							</button>
							<button
								type="button"
								class="btn-plain flex h-8 w-8 items-center justify-center rounded-md"
								title="移除"
								aria-label="移除这张图片"
								onclick={() => removeItem(index)}
							>
								<Icon icon="material-symbols:close" class="text-base" />
							</button>
						</div>
					</li>
				{/each}
			</ol>
		</div>

		<div class="grid gap-3 sm:grid-cols-3">
			<label class="block">
				<span class="text-75 mb-1 block text-sm">图片间距</span>
				<select
					bind:value={gap}
					class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10 dark:bg-(--card-bg)"
				>
					{#each GAP_OPTIONS as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="text-75 mb-1 block text-sm">横向对齐</span>
				<select
					bind:value={align}
					class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10 dark:bg-(--card-bg)"
				>
					{#each ALIGN_OPTIONS as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>

			<label class="block">
				<span class="text-75 mb-1 block text-sm">背景</span>
				<select
					bind:value={background}
					class="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm text-75 outline-hidden transition-colors focus:border-(--primary) dark:border-white/10 dark:bg-(--card-bg)"
				>
					{#each BACKGROUND_OPTIONS as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<button
				type="button"
				class="btn-regular h-11 rounded-lg px-5 font-bold"
				disabled={!canStitch}
				class:opacity-50={!canStitch}
				onclick={stitch}
			>
				<Icon icon="material-symbols:view-agenda-outline" class="mr-2 text-lg" />
				{stitching ? "拼接中…" : "生成拼接图"}
			</button>
			{#if loading}
				<Icon icon="svg-spinners:ring-resize" class="text-lg text-(--primary)" />
				<span class="text-50 text-sm">读取图片中…</span>
			{/if}
		</div>
	{/if}

	{#if errorMessage}
		<p class="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500">{errorMessage}</p>
	{/if}

	{#if resultUrl}
		<div class="space-y-3 border-t border-(--line-divider) pt-4">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<span class="text-90 font-bold">
					拼接完成 · {resultWidth} × {resultHeight} px · {formatBytes(resultSize)}
				</span>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="btn-regular h-10 rounded-lg px-4 text-sm font-bold"
						onclick={download}
					>
						<Icon icon="material-symbols:download" class="mr-2 text-lg" />
						下载 PNG
					</button>
					<button
						type="button"
						class="btn-plain h-10 rounded-lg px-3 text-sm"
						onclick={clearResult}
					>
						清除结果
					</button>
				</div>
			</div>
			<div class="max-h-96 overflow-auto rounded-lg border border-(--line-divider) bg-(--btn-regular-bg) p-2">
				<img src={resultUrl} alt="拼接结果预览" class="mx-auto h-auto max-w-full" />
			</div>
		</div>
	{/if}
</div>
