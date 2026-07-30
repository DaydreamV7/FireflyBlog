---
title: Godot-2DCamera简单实现
published: 2026-07-30
description: 实现摄像机Limit思路
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-2D-implements-player-camera-limit-boundaries
author: 均慕dreammoon
comment: true
---
由于deepseek和qwen无法给出满意的答复，以下内容由chatgpt提供，我进行增删改。
# 结构
为什么 TileMapLayer 不是根节点？

答案是：

**因为地图不是关卡。**

这是很多新手都会混淆的。

---

一个关卡（Level）包含什么？

```
Level

├── TileMapLayer
├── PlayerSpawn
├── EnemySpawn
├── NPC
├── Chest
├── Trigger
├── Light
├── Navigation
├── CameraLimit
```
TileMap只是其中一种数据。

以后你做RPG。

一个Level甚至有：

```
TileMapLayer
+
怪物
+
BGM
+
剧情
+
传送门
+
Boss
+
天气
```
所以：
> **Level负责组织。**
> 
> **TileMap负责画地图。**

这是职责。
所以：Level 作为根节点，非常合理。
# 谁负责计算边界
为什么不是：

```
TileMapLayer

↓

告诉Level
```

答案：
因为Camera限制不是TileMap自己的事情。
TileMap根本不知道Camera。
它只负责：画砖块
所以：
Level说：
> "这是我的地图。"

然后自己算边界。这是符合职责的。
# 变量名
真正的问题其实在这里：
```gdscript
var bounds: Array[Vector2]
```

我会直接改掉。为什么？
因为：
Array没有任何语义。
例如：
```
[
    Vector2(0,0),

    Vector2(500,500)
]
```

请问：

```
bounds[0]
```

代表什么？左上？中心？出生点？
没人知道。只有你自己知道。

---

所以优秀代码不会写：

```gdscript
Array<Vector2>
```

而会写：

```gdscript
Rect2
```

或者

```gdscript
class CameraBounds
```
# 理解API含义
```gdscript
func _setup_camera_bounds() -> void:
	if not tile_map_layer:
		return
	
	var tile_size = tile_map_layer.tile_set.tile_size
	# 获取 TileMap 实际使用的矩形区域
	var used_rect: Rect2i = tile_map_layer.get_used_rect()
	# 计算左上角的世界坐标
	var top_left = used_rect.position * tile_size

	# 计算右下角的世界坐标（位置 + 尺寸）
	var bottom_right = used_rect.end * tile_size
	
	# 组装数组并通知 LevelManager
	var bounds: Array[Vector2] = [top_left, bottom_right]
	LevelManager.change_tilemaplayer_bounds(bounds)
```
**used_rect是什么坐标？** 很多人仅仅使用但不知道其含义。
它是格子坐标，也就是说要清楚的知道自己要使用的是什么数据。

当然，这还要结合 `TileMapLayer` 的原点、缩放和是否有偏移来判断。如果你的 `TileMapLayer` 不在 `(0,0)`，还需要把节点的全局位置加进去。因此这里**不能盲目照抄**，而是要先确认 `TileMapLayer` 是否有位移。
## Camera
Camera的limit限制的是Camera的最终位置。
但是Camera还有Viewport
那么：Camera永远会露边。为什么？
因为：
```
地图

比窗口

还小
```

这是数学问题。不是代码问题。
所以Camera Limit还有一个前提：

> **地图必须至少大于Camera可视区域。**

否则：
```
左边限制

=

右边限制
```
Camera都没地方放。
# 思维模型
我不会急着继续写代码。

我建议你先建立一个**游戏程序员的思维模型**。

以后看到任何功能，先问四个问题：

```
① 数据是谁拥有？
```

例如：

地图边界是谁拥有？

答案：

```
Level
```

不是Camera。

---

```
② 谁负责计算？
```

答案：

```
Level
```

---

```
③ 谁负责保存？
```

答案：

```
LevelManager
```

---

```
④ 谁负责表现？
```

答案：

```
Camera
```
---

如果你以后每做一个功能（血条、AI、背包、技能）都先画出这四个问题，你会发现设计会越来越清晰，而不是一开始就陷入 API 和代码细节。
# 参考代码
## 修改前
### level
```gdscript
extends Node2D
class_name Level
# =================================== 属性 ===================================
@export var tile_map_layer: TileMapLayer  # 在编辑器里把地图拖进来
# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 引擎虚函数 ===================================
func _ready() -> void:
	# 启用 Y 轴排序（你的原代码有这行，保留）
	self.y_sort_enabled = true
	
	# 计算并发射边界
	_setup_camera_bounds()
	
	
# =================================== 自定义函数 ===================================

func _setup_camera_bounds() -> void:
	if not tile_map_layer:
		return
	
	var tile_size = tile_map_layer.tile_set.tile_size
	# 获取 TileMap 实际使用的矩形区域
	var used_rect: Rect2i = tile_map_layer.get_used_rect()
	# 计算左上角的世界坐标
	var top_left = used_rect.position * tile_size

	# 计算右下角的世界坐标（位置 + 尺寸）
	var bottom_right = used_rect.end * tile_size
	
	# 组装数组并通知 LevelManager
	var bounds: Array[Vector2] = [top_left, bottom_right]
	LevelManager.change_tilemaplayer_bounds(bounds)
```
### LevelManager
```gdscript
extends Node
# =================================== 属性 ===================================
# 当前边界缓存（用于相机初始化读取）
var current_tilemap_bounds: Array[Vector2] = []

# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 引擎虚函数 ===================================


# =================================== 自定义函数 ===================================
func change_tilemaplayer_bounds(bounds: Array[Vector2]) -> void:
	current_tilemap_bounds = bounds
	tilemaplayer_bounds_changed.emit(bounds)
```
### Camera
```gdscript
class_name PlayerCamera extends Camera2D
# =================================== 属性 ===================================
var level_bounds: Rect2 = Rect2()
# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 引擎虚函数 ===================================

func _ready() -> void:
	 # 绑定边界更新信号
	LevelManager.tilemaplayer_bounds_changed.connect(_update_limits)
	
	# 初始化时读取一次当前边界（防止关卡加载早于相机）
	_update_limits(LevelManager.current_tilemap_bounds)
# =================================== 自定义函数 ===================================
# 核心函数：将数组 [左上角, 右下角] 转为 Godot 的 limit 属性
func _update_limits(bounds: Array[Vector2]) -> void:
	if bounds.is_empty():
		return
	
	# 假设 bounds[0] 是地图左上角世界坐标，bounds[1] 是右下角世界坐标
	var top_left: Vector2 = bounds[0]
	var bottom_right: Vector2 = bounds[1]
	
	 # 将 Vector2 强制转换为 int，因为 Camera2D 的 limit 属性只接受整数像素值
	limit_left = int(bounds[0].x)
	limit_top = int(bounds[0].y)
	limit_right = int(bounds[1].x)
	limit_bottom = int(bounds[1].y)
```
## 修改后
### level
```gdscript
extends Node2D
class_name Level
# =================================== 属性 ===================================
@export var tile_map_layer: TileMapLayer  # 在编辑器里把地图拖进来
# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 引擎虚函数 ===================================
# 定义：Godot 引擎自动调用的函数。如 _ready, _process, _physics_process, _input, _enter_tree 等
# 作用：只写“流转逻辑”和“信号绑定”，不写具体的业务计算细节。
func _ready() -> void:
	# 启用 Y 轴排序（你的原代码有这行，保留）
	self.y_sort_enabled = true
	
	# 计算并发射边界
	_setup_camera_bounds()
	
	
# =================================== 自定义函数 ===================================
func _setup_camera_bounds() -> void:
	if not tile_map_layer:
		return
	
	var tile_size = tile_map_layer.tile_set.tile_size
	# 获取 TileMap 实际使用的矩形区域
	var used_rect: Rect2i = tile_map_layer.get_used_rect()
	# 计算左上角的世界坐标
	var top_left = used_rect.position * tile_size

	# 计算右下角的世界坐标（位置 + 尺寸）
	var bottom_right = used_rect.end * tile_size
	
	# 组装数组并通知 LevelManager
	var bounds: Rect2i= Rect2()
	bounds.position = top_left
	bounds.end = bottom_right
	
	LevelManager.change_tilemaplayer_bounds(bounds)
```
### LevelManager
```gdscript
extends Node
# =================================== 属性 ===================================
# 当前边界缓存（用于相机初始化读取）
var current_tilemap_bounds: Rect2 = Rect2()

# =================================== 节点引用 ===================================

# =================================== 信号 ===================================
# 信号：当边界变化时发射
signal tilemaplayer_bounds_changed(bounds: Rect2)
# =================================== 引擎虚函数 ===================================

# =================================== 自定义函数 ===================================
func change_tilemaplayer_bounds(bounds: Rect2) -> void:
	current_tilemap_bounds = bounds
	tilemaplayer_bounds_changed.emit(bounds)
```
### Camera
```gdscript
class_name PlayerCamera extends Camera2D
# =================================== 属性 ===================================
var level_bounds: Rect2 = Rect2()
# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 引擎虚函数 ===================================
func _ready() -> void:
	 # 绑定边界更新信号
	LevelManager.tilemaplayer_bounds_changed.connect(_update_limits)
	
	# 初始化时读取一次当前边界（防止关卡加载早于相机）
	_update_limits(LevelManager.current_tilemap_bounds)
# =================================== 自定义函数 ===================================
# 核心函数：将数组 [左上角, 右下角] 转为 Godot 的 limit 属性
func _update_limits(bounds: Rect2) -> void:
	if bounds == Rect2():
		return
	
	var top_left: Vector2 = bounds.position
	var bottom_right: Vector2 = bounds.end
	
	# 将 Vector2 强制转换为 int，因为 Camera2D 的 limit 属性只接受整数像素值
	limit_left = int(top_left.x)
	limit_top = int(top_left.y)
	limit_right = int(bottom_right.x)
	limit_bottom = int(bottom_right.y)
```