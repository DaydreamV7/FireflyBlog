---
title: Godot-Input与InputEvent
published: 2026-08-10
description: Godot-Input与InputEvent
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-input-and-inputevent
author: 均慕dreammoon
comment: true
---
以下内容来自AI生成。
# Input与InputEvent

**在Godot中，**`**Input**`**类、**`**InputEvent**`**类以及**`**_input()**`**、**`**_unhandled_input()**`**方法是输入处理的核心组件，它们的设计目的和使用场景有明确区别，下面通过对比详细说明：**

## 一、`Input`类 vs `InputEvent`类：「状态查询」与「事件对象」的本质区别

### 1. `Input`类：全局输入状态的“查询器”

- **本质**：Godot的**单例类**（全局唯一），用于查询**当前输入状态**（如“某个键是否正被按住”“鼠标位置在哪里”），不直接处理具体的输入事件，而是提供“状态快照”。
- **核心功能**：

- 检查按键/鼠标/手柄的**持续状态**（如`Input.is_action_pressed("ui_right")`判断“右移”动作是否被按住）。
- 获取设备实时数据（如`Input.get_mouse_position()`获取当前鼠标位置）。
- 模拟输入（如`Input.action_press("attack")`手动触发“攻击”动作）。

- **特点**：

- 反映的是“当前帧的输入状态”，与事件的“发生时机”无关（比如按住按键时，每帧调用`is_action_pressed`都会返回`true`）。
- 不受输入事件在节点树中的传播影响（即使事件被某个节点“消耗”，`Input`的状态查询结果仍不变）。

### 2. `InputEvent`类：具体输入行为的“事件载体”

- **本质**：输入事件的**抽象基类**（派生类如`InputEventKey`、`InputEventMouseButton`等），每个实例代表**一次具体的输入行为**（如“键盘A键按下”“鼠标左键释放”“手柄摇杆移动”）。
- **核心功能**：

- 存储单次输入的详细信息（如按键代码、事件类型（按下/释放）、鼠标位置、力度等）。
- 通过节点的输入回调方法（如`_input`、`_unhandled_input`）在节点树中传播，实现输入的“分发与处理”。

- **特点**：

- 是“一次性事件”的载体（每个事件对应一次具体操作，如“按下”和“释放”是两个不同的`InputEvent`）。
- 会沿节点树传播，可被节点“消耗”（通过`Viewport.set_input_as_handled()`），阻止后续节点处理。

### 两者的使用场景对比

|   |   |   |
|---|---|---|
|场景需求|应使用`Input`类还是`InputEvent`类？|示例|
|持续输入（如按住方向键移动角色）|`Input`类（查询持续状态）|每帧调用`Input.is_action_pressed("move_right")`判断是否移动|
|单次输入（如点击按钮、按一下攻击）|`InputEvent`类（处理单次事件）|在`_unhandled_input`中检测`event.is_action_just_pressed("attack")`|
|获取实时设备数据（如鼠标位置）|`Input`类|`var mouse_pos = Input.get_mouse_position()`|
|区分“按下”和“释放”动作|`InputEvent`类（事件含类型信息）|`if event.is_action_pressed("jump")`（按下） vs `if event.is_action_released("jump")`（释放）|
|模拟输入（如代码触发某个动作）|`Input`类（提供模拟方法）|`Input.action_press("ui_accept")`模拟按下确认键|

## 二、`_input(event)` vs `_unhandled_input(event)`：输入事件的“传播优先级”差异

### 1. `_input(event: InputEvent)`：事件传播的“第一梯队”

- **触发时机**：输入事件进入节点树后，会从当前节点开始**向上传播**（从子节点到父节点），每个节点的`_input`方法会按顺序被调用。
- **核心特点**：

- **优先处理**：在事件传播的早期阶段被调用，无论事件是否与GUI（如按钮、输入框）相关。
- **可被消耗**：如果在`_input`中调用`get_viewport().set_input_as_handled()`，事件会被“标记为已处理”，后续节点（包括父节点）的`_input`和`_unhandled_input`都不会再收到该事件。

- **使用场景**：

- 需要在事件被GUI处理前拦截的场景（如全局快捷键，即使点击按钮时也需要响应）。
- 系统级输入处理（如调试快捷键、游戏暂停键）。
- 示例：按`F3`开启调试模式，无论当前是否点击了UI按钮，都需要触发。

### 2. `_unhandled_input(event: InputEvent)`：事件传播的“剩余处理”

- **触发时机**：只有当事件**没有被任何节点消耗**（包括GUI控件）时，才会触发该方法。GUI控件（如`Button`、`LineEdit`）会优先处理事件（比如点击按钮时，按钮会消耗事件），未被消耗的事件才会到达`_unhandled_input`。
- **核心特点**：

- **后处理**：在事件经过GUI控件处理后才会被调用（如果GUI没消耗事件）。
- **游戏逻辑友好**：避免游戏玩法输入（如角色移动）被GUI干扰（比如点击按钮时，不会同时触发角色移动）。

- **使用场景**：

- 游戏核心玩法输入（如角色移动、攻击、跳跃）。
- 需要排除GUI干扰的输入（如确保点击UI按钮时，不会触发场景中的角色交互）。
- 示例：按`WASD`移动角色，当点击UI菜单时，移动输入会被忽略（因为UI消耗了事件，`_unhandled_input`不会触发）。

### 两者的关键区别与优先级

- **调用顺序**：`_input`先于`_unhandled_input`触发（事件先经过`_input`传播，未被消耗则进入`_unhandled_input`）。
- **GUI影响**：`_input`可能在GUI处理前被调用（可能与GUI冲突），`_unhandled_input`只会处理GUI未消耗的事件（无冲突）。
- **消耗事件的影响**：若`_input`中消耗事件，`_unhandled_input`不会触发；若`_unhandled_input`中消耗事件，仅影响后续的`_unhandled_input`（但通常无需在此消耗，因为事件已“剩余”）。

# 总结：核心选择原则

1. **查询输入状态用**`Input`**，处理单次事件用**`InputEvent`：

- 持续动作（如移动）→ `Input.is_action_pressed`
- 单次动作（如攻击、跳跃）→ `_unhandled_input`中判断`event.is_action_just_pressed`

2. **系统级输入用**`_input`**，玩法输入用**`_unhandled_input`：

- 全局快捷键、调试功能 → `_input`
- 角色控制、场景交互 → `_unhandled_input`（避免与GUI冲突）

理解这两组概念的差异，能帮助你在处理输入时避免冲突（如UI点击干扰角色移动），并写出更符合Godot输入系统设计的逻辑。