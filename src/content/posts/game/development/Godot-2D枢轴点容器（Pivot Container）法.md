---
title: Godot-2D枢轴点容器（Pivot Container）法
published: 2026-07-29
description: 为了实现Godot2D 围绕人物360度旋转攻击
image: /assets/images/game/Godot_icon.svg
tags: [Godot, 游戏引擎, 游戏开发]
category: 游戏开发
draft: false
slug: Godot-2D-privot-container-method
author: 均慕dreammoon
comment: true
---
# 前言
由于没有经验，一开始的方案是想着让攻击攻击图片什么去绑定人物图片来实现围绕人物图片原点来进行只修改rotation达成旋转攻击目的。或者通过修改图片的原点，比如Transform和offset来实现原点在人物图片中心，从而修改rotation就可以围绕人物旋转。但有更方便的方式我没有想到。
就是通过额外的资源从而实现高维目的。
关键在于**不要直接把图片挂在 Player 下，而是挂在一个“枢轴节点（Node2D）”下**。
# 步骤
## 设计
以下内容借助deepseek AI生成
**场景树结构如下：**

```text
Player (CharacterBody2D)
├── Sprite2D (角色的身体/图片)
├── StateMachine
└── WeaponPivot (Node2D)   <--- 位置设为 (0, 0)，永远在人物中心
    ├── Sprite2D (攻击特效/武器图片)  <--- 位置偏移到右侧，比如 (30, 0)
    └── HitBox (Area2D)              <--- CollisionShape 同样偏移到右侧 (30, 0)
```
**为什么这样做？**

1. **省资源（针对你的第 3 点）**：你不需要移动图片的位置（`position`），也不需要算偏移量（`offset`）。你只需要**旋转 `WeaponPivot` 这个节点**。它的所有子节点（武器图片 + 攻击碰撞框）会**自动跟着转**，形成完美的 360° 圆弧。
2. **一击脱离（针对你的第 2 点）**：视觉（Sprite2D）和逻辑（HitBox）**捆绑在同一个枢轴下**。旋转枢轴，视觉和判定框同步旋转，永远不会有“看上去打到了但没伤害”或“没打到却受伤”的错位感。
## 攻击实现
**在按下攻击键（或进入攻击状态）的那一帧，计算方向，然后“锁死（Lock）”这个方向。**
参考代码：
```gdscript
# 假设这是 Attack.gd
func enter() -> void:
    # 1. 获取目标方向（鼠标位置或玩家朝向）
    var mouse_pos = get_global_mouse_position()  # 鼠标指向
    var dir_to_target = (mouse_pos - player.global_position).normalized()
    
    # 2. 【核心操作】只在进入状态时修改一次旋转
    player.weapon_pivot.rotation = dir_to_target.angle()
    
    # 3. 开启 HitBox（你的攻击判定）
    player.weapon_pivot.hit_box.monitoring = true
    
    # 4. 播放攻击动画
    player.animation_player.play("attack")

func physics_process(delta):
    # 攻击期间玩家禁止移动
    player.velocity = Vector2.ZERO
    
    # 注意：这里绝对不要再写 rotation = xxx，否则攻击动作会乱飘！
```
**这样做的好处：**

- **性能极佳**：旋转计算只在点击鼠标/按键的那一刻发生。
    
- **手感扎实**：攻击方向是确定且稳定的，不会因为玩家在挥刀过程中稍微移动鼠标而导致武器乱甩。