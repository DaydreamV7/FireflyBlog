---
title: Godot-火球进阶碰撞
published: 2026-08-20
description: 实现火球碰撞思路
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-ireball-advanced-collision
author: 均慕dreammoon
comment: true
---
原先的FireBall可以看文章[[Godot-节点实例化]]来看具体实现这里说明一下
# 简单实现
通过
![[Godot-FireBall节点简单.png]]
只需要对HitBox对Layer和Mask的层数设置，即可实现简单的子弹功能。
但由于要实现火球碰撞的计算，我发现添加HurtBox会导致FireBall和自身的HitBox进行碰撞检测从而导致实现不了效果。
# 进阶实现
通过添加Area2D额外节点作为检测，这样子很好的实现了我想要的火球碰撞问题。
但是出现了问题，当我进行两连发FireBall的时候，这就发生了碰撞从而导致两连发FireBall无法实现。
而碰撞的检测是通过Area2D实现的，这就导致不能退回去思考HitBox和HurtBox的碰撞问题。所以我解决spellcaster来获取发射者信息。
```gdscript
class_name FireBall extends Sprite2D
# =================================== 属性 ===================================
@export var magic_level : int = 1
var speed : int = 150
var direction : Vector2 = Vector2.ZERO
var hp : int = 1
var spellcaster : String
# =================================== 节点引用 ===================================
@onready var hit_box: HitBox = $HitBox
@onready var magic_hit: Area2D = $MagicHit
# =================================== 信号 ===================================

# =================================== 虚函数 ===================================
func _ready():
	magic_hit.area_entered.connect(_on_area_entered)
	# 属性设计
	hit_box.damage = hp
	hit_box.did_damage.connect(did_damage)
	# 可选：添加一个计时器，几秒后自动消失
	await get_tree().create_timer(3.0).timeout
	queue_free()
	
func _physics_process(_delta: float) -> void:
	position += direction * speed * _delta
# =================================== 自定义函数 ================================
func _on_area_entered(area: Area2D):
	# 检查对方是否也是火球（可以通过 class_name 或 group）
	if area.get_parent() is FireBall:
		if area.get_parent().get_spellcaster() != spellcaster:
			# 两个火球碰撞，都消失
			queue_free()
			area.queue_free()
			# 或播放爆炸动画后消失


func change_mask(num : int , value : bool) -> void:
	hit_box.set_collision_mask_value(num, value)

func did_damage() -> void:
	queue_free()

func change_damage_num( num : int ) -> void:
	hit_box.damage = num

func set_spellcaster( _name : String ) -> void:
	spellcaster = _name

func get_spellcaster() -> String:
	return spellcaster
```

## AI建议
你的思路是**正确的**，但实现方式可以更优雅。

**你现在的做法：**

- 用字符串 `spellcaster` 识别火球是谁发射的
    
- 碰撞时比对字符串，相同则不处理
    

**这是可行的，但字符串比较有隐患：**

- 拼写错误会静默失败
    
- 扩展性差（如果以后要区分“红法师”、“蓝法师”怎么办？）
    

**更推荐的做法：用枚举或碰撞层**

**方式A：枚举 + 静态变量**

```gdscript

# FireBall.gd
enum Caster { PLAYER, ENEMY, NEUTRAL }
var caster: Caster = Caster.NEUTRAL

func set_caster(caster_type: Caster):
    caster = caster_type
    
func _on_area_entered(area: Area2D):
    var other = area.get_parent() as FireBall
    if other and other.caster != caster:
        queue_free()
        other.queue_free()
```
**方式B：用 Group 或碰撞层（更高效）**

- 玩家发射的火球：`collision_layer = 1`（玩家投射物层）
    
- 敌人发射的火球：`collision_layer = 2`（敌人投射物层）
    
- 物理层设置中只检测“不同阵营”的层
    

这样不需要字符串或枚举，物理引擎直接过滤。

**你的实现不算错，只是可以优化。** 作为新人，你的思路已经对了——识别“谁发射的”，然后根据身份决定碰撞行为。这是游戏开发中“归属权”问题的典型解法。