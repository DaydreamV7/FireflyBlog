---
title: Godot2D实现角色移动
published: 2026-06-06
description: Godot实现2D角色移动
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-2D-realizes-character-movement
author: 均慕dreammoon
comment: true
---
# 背景
  由于需要开发一款独立游戏，并记录文档来提供学习和记录过程。
  背景是在Godot版本为4.6(stable)
  简单实现角色移动。

# 代码
针对人物移动方式为Float情况下且是具有上下左右动画的游戏，可以避免斜方向向量(1,1)导致速度加快。
```python
class_name Player extends CharacterBody2D
# =================================== 属性 ===================================
const move_speed : float = 150.0

# =================================== 节点引用 ===================================
@onready var sprite_2d: Sprite2D = $Sprite2D

# =================================== 信号 ===================================

# =================================== 虚函数 ===================================
func _physics_process( _delta : float) -> void:
	var direction = Input.get_vector("move_left","move_right","move_up","move_down").normalized()
	
	velocity = direction * move_speed
	move_and_slide()
	pass
	
# =================================== 自定义函数 ================================

```

# 理解
> ● Vector2velocity [默认： Vector2(0, 0)]set_velocity(值) setterget_velocity() getter
>
> 当前的速度向量，单位为像素每秒。该属性会在调用 move_and_slide() 时被使用和修改。
>
> 注意：一个常见的错误是将此属性设置为期望速度乘以 delta。这得到的是一个以像素为单位的移动向量。
>

创建一个CharacterBody2D节点

已知要使该节点进行移动需要对它的属性velocity进行更新

通过调用move_and_slide() 使它得到使用和修改。

那么direction得到的是基础方向向量,move_speed是提供的放大程度。通过调用move_and_slide()进行更新。

# 问题
## 为什么不用虚函数_process()
**<font style="color:rgb(15, 17, 21);">核心区别：调用频率和同步对象不同。</font>**

| <font style="color:rgb(15, 17, 21);">维度</font> | <font style="color:rgb(15, 17, 21);background-color:rgb(235, 238, 242);">_process(delta)</font> | <font style="color:rgb(15, 17, 21);background-color:rgb(235, 238, 242);">_physics_process(delta)</font> |
| --- | --- | --- |
| **<font style="color:rgb(15, 17, 21);">调用频率</font>** | <font style="color:rgb(15, 17, 21);">每帧调用，频率不固定，取决于硬件和游戏复杂度</font> | <font style="color:rgb(15, 17, 21);">固定频率调用，默认 60 次/秒，独立于帧率</font> |
| **<font style="color:rgb(15, 17, 21);">同步对象</font>** | <font style="color:rgb(15, 17, 21);">与</font>**<font style="color:rgb(15, 17, 21);">画面渲染</font>**<font style="color:rgb(15, 17, 21);">同步</font> | <font style="color:rgb(15, 17, 21);">与</font>**<font style="color:rgb(15, 17, 21);">物理引擎</font>**<font style="color:rgb(15, 17, 21);">同步</font> |
| <font style="color:rgb(15, 17, 21);background-color:rgb(235, 238, 242);">delta</font><br/>**<font style="color:rgb(15, 17, 21);"> </font><font style="color:rgb(15, 17, 21);">参数</font>** | <font style="color:rgb(15, 17, 21);">上一帧到这一帧的时间（秒），帧率波动时 delta 也会波动</font> | <font style="color:rgb(15, 17, 21);">上一次物理 tick 到这一次的时间（秒），通常是固定值（如 1/60 秒）</font> |
| **<font style="color:rgb(15, 17, 21);">适用场景</font>** | <font style="color:rgb(15, 17, 21);">动画、UI 更新、Camera 跟随、非物理的视觉效果</font> | <font style="color:rgb(15, 17, 21);">角色移动、物理模拟、碰撞响应、需要稳定判定的逻辑</font> |


**_physics_process() 为什么适合移动？**

官方文档明确指出："_physics_process() 应用于必须在每次物理 step 之前执行的处理，比如控制角色"。
用 _physics_process 移动角色的好处：
1. 移动与物理引擎同步，碰撞检测更精确，不会出现"穿墙"或"卡进墙里"的问题。
2. 固定频率调用，所以用 velocity = direction * speed 时，每 tick 移动的距离是恒定的。这在 _process 里需要手动乘 delta 才能保证帧率波动时移动速度不变，但 _physics_process 里这个计算已经被 Godot 内部处理好了。
3. 响应输入更可靠：如果输入检测（比如按住攻击键）也在 _physics_process 里做，不会因为帧率突然下降而"吞掉"一次攻击判定。

**什么时候用 _process()？**
官方建议"大部分游戏逻辑都应该在 _physics_process 里做"，但 _process 依然有自己的用武之地：
● 动画更新（比如按移动方向切换 idle/run 动画精灵图）
● UI 元素跟随（血条、头顶名字）
● 摄像机平滑跟随（需要更流畅的跟随效果时）
● 粒子系统更新
● 任何不需要物理引擎参与、只跟画面相关的视觉反馈


# 后言
  我发现AI时代确实牛诶，问题那部分内容是有AI提供的。但我还是需要写下这篇文章来记录开发过程。