---
title: Godot-Owner与Parent
published: 2026-08-10
description: Godot-Owner与Parent
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-Owner-and-Parent
author: 均慕dreammoon
comment: true
---
以下内容来自AI生成
# Owner与Parent

**要解决你的疑问，首先需要彻底厘清 Godot 中 ****`**owner**`**属性的本质 **（与**`**parent**`**的区别），再基于这个核心概念完善**`**WeaponHolder**`**代码（避免与系统**`**owner**`**冲突），最后解释你提到的**`**State_walk**`**和**`**PlayerManager**`**的**`**owner**`**逻辑。**

## 搞懂核心：Godot 中`owner`与`parent`的本质区别

这是你所有疑问的根源 ——`owner`和`parent`描述的是**两种完全不同的关系**，前者是 “场景归属”，后者是 “节点树层级”，二者无必然关联。

|   |   |   |
|---|---|---|
|**对比维度**|`**parent**`<br><br>**（父节点）**|`**owner**`<br><br>**（所有者）**|
|核心含义|节点树的**层级包含关系**（谁直接 “放” 了它）|节点的**场景归属关系**（属于哪个场景的根）|
|决定因素|通过`add_child()`<br><br>手动设置，或编辑器中拖拽层级|节点创建时所在的**场景根节点**（默认）|
|典型场景|状态机是`player`<br><br>的`parent`<br><br>（`player`<br><br>→状态机→State_walk）|`State_walk`<br><br>的`owner`<br><br>是`player`<br><br>（因为它属于`player`<br><br>场景）|
|关键作用|控制节点的位置继承（`global_position`<br><br>基于`parent`<br><br>）|控制场景打包 / 保存（`owner`<br><br>所在场景保存时，该节点会被包含）|

## 为什么`State_walk`的`owner`是`player`而非`PlayerManager`？

用你的场景举例，逻辑链如下：

1. `**player**`**是场景根节点**：你创建`player.tscn`时，状态机、`State_walk`都是在这个场景内添加的子节点 —— 所以这些节点的`owner`默认指向`player.tscn`的根节点（即`player`），这是 Godot 自动设置的 “场景归属”。
2. `**PlayerManager**`**是**`**player**`**的**`**parent**`：当`PlayerManager`执行`player = PLAYER.instantiate(); add_child(player)`时，`player`的`parent`变成了`PlayerManager`（节点树层级），但`player`自身仍是`player.tscn`的根节点 —— 因此`player`场景内所有子节点（包括`State_walk`）的`owner`依然是`player`，不会变成`PlayerManager`。

简单说：`**owner**`**跟着 “场景” 走，**`**parent**`**跟着 “节点树” 走**。只要`State_walk`是在`player`场景中创建的，它的`owner`就永远是`player`，无论`player`被挂载到哪个祖先节点下。