---
title: Godot-节点实例化
published: 2026-08-10
description: 由于生成节点时候，发生空值，涉及添加节点逻辑。
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug:
author: 均慕dreammoon
comment: true
---
# 场景
为了实现“子弹”射击，并修改子弹的mask，从而达到攻击玩家的目的。
test_fire_ball
```gdscript
extends Node2D
const SCN_FIRE_BALL = preload("res://Scenes/Magics/Scn_FireBall.tscn")
@onready var timer: Timer = $Timer

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("test"):
		attack()

func attack() -> void:
	var fire_ball = SCN_FIRE_BALL.instantiate()
	fire_ball.direction = Vector2(1,0)
	
	self.add_child(fire_ball)
	
	fire_ball.change_mask(6 , true)
```

此时调用fire_ball里的change_mask
```gdscript
class_name  FireBall extends Sprite2D
# =================================== 属性 ===================================
@export var magic_level : int = 1
var speed = 100
var direction : Vector2 = Vector2.ZERO
# =================================== 节点引用 ===================================
@onready var hit_box: HitBox = $HitBox
# =================================== 信号 ===================================

# =================================== 虚函数 ===================================
func _ready():
	# 可选：添加一个计时器，几秒后自动消失
	await get_tree().create_timer(3.0).timeout
	queue_free()
	
func _physics_process(_delta: float) -> void:
	position += direction * speed * _delta
# =================================== 自定义函数 ================================
func change_mask(num : int , value : bool) -> void:
	hit_box.set_collision_mask_value(num, value)

```

其中test_fire_ball是修改后的代码。
主要是change_mask调用在add_child后面
# 答案
**`@onready` 变量在 `_ready()` 执行时才会赋值。而 `_ready()` 只有在节点**被加入场景树**（`add_child`）之后才会触发。**

# 问题
> "实例化，不可以设置完节点属性再添加child吗？"

**可以设置“数据属性”（如 `direction`、`speed`），但不能调用“依赖子节点”的方法。**

正确写法：

```gdscript
var fire_ball = SCN_FIRE_BALL.instantiate()
fire_ball.direction = Vector2(1, 0)   # 纯数据属性，不依赖 @onready
fire_ball.speed = 150                 # 同上
self.add_child(fire_ball)             # 入树后 _ready() 执行
fire_ball.change_mask(6, true)        # 依赖 @onready，必须放后面
```
