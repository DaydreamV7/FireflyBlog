---
title: Debian13安装雾凇拼音
published: 2026-07-08
description: 在Debian13安装雾凇输入法
image: /assets/images/IT/debian.jpg
tags: [Debian , Linux,  运维, 环境配置]
category: 运维
draft: false
slug: IT-Ops-Debian13RimeInput
author: DaydreamV
comment: true
---
# 前言
由于我在Debian13没有中文输入法，决定安装RIME输入法

# 具体步骤
## 查看教程
官网
[下載及安裝 | RIME | 中州韻輸入法引擎](https://rime.im/download/)

## 认识Fcitx5
可以把 Fcitx 5 理解成一个“输入法管家”。

- **它是框架，不是输入法**：Fcitx 5 本身不负责打字，它提供一个平台，让各种输入法引擎（比如 RIME、拼音、五笔）可以在上面工作。
    
- **它的优势**：相比上一代 Fcitx 4，Fcitx 5 的响应速度更快、兼容性更好，也更容易自定义。它提供了图形化的配置工具，让你可以方便地管理、切换不同的输入法。
    
- **直接用？可以，但有局限**：Debian 13 预装的 Fcitx 5 可以让你**直接使用系统自带的拼音输入法**。如果你对输入法没有特殊要求，它完全够用。但它的可定制性远不如 RIME。
## 安装
```Bash
sudo apt install fcitx5-rime
```
## 下载雾凇拼音

## 配置
调试输入法
打开 Fcitx 5配置
![[Linux-输入法-Fcitx配置.png]]

安装完成后，通过 im-config 切换输入法框架：

```Bash
im-config -n fcitx5
```

> ⚠️ 踩坑点 1：执行完这一步必须重启电脑（或注销），否则系统还在运行 IBus，Fcitx5 无法接管键盘。
## Zip
我是下载Release当中的full.zip
![[Debian-输入法-Rime路径.png]]

发现不对劲，不如用Git
## Git
安装Git

推荐使用 git 部署，这样以后更新词库只需要 git pull，非常方便。


```Bash
# 1. 创建 Fcitx5 的 Rime 目录（如果没有）
mkdir -p ~/.local/share/fcitx5/rime

# 2. 进入目录
cd ~/.local/share/fcitx5/rime

# 3. 克隆仓库（--depth 1 减少下载体积）
git clone --depth 1 https://github.com/iDvel/rime-ice.git
```
配置

这一步是为了符合 Windows/Mac 的使用习惯：按 Shift 键切换中/英文。

在 ~/.local/share/fcitx5/rime 目录下新建（或编辑）default.custom.yaml

```Bash
sudo nano ~/.local/share/fcitx5/rime/default.custom.yaml
## 如果没有这个文件需要自行创建
```
```Bash
patch:
  # 1. 只有这一行，Rime 才会真正使用雾淞拼音
  schema_list:
    - schema: rime_ice

  # 2. 覆盖快捷键设置
  "ascii_composer/switch_key":
    Shift_L: commit_code # 左 Shift：上屏并切换中英
    Shift_R: noop # 右 Shift：无操作（防止误触）
    Control_L: noop # 屏蔽 Ctrl 切换，避免与系统快捷键冲突
    Control_R: noop
```


# 参考文献
[1] [Ubuntu系统雾凇输入法配置](https://www.neomelt.cloud/posts/ubuntu-input-setting)
