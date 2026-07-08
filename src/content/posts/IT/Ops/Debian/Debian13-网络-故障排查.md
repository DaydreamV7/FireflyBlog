---
title: Debian13网络故障排查
published: 2026-07-08
description: 由于VM网络环境改变导致网络故障进行排查
image: /assets/images/IT/debian.jpg
tags: [Debian , Linux,  运维, 环境配置, 网络]
category: 运维
draft: false
slug: IT-Ops-Debian13Network-Troubleshooting
author: DaydreamV
comment: true
---
# 场景
![[Debian-网络故障-DHU.png]]
# 解决方案
解决方案由DeepSeek AI生成

## 🔧 第一步：检查ARP表（确认虚拟机的“认知”）

先看看虚拟机里有没有记录网关的MAC地址：

bash

arp -n

**判断标准**：

- 如果 `192.168.2.2` 对应的 `HWaddress` 显示为 `(incomplete)` 或 `00:00:00:00:00:00`，说明ARP彻底失败了。
    
- 如果根本看不到 `192.168.2.2` 这一行，同样说明没学到MAC地址。
    

---

## 🛠️ 第二步：检查宿主机（Windows）的VMware网络服务

这个问题90%的原因是**宿主机上的VMware NAT服务没启动或卡死了**。

**操作步骤（Windows）：**

1. 按下 `Win + R`，输入 `services.msc`，回车。
    
2. 在服务列表中找到 **VMware NAT Service** 和 **VMware DHCP Service**。
    
3. 查看它们的 **状态**：
    
    - 如果是 **"已停止"**：右键 → 启动。
        
    - 如果是 **"正在运行"**：右键 → 重新启动（这能解决服务卡死的问题）。
        
4. 确保这两个服务的 **启动类型** 都是 **"自动"**。
    

⚠️ **风险提示**：重启VMware NAT Service会导致瞬间网络中断，但你的虚拟机本来就连不上，所以没影响。

---

## 🔄 第三步：重置VMware虚拟网络编辑器

如果重启服务无效，可能是VMware虚拟网卡的配置出了异常。

**操作步骤：**

1. 打开VMware Workstation，点击菜单栏 **编辑 → 虚拟网络编辑器**。
    
2. **点击右下角的"更改设置"按钮**（需要管理员权限）。
    
3. 在列表中找到 **VMnet8**（这是NAT模式的默认网卡）。
    
4. 点击 **"还原默认设置"** 按钮。
    
    - 这会删除所有虚拟网卡并重新创建，相当于"重置网络环境"。
        
5. 重置完成后，回到虚拟机，执行：
    
    bash
    
    sudo dhclient -r ens33   # 释放旧IP
    sudo dhclient -v ens33   # 重新获取IP
    

---

## 🧪 第四步：验证修复效果

重新获取IP后，按顺序测试：
```Bash
# 1. 先看自己拿没拿到IP
ip addr show ens33
# 2. 再ping网关（这次应该通了）
ping -c 4 192.168.2.2
# 3. 再ping公共DNS（如果网关通了，这个应该也通）
ping -c 4 223.5.5.5
# 4. 最后ping域名（如果DNS配置正确，这里就通了）
ping -c 4 www.baidu.com

```


## 💡 如果以上都无效：终极Plan B

如果重置虚拟网络编辑器还不行，那就是**VMware的虚拟网卡驱动与Windows系统冲突了**（常见于Win11更新后）。

**操作：**

1. 关闭虚拟机。
    
2. 在VMware中，**右键虚拟机 → 设置**。
    
3. 找到 **网络适配器**，把它**移除**，然后点击 **添加** → 网络适配器 → 完成。
    
4. 重新启动虚拟机，重复 `dhclient` 获取IP的步骤。
    

这个方法会强制系统重新加载网卡驱动，比任何配置都管用。


# 参考文章
[Debian 网络故障排除 | 代码酷](https://www.echo.cool/docs/os/debian/debian-network-configuration/debian-network-troubleshooting/)