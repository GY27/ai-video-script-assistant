# AI 短视频脚本助手

一个可直接部署到 Cloudflare Pages 的轻量 Demo：输入主题后，生成 3 个黄金开头、完整分镜和可复制到提词器的纯口播稿。电脑、平板和手机均可使用。

默认是 **Demo 模式**，不需要购买模型 API，也不需要填写 API Key。

## 本地打开

### 只看页面

直接双击 `index.html`，即可查看页面外观。

### 完整体验（含生成接口）

1. 安装 [Node.js LTS](https://nodejs.org/)。
2. 在项目文件夹打开终端，执行：

   ```bash
   cp .dev.vars.example .dev.vars
   npx wrangler pages dev .
   ```

3. 浏览器打开终端显示的本地地址（通常是 `http://localhost:8788`）。

`DEMO_MODE=true` 时，点击生成会返回完整的模拟脚本，无需 API Key。

## 上传到 GitHub

1. 登录 [GitHub](https://github.com)，点击右上角 **+** → **New repository**。
2. Repository name 可填写 `ai-video-script-assistant`，保持 Public 或 Private 都可以，然后点击 **Create repository**。
3. 在本项目文件夹打开终端，按 GitHub 新仓库页面给出的 “push an existing repository” 命令执行；通常是：

   ```bash
   git remote add origin 你的 GitHub 仓库地址
   git branch -M main
   git push -u origin main
   ```

> 不要上传 `.dev.vars`。它已被 `.gitignore` 忽略，里面可能放有本地 API Key。

## 部署到 Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**。
2. 授权并选择刚才创建的 GitHub Repository。
3. 在构建设置中填写：

   | 项目 | 填写内容 |
   | --- | --- |
   | Framework preset | `None` |
   | Production branch | `main` |
   | Build command | 留空 |
   | Build output directory | `.` |
   | Root directory | 留空 |

4. 点击 **Save and Deploy**。
5. 第一次部署完成后，Cloudflare 会显示一个类似 `https://你的项目名.pages.dev` 的网址。这就是可公开访问的网址；复制它到电脑或手机浏览器即可。

以后向 GitHub 的 `main` 分支推送新代码，Cloudflare 会自动重新部署。

## 环境变量：Demo 模式与真实 AI

Cloudflare 首次部署后，进入：**Workers & Pages** → 你的项目 → **Settings** → **Variables and Secrets**。为 Production（也建议为 Preview）添加以下变量，然后重新部署。

| 变量名 | Demo 模式填写 | 真实 AI 模式填写 | 作用 |
| --- | --- | --- | --- |
| `DEMO_MODE` | `true` | `false` | 是否使用内置模拟结果 |
| `MODEL_API_KEY` | 不需要 | 你的模型服务 API Key（Secret） | 模型访问凭据 |
| `MODEL_BASE_URL` | 不需要 | API 的 OpenAI-compatible 根地址 | 模型服务地址 |
| `MODEL_NAME` | 不需要 | 具体模型名称 | 选择要调用的模型 |

把 `MODEL_API_KEY` 添加为 **Secret**，不要写进代码、GitHub 或浏览器。

### 接入 DeepSeek 示例

在 Cloudflare 中设置：

```text
DEMO_MODE=false
MODEL_API_KEY=你在 DeepSeek 控制台创建的 API Key
MODEL_BASE_URL=https://api.deepseek.com/v1
MODEL_NAME=deepseek-chat
```

保存后重新部署即可。此项目通过 OpenAI-compatible 接口调用模型；未来换用兼容该接口的服务时，通常只需要改这三个 `MODEL_*` 变量，不需要改前端代码。

## 项目结构

```text
index.html                 页面
style.css                  响应式样式
app.js                     页面交互、请求和复制功能
functions/api/generate.js  Cloudflare Pages Function：POST /api/generate
.dev.vars.example          本地环境变量示例（不含密钥）
```

真实 AI 模式中，一次点击只会发起一次模型调用；API Key 仅存在 Cloudflare 服务端环境变量中。
