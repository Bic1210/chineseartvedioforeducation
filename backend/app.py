import os
import sys

# 必须在所有 imports 之前设置
os.environ["PYTHONIOENCODING"] = "utf-8"

# 再次强制重配置
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import threading
import time
import json
from dotenv import load_dotenv
from pathlib import Path
import concurrent.futures

# 强制使用绝对路径加载同一文件夹下的 .env
current_dir = Path(__file__).resolve().parent
env_path = current_dir / ".env"

if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                
                # 1. 去除行内注释 (例如: KEY=value # comment)
                if '#' in value:
                    value = value.split('#')[0]
                
                # 2. 去除首尾空白和引号
                value = value.strip().strip("'").strip('"')
                
                # 3. 针对 Key 为 Token/Key 的变量，强制去除不可见字符
                if "_KEY" in key or "_TOKEN" in key:
                    # 只保留 ASCII 可打印字符
                    value = "".join(c for c in value if 33 <= ord(c) <= 126)
                
                os.environ[key] = value

# 加载环境变量
load_dotenv()

# 修改启动检查逻辑，优先加载火山方舟 Key
api_key = os.getenv("ARK_API_KEY") or os.getenv("OPENAI_API_KEY")
if not api_key:
    print(f"❌ Error: ARK_API_KEY not found in environment or .env file")
    exit(1)

print(f"✅ 成功加载 Seedance API Key: {api_key[:10]}...")

# 检查 Kling Key
kling_ak = os.getenv("KLING_ACCESS_KEY", "").strip()
if kling_ak and not kling_ak.startswith("..."):
    print(f"✅ 成功加载 Kling API Key: {kling_ak[:5]}... (长度: {len(kling_ak)})")
else:
    print(f"⚠️  Kling API Key 未配置或为 Mock 模式")

# 3. 再导入相关 Agent
from agents.openai_agent import analyze_prompt
from agents.deepseek_agent import analyze_prompt_deepseek
from agents.seedance_agent import generate_seedance_video
from agents.kling_agent import generate_kling_video
from agents.sora_agent import generate_sora_video
from agents.veofast_agent import generate_veofast_video

app = Flask(__name__)
# 允许所有来源的跨域请求，解决前端无法访问的问题
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    接收用户输入，并调用 OpenAI 代理返回优化后的提示词。
    """
    data = request.json
    user_input = data.get('input', '')
    provider = data.get('provider', 'openai')
    print(f"DEBUG: 收到原始输入: {user_input}, provider: {provider}")

    if provider == 'deepseek':
        prompts = analyze_prompt_deepseek(user_input)
    else:
        prompts = analyze_prompt(user_input)

    if isinstance(prompts, str):
        prompts = [prompts]
    print(f"DEBUG: 返回 {len(prompts)} 个优化提示词")

    return jsonify({"prompts": prompts})

@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200
    
    try:
        data = request.json
        prompt = data.get('prompt', '')
        selected_models = data.get('models', ['Seedance', 'Kling', 'Sora', 'VeoFast'])
        print(f"\n[CLIENT REQUEST] Prompt: {prompt[:30]}, Models: {selected_models}")

        import importlib
        replicate_token = os.getenv("REPLICATE_API_TOKEN")

        def run_seedance():
            import agents.seedance_agent
            importlib.reload(agents.seedance_agent)
            return agents.seedance_agent.generate_seedance_video(prompt)

        def run_kling():
            import agents.kling_agent
            importlib.reload(agents.kling_agent)
            if not os.getenv("KLING_ACCESS_KEY") or os.getenv("KLING_ACCESS_KEY").startswith("..."):
                return {"name": "Kling", "status": "未选中", "progress": 0}
            return agents.kling_agent.generate_kling_video(prompt)

        def run_sora():
            import agents.sora_agent
            importlib.reload(agents.sora_agent)
            if not replicate_token or replicate_token.startswith("..."):
                return {"name": "Sora", "status": "Token未配置", "progress": 0}
            return agents.sora_agent.generate_sora_video(prompt)

        def run_veofast():
            import agents.veofast_agent
            importlib.reload(agents.veofast_agent)
            if not replicate_token or replicate_token.startswith("..."):
                return {"name": "VeoFast", "status": "Token未配置", "progress": 0}
            return agents.veofast_agent.generate_veofast_video(prompt)

        skipped = {"status": "未选中", "progress": 0, "url": ""}
        seedance_res = run_seedance() if "Seedance" in selected_models else {**skipped, "name": "Seedance"}
        kling_res    = run_kling()    if "Kling"    in selected_models else {**skipped, "name": "Kling"}
        sora_res     = run_sora()     if "Sora"     in selected_models else {**skipped, "name": "Sora"}
        veo_res      = run_veofast()  if "VeoFast"  in selected_models else {**skipped, "name": "VeoFast"}

        print(f"-> Seedance: {seedance_res.get('status')} | Kling: {kling_res.get('status')} | Sora: {sora_res.get('status')} | VeoFast: {veo_res.get('status')}")

        final_results = {
            "Seedance": seedance_res,
            "Kling": kling_res,
            "Sora": sora_res,
            "VeoFast": veo_res
        }
        return jsonify(final_results)
    except Exception as e:
        print(f"❌ 后端严重异常: {str(e)}")
        return jsonify({"error": f"后端异常: {str(e)}"}), 500

@app.route('/stream', methods=['GET'])
def stream():
    """
    SSE 推送生成状态。
    """
    def event_stream():
        while True:
            # Mock 推送逻辑
            yield f"data: {json.dumps({'status': 'running'})}\n\n"
            time.sleep(1)

    return Response(event_stream(), content_type='text/event-stream')

if __name__ == '__main__':
    # 强制监听物理网卡
    host_ip = "10.181.207.110"
    port = 8080
    print(f"🚀 后端服务已启动！监听地址: http://{host_ip}:{port}")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)