---
title: Godot状态机
published: 2026-07-24
description: Godot实现状态机
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-StateMachine
author: 均慕dreammoon
comment: true
---
# 核心部分
**状态机只负责“表现行为”**（动画、是否允许移动），**数据核心**（HP、伤害计算）必须留在角色本体。这就是行业标准架构。

状态池

状态切换

状态执行

# 直通式状态机
```gdscript
# =================================== 1. 状态枚举 ===================================
enum State {
    IDLE,
    CHASE,
    ATTACK,
    HURT
}

# =================================== 2. 当前状态变量 ===================================
var current_state: State = State.IDLE

# =================================== 3. 物理更新（调度器） ===================================
func _physics_process(delta: float):
    # 前置计算（例如获取目标、距离、冷却等）
    # var target = ...
    # var distance = ...

    # 状态调度
    match current_state:
        State.IDLE:
            _state_idle(delta)
        State.CHASE:
            _state_chase(delta)
        State.ATTACK:
            _state_attack(delta)
        State.HURT:
            _state_hurt(delta)

    move_and_slide()  # 如果是 CharacterBody2D

# =================================== 4. 各状态的执行函数（写具体逻辑） ===================================
func _state_idle(delta: float):
    # 行为：停止移动、播放待机动画
    # 切换条件：例如距离 <= 警戒范围 → current_state = State.CHASE
    pass

func _state_chase(delta: float):
    # 行为：向目标移动、转向
    # 切换条件：距离 > 警戒范围 → State.IDLE；距离 <= 攻击范围 → State.ATTACK
    pass

func _state_attack(delta: float):
    # 行为：停止移动、执行攻击（可用 Timer 或 await 控制帧）
    # 切换条件：攻击结束后 → State.CHASE 或 State.IDLE
    pass

func _state_hurt(delta: float):
    # 行为：停止移动、播放受击动画
    # 切换条件：受击结束后 → State.IDLE 或 State.CHASE
    pass
```

# GDQuest推荐的状态机实现方式
![[状态机.png]]
```gdscript
class_name StateMachine extends Node
# =================================== 属性 ===================================


var states : Array[ State ]
var prev_state : State
var current_state : State
# =================================== 节点引用 ===================================

# =================================== 信号 ===================================

# =================================== 引擎虚函数 ===================================
func _ready() -> void:
	process_mode = Node.PROCESS_MODE_DISABLED
	pass


func _process(delta: float) -> void:
	change_state( current_state.process( delta ) )
	pass
	
func _physics_process(delta: float) -> void:
	change_state( current_state.physics( delta ) )
	pass
	
func _unhandled_input(event: InputEvent) -> void:
	change_state( current_state.handleInput( event ) )
	pass

# =================================== 自定义函数 ===================================
func initialize( _player : Player ) -> void:
	# Initialize 初始化
	states = []
	for c in get_children():
		if c is State:
			states.append(c)
	if states.size() > 0:
		states[0].player = _player
		change_state( states[0] )
		process_mode = Node.PROCESS_MODE_INHERIT
		
func change_state( new_state : State ) -> void:
	if new_state == null || new_state == current_state:
		return
	
	if current_state:
		current_state.exit()
	
	prev_state = current_state
	current_state = new_state
	current_state.enter()

```

```gdscript
class_name State
extends Node

static var player: Player

func _ready() -> void:
	pass
	
func enter() -> void:
	pass
	
func exit () -> void:
	pass
	
func process ( _delta : float ) -> State:
	return null
	
func physics ( _delta : float ) -> State:
	return null
	
func handle_input ( _event : InputEvent ) -> State:
	return null
```

## 示例
玩家代码
```gdscript
class_name Player extends CharacterBody2D

# =================================== 属性 ===================================
const JUMP_VELOCITY = -400.0

var cardinal_direction : Vector2 = Vector2.DOWN #基本方向
var direction : Vector2 = Vector2.ZERO #方向

# =================================== 节点引用 ===================================
@onready var sprite_2d: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var state_machine: PlayerStateMachine = $StateMachine

# =================================== 虚函数 ===================================
func _ready() -> void:
	state_machine.Initialize(self)
	pass
	
func _process(delta: float) -> void:
	# 更新方向
	direction.x = Input.get_action_strength("right") - Input.get_action_strength("left")
	direction.y = Input.get_action_strength("down") - Input.get_action_strength("up")
	pass
	
func _physics_process(delta: float) -> void:
	move_and_slide()

# =================================== 自定义函数 ================================
# 更新基本方向
func setDirection() -> bool:
	var new_dir : Vector2 = cardinal_direction
	if direction == Vector2.ZERO:
		return false
	
	if direction.y == 0:
		new_dir = Vector2.LEFT if direction.x < 0 else Vector2.RIGHT
	elif direction.x == 0:
		new_dir = Vector2.UP if direction.y < 0 else Vector2.DOWN
		
	if new_dir == cardinal_direction:
		return false
	
	cardinal_direction = new_dir
	sprite_2d.scale.x = -1 if cardinal_direction == Vector2.LEFT else 1
	return true
	
# 更新动画
func update_animation( state : String ) -> void:
	animation_player.play( state + "_" + AnimDirection() )
	pass

# 匹配动画
func anim_direction() -> String:
	if cardinal_direction == Vector2.DOWN:
		return "down"
	elif cardinal_direction == Vector2.UP:
		return "up"
	else:
		return "side"

```

StateIdle
```gdscript
class_name State_Idle
extends State

@onready var walk: State = $"../Walk"


func enter() -> void:
	player.UpdateAnimation( "idle" )
	pass
	
func exit () -> void:
	pass
	
func process ( _delta : float ) -> State:
	if player.direction != Vector2.ZERO:
		return walk
	player.velocity = Vector2.ZERO
	return null
	
func physics ( _delta : float ) -> State:
	return null
	
func handleInput ( _event : InputEvent ) -> State:
	return null
```

StateWalk
```gdscript
class_name State_Walk
extends State

@export var move_speed : float = 150.0

@onready var idle: State = $"../Idle"


func enter() -> void:
	player.UpdateAnimation( "walk" )
	pass
	
func exit () -> void:
	pass
	
func process ( _delta : float ) -> State:
	if player.direction == Vector2.ZERO:
		return idle
		
	player.velocity = player.direction * move_speed
	
	if player.SetDirection():
		player.UpdateAnimation("walk")
	return null
	
func physics ( _delta : float ) -> State:
	return null
	
func handleInput ( _event : InputEvent ) -> State:
	return null
```