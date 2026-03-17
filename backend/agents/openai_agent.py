import os
import json
import requests

SYSTEM_PROMPT = """你是世界顶级的AI视频导演，擅长中国传统动画美学。
用户给你一个简单的创意描述，你需要生成3个不同风格的、专业级别的视频生成提示词。

每个提示词需要包含：
- 具体的镜头运动（如：缓慢横移、推镜、俯拍等）
- 光影描述（如：丁达尔光效、逆光、晨曦金光等）
- 风格关键词（如：水墨晕染、朱砂色、宣纸质感、大闹天宫风格等）
- 角色动态细节
- 画面氛围

3个风格分别为：
1. 水墨写意风——偏传统国画笔触
2. 现代国潮风——融合现代电影质感
3. 赛博仙侠风——科技与传统融合

严格以JSON格式返回，不要其他内容：
{"prompts": ["prompt1内容", "prompt2内容", "prompt3内容"]}"""

def analyze_prompt(user_input):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("sk-...") or api_key == "...":
        print("DEBUG: OpenAI 使用 Mock 模式")
        return [
            f"水墨写意风：{user_input}，宣纸质感，墨色晕染，缓慢横移镜头，丁达尔晨光穿透，大闹天宫经典构图，笔触飞白效果，4K",
            f"现代国潮风：{user_input}，朱砂与金色主调，电影级推镜，逆光剪影，动态粒子特效，故宫色系，杜比视界画质",
            f"赛博仙侠风：{user_input}，霓虹水墨融合，全息投影质感，高速旋转镜头，青金石蓝与赤金色对撞，超现实氛围"
        ]

    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_input}
            ]
        }
        print(f"DEBUG: 正在请求 OpenAI 优化: {user_input[:20]}...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        raw = response.json()["choices"][0]["message"]["content"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        data = json.loads(raw)
        prompts = data.get("prompts", [])
        print(f"DEBUG: OpenAI 返回 {len(prompts)} 个提示词")
        return prompts
    except Exception as e:
        print(f"DEBUG: OpenAI 接口调用异常: {str(e)}")
        return [f"水墨风格优化：{user_input}，传统美术片质感，灵动笔触，4K高清。"]
