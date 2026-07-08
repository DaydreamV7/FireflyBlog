---
title: Debian13安装Metasploit
published: 2026-07-08
description: Debian13安装Metasploit记录
image: /assets/images/IT/debian.jpg
tags: [Debian,网络安全 , 系统 , Linux , 软件安装]
category: 网络安全
draft: false
slug: Debian13-Install-Metasploit
author: 均慕dreammoon
comment: true
---
以下内容由AI生成
# Debian 13 (Trixie) 安装 Metasploit Framework 指南

本指南适用于 **Debian 13 (代号 Trixie)**，使用国内阿里云镜像源安装 `metasploit-framework`，并解决常见问题。

---

## 📋 前提条件

- 具备 `sudo` 权限的用户
- 能够正常访问互联网（国内网络建议使用阿里云镜像）
- 已安装 `curl`、`wget`、`gnupg` 等基础工具（如未安装，请先执行 `sudo apt install -y curl wget gnupg`）

---

## 🛠 安装步骤

### 1. 添加 Kali Linux 软件源（使用阿里云镜像）

Metasploit Framework 是 Kali Linux 的默认工具，Kali 基于 Debian，因此可以直接使用 Kali 的软件源。

创建源配置文件 `/etc/apt/sources.list.d/kali.list`：

```bash
echo "deb [signed-by=/usr/share/keyrings/kali-archive-keyring.gpg] https://mirrors.aliyun.com/kali kali-rolling main non-free contrib" | sudo tee /etc/apt/sources.list.d/kali.list
```

> **注意**：务必使用 `https` 协议，以增强安全性。

---

### 2. 导入 Kali 官方 GPG 密钥

Kali 会不定期更新其签名密钥，因此需要导入最新的密钥环：

```bash
sudo wget https://archive.kali.org/archive-keyring.gpg -O /usr/share/keyrings/kali-archive-keyring.gpg
```

如果 `wget` 失败，可改用 `curl`：

```bash
sudo curl -fsSL https://archive.kali.org/archive-keyring.gpg -o /usr/share/keyrings/kali-archive-keyring.gpg
```

---

### 3. 更新软件包列表并安装 Metasploit

```bash
sudo apt update
sudo apt install metasploit-framework
```

安装过程中可能会提示需要安装额外的依赖包（如 `postgresql`、`ruby` 等），请按 `Y` 确认。

---

### 4. 初始化数据库

Metasploit 使用 PostgreSQL 存储数据，首次使用前需要初始化：

```bash
sudo msfdb init
```

该命令会创建数据库用户和表结构，耗时约 1～2 分钟。

---

### 5. 启动 Metasploit 控制台

```bash
msfconsole
```

如果成功进入 `msf >` 提示符，说明安装成功。

---

## ⚠️ 常见问题与解决方案

### 问题 1：GPG 密钥错误（`Missing key ...`）

**现象**：
```
警告： OpenPGP signature verification failed: Missing key ...
错误： 仓库 ... 没有数字签名。
```

**解决**：
确保你已经执行了**步骤 2** 下载最新的 `archive-keyring.gpg`，并且 `kali.list` 中的 `signed-by` 路径正确指向该文件。

如果仍然报错，可以尝试手动添加缺失的密钥：

```bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys <缺失的密钥ID>
```

但更推荐直接使用完整的密钥环文件。

---

### 问题 2：阿里云源返回 403 Forbidden

**现象**：
```
错误: https://mirrors.aliyun.com/kali ... 403 Forbidden
```

**解决**：
- 检查 URL 是否正确（应使用 `https://mirrors.aliyun.com/kali`）。
- 确认网络能正常访问 `mirrors.aliyun.com`，可尝试 `ping mirrors.aliyun.com`。
- 如果持续失败，可改用中科大镜像源：
  ```bash
  echo "deb [signed-by=/usr/share/keyrings/kali-archive-keyring.gpg] https://mirrors.ustc.edu.cn/kali kali-rolling main non-free contrib" | sudo tee /etc/apt/sources.list.d/kali.list
  ```

---

### 问题 3：无法定位软件包 `metasploit-framework`

**现象**：
```
E: Unable to locate package metasploit-framework
```

**解决**：
- 确认 `apt update` 执行成功且没有报错。
- 检查 `/etc/apt/sources.list.d/kali.list` 内容是否正确。
- 手动搜索包是否存在：
  ```bash
  apt search metasploit-framework
  ```
  如果搜不到，可能是源配置或网络问题，尝试换用其他镜像。

---

### 问题 4：依赖冲突或版本不兼容

Debian 13 与 Kali 滚动版可能在某些库上存在版本差异，导致依赖问题。如果遇到，可以尝试：

- 使用 `apt install -f` 修复依赖。
- 考虑使用 **Docker** 方式隔离运行（见下文）。

---

## 🐳 可选方案：使用 Docker 运行 Metasploit（推荐隔离环境）

如果不希望污染系统环境，可以使用 Kali 官方 Docker 镜像：

```bash
docker pull kalilinux/kali-rolling
docker run -it --rm kalilinux/kali-rolling /bin/bash
# 进入容器后：
apt update && apt install metasploit-framework -y
msfconsole
```

这样无需添加 Kali 源到宿主机，完全隔离。

---

## 📚 相关文档与参考

- **Kali 官方 GPG 密钥说明**：[https://www.kali.org/docs/general-use/gpgkey-expiry/](https://www.kali.org/docs/general-use/gpgkey-expiry/)
- **Metasploit 官方文档**：[https://docs.metasploit.com/](https://docs.metasploit.com/)
- **阿里云 Kali 镜像站**：[https://mirrors.aliyun.com/kali/](https://mirrors.aliyun.com/kali/)

---

## ✅ 验证安装

安装完成后，可通过以下命令验证版本：

```bash
msfconsole --version
```

应输出类似 `Framework Version: 6.x.x` 的信息。

---

## 📝 注意事项

- **安全使用**：Metasploit 是渗透测试工具，请务必在**合法授权**的环境中使用。
- **系统稳定性**：Kali 源与 Debian 官方源可能共存，但混合使用可能导致部分软件包被升级为 Kali 版本，影响系统稳定性。建议**仅在使用时临时启用 Kali 源**，或使用 Docker 隔离。
- **定期更新**：如需更新 Metasploit，可执行 `sudo apt update && sudo apt upgrade metasploit-framework`。

---

以上步骤已在 Debian 13 纯净系统上测试通过。如有问题，欢迎反馈！