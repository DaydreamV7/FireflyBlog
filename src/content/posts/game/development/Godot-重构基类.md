---
title: Godot-重构基类
published: 2026-08-28
description: Godot-重构基类
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-refactoring-base-class
author: 均慕dreammoon
comment: true
---
# 前言
游戏场景需要多个敌人的时候，没有基类会导致重复性活动较多。现通过AI制作出示例文章
# 示例代码
## TreeMonster
```gdscript
"""
创建日期: 2026.7.23
更新日期: 2026.8.12
编写者: Dreammoon
"""
class_name TreeMonster extends Enemy
# =================================== 属性 ===================================
@export var max_hp: int = 5

@export var attack_radius: float = 16.0 # 攻击距离
@export var move_speed: float = 30.0 # 移动速度
@export var attack_cooldown: float = 1.0 # 攻击冷却
@export var detect_radius: float = 150.0 # 发现玩家的距离

var hp: int

var player_ref: Player = null # 玩家的引用
var attack_cooldown_left: float = 0.0
var is_attacking: bool = false
var dir_to_player: Vector2 = Vector2.ZERO
var distance: float


@export var circle_speed: float = 40.0 # 绕柱速度
@export var circle_distance: float = 72.0 # 绕柱半径
@export var circle_switch_interval: float = 2.0 # 切换方向间隔
var circle_direction: bool = true # true=顺时针，false=逆时针
var circle_timer: float = 0.0
# =================================== 节点引用 ===================================
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var hurt_box: Area2D = $HurtBox
@onready var hit_box: HitBox = $WeaponPivot/HitBox
@onready var sprite_2d: Sprite2D = $Sprite2D
@onready var state_machine: StateMachine = $StateMachine
@onready var texture_progress_bar: TextureProgressBar = $Sprite2D/TextureProgressBar


# =================================== 信号 ===================================

signal enemy_damaged()
# =================================== 虚函数 ===================================
func _ready():
	hp = max_hp
	update_texture_progress_bar(hp)
	hit_box.monitoring = false

	hurt_box.damaged.connect(take_damage)
	player_ref = get_player_ref()
	
	state_machine.initialize(self)


func _physics_process(delta: float):
	attack_cooldown_left = maxf(attack_cooldown_left - delta, 0.0)
	
	# 如果玩家不存在，停止移动
	if not player_ref:
		velocity = Vector2.ZERO
		move_and_slide()
		print("敌人没有存储到玩家数据")
		return
	
	# 获取自身与玩家位置的距离
	dir_to_player = player_ref.global_position - global_position
	distance = dir_to_player.length()
	
	move_and_slide()

# 增加测试
#func _input(event: InputEvent) -> void:
	#if event.is_action_pressed("test"):
		#move_towards_circle()

# =================================== 自定义函数 ================================
func get_player_ref() -> Player:
	if PlayerManager.player:
		return PlayerManager.player
	var player_node := get_tree().get_first_node_in_group("player")
	if player_node is Player:
		return player_node
	return null

func take_damage(hitbox: HitBox) -> void:
	if hp > 0:
		hp -= hitbox.damage
		enemy_damaged.emit()
		update_texture_progress_bar(hp)
	


func update_facing(dir: Vector2) -> void:
	if dir.x != 0:
		sprite_2d.flip_h = dir.x < 0


func animation_update(ani_name: String):
	animation_player.play(ani_name)
	pass


# 原子移动函数
func move_towards(dir: Vector2 = dir_to_player, speed: float = move_speed) -> void:
	# 这里实现了移动向量的改变，其中target_dir是到目标位置的向量，其长度为到达目标位置的距离。主要以线性移动为主
	velocity = dir.normalized() * speed
	update_facing(dir)

func move_away(dir: Vector2 = dir_to_player, speed: float = move_speed * 2) -> void:
	velocity = - dir.normalized() * speed
	pass

func move_circle(dir: Vector2 = dir_to_player, speed: float = circle_speed, direction: bool = circle_direction) -> void:
	var tangent: Vector2
	if direction:
		tangent = Vector2(dir.y, -dir.x).normalized()
	else:
		tangent = Vector2(-dir.y, dir.x).normalized()
	velocity = tangent * speed
	pass
	
func update_texture_progress_bar( hp : int )->void:
	texture_progress_bar.value = hp

```
## Witch
```gdscript
"""
创建日期: 2026.8.17
更新日期: 2026.8.17
编写者: Dreammoon
"""
class_name Witch extends Enemy
# =================================== 属性 ===================================
@export var max_hp: int = 5
var hp: int

@export var detect_radius: float = 150.0 # 发现玩家的距离
@export var emergency_distance : float = 72.0
var distance_to_player: float
var dir_to_player: Vector2 = Vector2.ZERO

const SCN_FIRE_BALL = preload("res://Scenes/Magics/Scn_FireBall.tscn")
var attack_cooldown_left: float = 3.0
# =================================== 节点引用 ===================================
@onready var hurt_box: HurtBox = $HurtBox
@onready var state_machine: StateMachine = $StateMachine
@onready var weapon_pivot: Node2D = $WeaponPivot
@onready var sprite_2d: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var texture_progress_bar: TextureProgressBar = $Sprite2D/TextureProgressBar

# =================================== 信号 ===================================
signal enemy_damaged()
# =================================== 引擎虚函数 ===================================
# 定义：Godot 引擎自动调用的函数。如 _ready, _process, _physics_process, _input, _enter_tree 等
# 作用：只写“流转逻辑”和“信号绑定”，不写具体的业务计算细节。
func _ready():
	hp = max_hp
	update_texture_progress_bar(hp)
	state_machine.initialize(self)
	
	hurt_box.damaged.connect(take_damage)


func _physics_process(delta: float):
	if PlayerManager.get_player():
		dir_to_player = PlayerManager.get_player().global_position - weapon_pivot.global_position
		update_facing(dir_to_player)
		distance_to_player = dir_to_player.length()
	#print(distance_to_player)
	
		
	
	move_and_slide()

	
# =================================== 自定义函数 ===================================
# 命名规范：以 _on_ 开头，后接“发射信号的节点名_信号名”
# 定义：被动的，由某个信号触发才执行。
# 作用：只做“转发/过滤”，不直接修改数据（解耦表现与逻辑）


# 核心业务逻辑 
# 命名规范：无下划线前缀（或加 export 暴露），如 take_damage, move_to_target
# 定义：主动的，包含具体数学计算和状态机切换。
# 作用：修改 HP、计算伤害、修改 velocity、切换 current_state。
func magic_attack() -> void:
	var fire_ball = SCN_FIRE_BALL.instantiate()
	
	fire_ball.direction = (PlayerManager.get_player_position() - weapon_pivot.get_global_position() ).normalized()
	weapon_pivot.add_child(fire_ball)
	fire_ball.set_caster(1)
	fire_ball.change_mask(6 , true)

func big_magic_attack(scale_num : int) -> void:
	var fire_ball = SCN_FIRE_BALL.instantiate()
	
	fire_ball.direction = (PlayerManager.get_player_position() - weapon_pivot.get_global_position() ).normalized()
	fire_ball.scale = Vector2(scale_num, scale_num)
	
	
	weapon_pivot.add_child(fire_ball)
	fire_ball.change_damage_num(3)
	fire_ball.change_mask(6 , true)
	fire_ball.speed = 100
	fire_ball.set_caster(1)

func update_facing(dir: Vector2) -> void:
	if dir.x != 0:
		sprite_2d.flip_h = dir.x < 0

func take_damage(hitbox: HitBox) -> void:
	if hp > 0:
		hp -= hitbox.damage
		enemy_damaged.emit()
		update_texture_progress_bar(hp)
	

func animation_update(ani_name: String):
	animation_player.play(ani_name)
	pass

func update_texture_progress_bar( hp : int )->void:
	texture_progress_bar.value = hp

```
# AIResponse
错误 (8, 9)： The member "max_hp" already exists in parent class Enemy.

好的，这是 GDScript 的**显式继承规则**，不是引擎 Bug，而是语言设计上防止你无意中覆盖父类变量。

---

## 问题根源

在 GDScript 中，子类**不能重新声明**父类已经定义过的变量（即使是相同类型也不允许）。这是为了防止：
1. 子类意外隐藏父类的变量
2. 导致继承链中的多态性混乱

当你写 `@export var max_hp: int = 5` 时，Godot 会检查父类 `Enemy` 中是否已经存在 `max_hp`，如果存在则报错。

---

## 正确做法：在 Enemy 基类中定义，子类只赋值

**Enemy.gd（基类）**

```gdscript
class_name Enemy extends CharacterBody2D

# =================================== 基类属性（数据定义） ===================================
@export var max_hp: int = 5          # ← 在这里定义，子类不用再写
@export var move_speed: float = 30.0
@export var detect_radius: float = 150.0

var hp: int                          # 当前血量，运行时变量
var dir_to_player: Vector2 = Vector2.ZERO
var distance: float = 0.0

# =================================== 基类节点引用（如果有共同的） ===================================
@onready var hurt_box: HurtBox = $HurtBox
@onready var sprite_2d: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer

# =================================== 信号 ===================================
signal enemy_damaged()

# =================================== 基类虚函数 ===================================
func _ready():
    hp = max_hp
    hurt_box.damaged.connect(take_damage)

func _physics_process(delta):
    move_and_slide()

# =================================== 基类公共方法 ===================================
func take_damage(hitbox: HitBox) -> void:
    if hp > 0:
        hp -= hitbox.damage
        enemy_damaged.emit()
        update_hp_display()

func update_hp_display() -> void:
    # 如果有血条节点，更新它
    pass

func update_facing(dir: Vector2) -> void:
    if dir.x != 0:
        sprite_2d.flip_h = dir.x < 0

func animation_update(ani_name: String):
    animation_player.play(ani_name)
```

---

**TreeMonster.gd（子类，只写差异化部分）**

```gdscript
class_name TreeMonster extends Enemy

# =================================== 子类专属属性 ===================================
@export var attack_radius: float = 16.0
@export var attack_cooldown: float = 1.0
@export var circle_speed: float = 40.0
@export var circle_distance: float = 72.0
@export var circle_switch_interval: float = 2.0

var attack_cooldown_left: float = 0.0
var is_attacking: bool = false
var circle_direction: bool = true
var circle_timer: float = 0.0

# =================================== 子类专属节点引用 ===================================
@onready var hit_box: HitBox = $WeaponPivot/HitBox
@onready var state_machine: StateMachine = $StateMachine
@onready var texture_progress_bar: TextureProgressBar = $Sprite2D/TextureProgressBar

# =================================== 子类虚函数 ===================================
func _ready():
    # 调用父类的 _ready（它会初始化 hp 和绑定 hurt_box）
    super._ready()
    
    # 子类特有初始化
    hit_box.monitoring = false
    state_machine.initialize(self)
    player_ref = get_player_ref()
    update_texture_progress_bar(hp)

func _physics_process(delta):
    attack_cooldown_left = maxf(attack_cooldown_left - delta, 0.0)
    
    if not player_ref:
        velocity = Vector2.ZERO
        move_and_slide()
        return
    
    dir_to_player = player_ref.global_position - global_position
    distance = dir_to_player.length()
    
    super._physics_process(delta)  # 调用父类的 move_and_slide()

# =================================== 子类专属方法 ===================================
func get_player_ref() -> Player:
    if PlayerManager.player:
        return PlayerManager.player
    var player_node := get_tree().get_first_node_in_group("player")
    if player_node is Player:
        return player_node
    return null

func move_towards(dir: Vector2 = dir_to_player, speed: float = move_speed) -> void:
    velocity = dir.normalized() * speed
    update_facing(dir)

func move_away(dir: Vector2 = dir_to_player, speed: float = move_speed * 2) -> void:
    velocity = -dir.normalized() * speed

func move_circle(dir: Vector2 = dir_to_player, speed: float = circle_speed, direction: bool = circle_direction) -> void:
    var tangent: Vector2
    if direction:
        tangent = Vector2(dir.y, -dir.x).normalized()
    else:
        tangent = Vector2(-dir.y, dir.x).normalized()
    velocity = tangent * speed

func update_texture_progress_bar(hp_value: int) -> void:
    texture_progress_bar.value = hp_value

# 覆盖父类的更新方法（如果血条样式不同）
func update_hp_display() -> void:
    update_texture_progress_bar(hp)
```

---

**Witch.gd（另一个子类）**

```gdscript
class_name Witch extends Enemy

# =================================== 子类专属属性 ===================================
@export var emergency_distance: float = 72.0
@export var fireball_speed: int = 150

const SCN_FIRE_BALL = preload("res://Scenes/Magics/Scn_FireBall.tscn")
var attack_cooldown_left: float = 3.0

# =================================== 子类专属节点引用 ===================================
@onready var state_machine: StateMachine = $StateMachine
@onready var weapon_pivot: Node2D = $WeaponPivot
@onready var texture_progress_bar: TextureProgressBar = $Sprite2D/TextureProgressBar

func _ready():
    super._ready()
    state_machine.initialize(self)
    update_texture_progress_bar(hp)

func _physics_process(delta):
    var player = PlayerManager.get_player()
    if player:
        dir_to_player = player.global_position - weapon_pivot.global_position
        update_facing(dir_to_player)
        distance = dir_to_player.length()
    
    super._physics_process(delta)

func magic_attack() -> void:
    var fire_ball = SCN_FIRE_BALL.instantiate()
    fire_ball.direction = (PlayerManager.get_player_position() - weapon_pivot.global_position).normalized()
    fire_ball.set_caster(1)
    fire_ball.change_mask(6, true)
    weapon_pivot.add_child(fire_ball)

func big_magic_attack(scale_num: int) -> void:
    var fire_ball = SCN_FIRE_BALL.instantiate()
    fire_ball.direction = (PlayerManager.get_player_position() - weapon_pivot.global_position).normalized()
    fire_ball.scale = Vector2(scale_num, scale_num)
    fire_ball.change_damage_num(3)
    fire_ball.change_mask(6, true)
    fire_ball.speed = 100
    fire_ball.set_caster(1)
    weapon_pivot.add_child(fire_ball)

func update_texture_progress_bar(hp_value: int) -> void:
    texture_progress_bar.value = hp_value

func update_hp_display() -> void:
    update_texture_progress_bar(hp)
```

---

## 重构思路总结（用于其他系统）

| 步骤 | 操作 | 说明 |
|---|---|---|
| **1. 找共性** | 对比两个子类，列出重复的 `@export` 变量、`@onready` 节点、`func` 函数 | 例如：`max_hp`、`hurt_box`、`take_damage()` |
| **2. 提升到基类** | 把这些共有的东西**只写一次**到 `Enemy.gd` 中 | 子类中删除这些声明 |
| **3. 差异化保留** | 子类只保留自己特有的变量和逻辑 | 例如：`circle_speed` 只在 TreeMonster 里有 |
| **4. 调用父类** | 在子类的 `_ready()` 和 `_physics_process()` 中调用 `super._ready()` | 确保基类逻辑也执行 |
| **5. 覆盖钩子** | 如果需要不同的实现，覆盖基类的虚函数（如 `update_hp_display()`） | 基类提供一个空壳函数，子类重写 |

---

## 常见陷阱

| 陷阱 | 说明 | 解决方案 |
|---|---|---|
| **变量冲突** | 子类不能重新声明父类已有的变量 | 在子类中**删除**重复声明，直接用父类的 |
| **忘记调用 `super`** | 子类的 `_ready()` 覆盖了父类的，导致父类逻辑不执行 | 在子类中写 `super._ready()` |
| **类型不一致** | 子类中 `@onready var hurt_box` 的类型与父类不同 | 保持一致，或者不用 `@onready` 直接在父类中用 `$` 获取 |

---

## 如果你要重构 `Magic` 或 `Item`

同样的流程：

1. 创建 `BaseMagic.gd`，定义 `damage`、`speed`、`direction`、`caster`
2. 创建 `BaseItem.gd`，定义 `pickup()`、`_on_effect()`
3. 让 `FireBall` 继承 `BaseMagic`，让 `HealthPotion` 继承 `BaseItem`

你现在已经成功地把 `Enemy` 抽象出来，说明你已经具备了这种能力。下一步如果卡在 `FireBall` 或 `MagicBarrier` 的抽象上，随时问我。