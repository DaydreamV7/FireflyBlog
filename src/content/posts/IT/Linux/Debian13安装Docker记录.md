---
title: Debian13安装Docker记录
published: 2026-05-23
description: Debian13安装Docker记录
image: /assets/images/dream/真岛吾郎像素.jpg
tags: [Linux, Docker, 记录]
category: IT-配置
draft: false
slug: Record-of-installing-Docker-on-Debian13
author: 均慕dreammoon
comment: true
---
# 参考文章
[https://www.gaoliming.top/posts/e5f6g7h8.html](https://www.gaoliming.top/posts/e5f6g7h8.html)

[https://docs.docker.com/engine/install/debian/#upgrade-docker-after-using-the-convenience-script](https://docs.docker.com/engine/install/debian/#upgrade-docker-after-using-the-convenience-script)

# 背景
WSL下的Debian环境

# 卸载旧版本
```bash
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-doc podman-docker containerd runc | cut -f1)
```

# 安装方法
## 相关准备
```bash
# Add Docker's official GPG key:
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
```

需要通过docker.sources获得软件源，在更新软件源后即可安装软件

## 安装软件
```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 运行
验证安装

```bash
sudo systemctl status docker
```

手动运行

```bash
sudo systemctl start docker
```

## 验证安装
```bash
sudo docker run hello-world
```

由于本地没有，需要等待一定时间从其他网站上

# 阻碍
docker --version只能证明软件安装成功，而docker run hello-world能够说明能正常使用容器，对于新手会有较强的心理去通过这个实现。但由于国内网络问题会导致拉取官方源的容器会无法成功，则需要配置本地源解决。  
  
以下内容借助DeepSeekV4实现解决

## **<font style="color:rgb(15, 17, 21);">停止并移除无用的Docker服务</font>**
停止并移除无用的Docker服务

如果你之前尝试通过systemctl start docker或sudo dockerd等命令启动了Docker，请先将其停止，避免冲突。

bash

```bash
# 尝试停止可能正在运行的Docker守护进程
sudo systemctl stop docker docker.socket containerd 2>/dev/null
sudo pkill dockerd 2>/dev/null
```

## 创建或修改配置文件
使用以下命令，直接将可用的国内镜像源写入配置文件。多个源可以提高容错性。
```plain
# 创建配置目录
sudo mkdir -p /etc/docker

# 写入镜像加速配置（使用实测可用的镜像源）
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://docker.m.daocloud.io"
  ]
}
EOF
```
我使用了截至2026年5月仍稳定可用的镜像源。你可以在文末的“当前可用的镜像源”部分找到更多选择。
https://www.cnblogs.com/BlogNetSpace/p/19864430


## **<font style="color:rgb(15, 17, 21);">重新加载并启动 Docker 守护进程</font>**
正确的启动方式是：先通过sudo dockerd启动守护进程，再使用sudo docker命令。
```plain
# 以后台模式启动 Docker 守护进程
sudo dockerd > /dev/null 2>&1 &
```

注意：sudo dockerd & 命令会在后台启动 Docker 守护进程，并将所有输出重定向到 /dev/null。

## **<font style="color:rgb(15, 17, 21);">验证配置是否生效</font>**
执行以下命令，检查输出中 Registry Mirrors 一行是否包含了刚才配置的地址。

```bash
sudo docker info | grep -A 5 "Registry Mirrors"
```

## **<font style="color:rgb(15, 17, 21);">测试拉取</font>**
再次运行 hello-world 镜像。
```bash
sudo docker run hello-world
```
此时，你应该能看到拉取成功的提示。

如果你已经通过 systemctl 或其他方式启动了 Docker，那么 sudo dockerd & 可能会因端口冲突而无法启动。这种情况下，你需要先停止冲突的进程，然后再执行 sudo dockerd &。

## 结果
如下打印信息

```bash
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
XXXX: Download complete
XXXX: Pull complete
Digest: sha256:XXXXXXXX
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
1. The Docker client contacted the Docker daemon.
2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
(amd64)                
3. The Docker daemon created a new container from that image which runs the
executable that produces the output you are currently reading.
4. The Docker daemon streamed that output to the Docker client, which sent it
to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
$ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
https://hub.docker.com/

For more examples and ideas, visit:
https://docs.docker.com/get-started/
```

