# 命运之扉 · Render 部署说明

这个目录已经是可部署版本，包含网页、牌面、历史页和 AI 解读所需的知识库。

## 一、上传到 GitHub

1. 注册或登录 GitHub。
2. 新建一个仓库，例如 `tarot-orbit`，选择 Private（私有）或 Public（公开）均可。
3. 把本目录里的**全部文件和文件夹**上传到仓库根目录。
4. 不要上传 `.env`。本目录没有真实密钥。

## 二、部署到 Render

1. 注册或登录 Render。
2. 点击 `New` → `Blueprint`。
3. 连接刚才的 GitHub 仓库。
4. Render 会自动读取根目录的 `render.yaml`。
5. 按提示填写三个环境变量：
   - `TAROT_API_BASE`：例如 `https://linksub.fun/v1`
   - `TAROT_API_KEY`：你的 API Key
   - `TAROT_MODEL`：例如 `deepseek-v4-flash`
6. 点击部署，等待完成。

部署成功后会得到类似下面的固定链接：

```text
https://tarot-orbit-xxxx.onrender.com
```

## 三、检查是否正常

打开：

```text
https://你的链接/api/health
```

应看到：

- `"ai": {"configured": true, ...}`
- `"knowledge": {"ready": true, "cards": 78, ...}`
- `"spreads": {"ready": true, ...}`

如果 `configured` 是 `false`，检查 Render 的三项 AI 环境变量是否填写正确。

## 免费版说明

- Render 免费实例长时间无人访问后会休眠。
- 朋友第一次打开时可能需要等待几十秒。
- 历史记录保存在每个访问者自己的浏览器中，不需要数据库。

