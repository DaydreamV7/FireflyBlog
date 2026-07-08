---
title: Debian13加速Github
published: 2026-07-08
description: 无法访问Github，通过修改Hosts文件解决
image: /assets/images/IT/debian.jpg
tags: [Debian , Linux,  运维, 环境配置, 网络]
category: 运维
draft: false
slug: IT-Ops-Debian13NetworkGithub
author: DaydreamV
comment: true
---
# 前言
打开Github太慢
# 具体步骤
## 寻找相关Hosts配置
[Fetch Github Hosts](https://hosts.gitcdn.top/)

[maxiaof/github-hosts: 通过修改Hosts解决国内Github经常抽风访问不到,每日更新](https://github.com/maxiaof/github-hosts)

## 修改Hosts文件
```Bash
sudo /etc/hosts
```

先将如下添加进去
```Hosts
XXX.XX.XXX.X github.com
XXX.XXX.XX.X github.global.ssl.fastly.net
```

## 更新DNS服务器
如果你的Debian13没有安装刷新DNS相关软件，那么是没有缓存直接生效的。
1. **编辑 `/etc/resolv.conf`**：
```Bash
sudo nano /etc/resolv.conf
```
1. **添加或修改 `nameserver` 行**：  
```Text
nameserver 8.8.8.8
nameserver 1.1.1.1
nameserver 223.5.5.5
```
**注意**：在 Debian 9 及以上版本中，`/etc/resolv.conf` 可能是一个软链接，重启后会被重置。如果遇到这种情况，需要先删除软链接再创建实体文件[](https://www.yisu.com/ask/97933182.html)。

## 其他问题
如果你尝试点击知乎或者CSDN发现页面崩溃，可能浏览器出问题了，重启浏览器可以解决。
## 二次修改
把成功访问到的Hosts文件内容添加到本地。