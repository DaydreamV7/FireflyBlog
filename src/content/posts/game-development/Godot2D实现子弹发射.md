---
title: Godot2D实现子弹发射
published: 2026-06-08
description: Godot实现2D角色移动
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot2D-implementing-bullet-shooting
author: 均慕dreammoon
comment: true
---
# 子弹
首先完成子弹场景的创建
思路历程
创建Sprite2D节点->链接代码->不知道做什么->玩家攻击的创建->按键映射->发现不知道实例化场景->完成实例化相关设置->更新子弹代码移动交给子弹场景

```gdscript
class_name  FireBall extends Sprite2D
# =================================== 属性 ===================================
@export var magic_level : int = 1
var speed = 100
var direction : Vector2 = Vector2.ZERO
# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 虚函数 ===================================
func _ready():
	# 可选：添加一个计时器，几秒后自动消失
	await get_tree().create_timer(3.0).timeout
	queue_free()
	
func _physics_process(_delta: float) -> void:
	position += direction * speed * _delta
# =================================== 自定义函数 ================================
```
# 玩家攻击相关代码

```gdscript
# =================================== 属性 ===================================
# 预加载魔法场景（路径根据你的实际结构）
const FIREBALL_SCENE = preload("res://Scenes/Magics/Scn_FireBall.tscn")
@export var fireball_speed: float = 100.0   # 可以暴露到编辑器调节

# =================================== 虚函数 ===================================
func _input(event: InputEvent) -> void:
	if event.is_action_pressed("attack"):
		attack()
# =================================== 自定义函数 ================================
func attack() -> void:
	var fire_ball = FIREBALL_SCENE.instantiate()
	fire_ball.global_position = global_position+ last_aim_direction*32
	fire_ball.direction = last_aim_direction
	fireball_speed = fireball_speed
	get_tree().current_scene.add_child(fire_ball)
```

# 结语
我们还有很多待做的工作和优化，比如碰撞设置等。
再接再厉