---
title: Godot碰撞箱
published: 2026-07-23
description: Godot实现碰撞箱
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-hitbox
author: 均慕dreammoon
comment: true
---
**标准定义是这样的：**

- **HitBox（攻击判定框）**：与攻击相关联，描述攻击的有效范围。它是**主动**的，代表“我能打到你”。例如，你挥剑时剑锋扫过的区域、子弹的飞行轨迹，这些就是HitBox。
    
- **HurtBox（受击判定框）**：与角色（或其他可被击中的对象）相关联，描述角色身上**可以被攻击到的区域**。它是**被动**的，代表“我能被打到”。
    

简单来说，**HitBox是“拳头”，HurtBox是“身体”**。

|概念|通俗理解|作用|存在时间|
|---|---|---|---|
|**HitBox**|“拳头”|主动去撞别人，造成伤害|**攻击时**才出现|
|**HurtBox**|“身体”|被动等待被撞，接收伤害|通常**一直存在**|
# HurtBox
```gdscript
class_name HurtBox extends Area2D

signal damaged( hit_box : HitBox )

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	pass

func take_damage( hit_box : HitBox ) -> void:
	damaged.emit( hit_box )

```

# HurtBox
```gdscript
class_name HitBox extends Area2D

signal did_damage

@export var damage : int = 1

func _ready() -> void:
	area_entered.connect( area_enter )
	pass
	
func _process(delta: float) -> void:
	pass

func area_enter( a : Area2D ) -> void:
	if a is HurtBox:
		did_damage.emit()
		a.take_damage( self )
	pass

```