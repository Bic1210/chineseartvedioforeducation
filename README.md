# 美影 IP 测评工作台 (Seedance & Multi-Model Video Gen)

本项目是一个专为美育教育设计的 AI 视频生成测评平台，支持通过大模型优化提示词，并一键分发至多个主流视频生成模型进行风格一致性与质量测评。

## 🚀 项目架构

- **前端 (Frontend)**: React + Vite + Tailwind CSS + DaisyUI
- **后端 (Backend)**: Flask + Python 1.0+ SDK (OpenAI & Replicate & Ark)
- **核心组件**:
  - `ChatBox`: 提示词优化智能体，内置中国动画学派美化逻辑。
  - `VideoGrid`: 四宫格视频对比评估系统。
  - `Agents`: 独立模型接入层（Seedance, Kling, Sora, VeoFast）。

## ⚙️ 快速开始

### 1. 后端配置
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows 使用 venv\Scripts\activate
pip install -r requirements.txt
```

在 `backend/.env` 中填充以下 Key：
- `OPENAI_API_KEY`: 用于提示词分析助手。
- `ARK_API_KEY`: 用于 Seedance 1.5 真实视频生成。
- `REPLICATE_API_TOKEN`: 用于 Sora 和 VeoFast 真实视频生成。
- `KLING_ACCESS_KEY`/`SECRET_KEY`: 用于 Kling 接入。

运行后端：
```bash
python app.py
```

### 2. 前端配置
```bash
cd frontend
npm install
npm run dev
```

访问地址：`http://localhost:5173` (或终端显示的 Network IP)。

## 🛠️ 已接入模型
- **Seedance 1.5**: 经由火山方舟 (Ark) 真实接入。
- **Sora (SVD 镜像)**: 经由 Replicate 真实接入。
- **VeoFast**: 经由 Replicate 真实接入。
- **Kling**: 接口逻辑已预留。

## 🎨 测评维度
- **一致性**: 角色与动作的还原度。
- **连贯性**: 视频帧间抖动控制。
- **意境感/水墨感**: 针对中国动画学派特征的专项评价。

---
*Created by Github Copilot*
