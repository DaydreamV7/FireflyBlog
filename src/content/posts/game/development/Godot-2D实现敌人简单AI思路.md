---
title: Godot-2D实现敌人简单AI
published: 2026-07-23
description: 继承实现人物受击反馈，进而实现敌人简单AI
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-2D-implements-simple-AI-for-enemies
author: 均慕dreammoon
comment: true
---

# 前言
说是实现敌人的简单AI，但是实际上看我们的代码：
```gdscript
class_name TreeMonster extends CharacterBody2D

# =================================== 属性 ===================================

@export var max_hp: int = 5

  
  

var cur_hp: int

# =================================== 节点引用 ===================================

@onready var animation_player: AnimationPlayer = $AnimationPlayer

@onready var hurt_box: Area2D = $HurtBox

# =================================== 信号 ===================================

  

# =================================== 虚函数 ===================================

func _ready():

    cur_hp = max_hp

    hurt_box.damaged.connect(take_damage)

    pass

  

# =================================== 自定义函数 ================================

func take_damage(hitbox: HitBox) -> void:

    cur_hp -= hitbox.damage

    if cur_hp <= 0:

        queue_free() # 敌人死亡，移除节点

    else:

        animation_player.play("hurt")
```

发现攻击手段之类的交互等都没有实现，一个较为好的敌人机制没有实现。

# 具体步骤
# 状态实现
## 追击
为了获取玩家的位置，通过挂在全局脚本“PlayerManager”进行获取
并在玩家的_ready那里提供数据给PlayerManager

目前由于敌人是比玩家晚生成的，在ready函数安排
```gdscript
if not player_ref:
		player_ref = PlayerManager.player  # 从单例拿
		if not player_ref:
		# 保底：如果单例为空，尝试按组找（兼容未设置单例的情况）
			player_ref = get_tree().get_first_node_in_group("player")
			if not player_ref:
				return
```

