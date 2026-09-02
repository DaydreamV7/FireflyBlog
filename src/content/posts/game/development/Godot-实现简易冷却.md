---
title: Godot-实现简易冷却
published: 2026-08-22
description: Godot实现简易冷却
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-achieving-simple-cooling
author: 均慕dreammoon
comment: true
---
给出示例代码理解思路
```gdscript
class_name Player extends CharacterBody2D
# =================================== 属性 ===================================
# 预加载魔法场景（路径根据你的实际结构）
const FIREBALL_SCENE = preload("res://Scenes/Magics/Scn_FireBall.tscn")

var magic_attack_cooldown : float = 2.0
var magic_attack_timer : float = 0.0
# =================================== 节点引用 ===================================


# =================================== 信号 ===================================

# =================================== 虚函数 ===================================
func _ready() -> void:
	update_magic_attack_timer(magic_attack_timer)
	pass

func _process(_delta: float) -> void:
	pass
	
func _physics_process(_delta: float) -> void:
	# 更新冷却
	magic_attack_timer = max(magic_attack_timer - _delta, 0.0)
	
	update_magic_attack_timer(magic_attack_timer)
	
	move_and_slide()
	pass

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ranged_attack") and magic_attack_timer <= 0.0:
		magic_attack()
		magic_attack_timer = magic_attack_cooldown  # 2秒CD，你可以改为 @export var
		
# =================================== 自定义函数 ================================
func magic_attack() -> void:
	var fire_ball = FIREBALL_SCENE.instantiate()
	fire_ball.global_position = weapon_pivot.global_position + last_aim_direction * 32
	fire_ball.direction = last_aim_direction
	fire_ball.speed = fireball_speed
	
	get_tree().current_scene.add_child(fire_ball)
	fire_ball.change_mask(10 , true)
	fire_ball.set_caster(0)

func update_magic_attack_timer( timer : float) -> void:
	PlayerHud.update_magic_attack_timer( timer )
	pass
```