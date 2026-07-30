---
title: Godot-2D游戏简单实现人物受击反馈
published: 2026-07-23
description: 2D游戏实现人物受击反馈
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-2D-implements-character-hit-feedback
author: 均慕dreammoon
comment: true
---
# 具体步骤
- 锁定敌人场景

- 增添Animation，通过透明度改变和对人物图片颜色修改来锁定帧从而实现闪烁。

- 通过Sprite2D人物图片，添加Modulate关键帧来实现受击动画

- 修改敌人代码实现打击反馈


代码暂且如下
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
