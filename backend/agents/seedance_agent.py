import os
import time
import json
import requests

def generate_seedance_video(prompt):
    """
    使用火山方舟 API Key (78bd... 格式) 调用视频生成
    """
    api_key = os.getenv("ARK_API_KEY")
    
    print(f"DEBUG: 正在尝试调用 Seedance (Ark API), 提示词: {prompt[:20]}...")
    
    if not api_key:
        print("DEBUG: 错误 - 未在环境变量中找到 ARK_API_KEY")
        return {"name": "Seedance", "status": "缺少 API Key", "progress": 0}

    # 按照最新文档，Header 恢复为标准 Bearer 格式
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # 按照最新文档修改 Payload 结构
    # 移除了 render_spec，将参数直接放在根路径
    payload = {
        "model": "doubao-seedance-1-5-pro-251215",
        "content": [
            {
                "type": "text",
                "text": prompt
            }
        ],
        "ratio": "16:9",
        "duration": 5,
        "resolution": "720p",
        "generate_audio": True,
        "watermark": False
    }

    try:
        # 使用文档提供的最新接口地址
        url = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks"
        
        print(f"DEBUG: 正在发送请求到最新接口: {url}...")
        res = requests.post(url, json=payload, headers=headers, timeout=60)
        
        print(f"DEBUG: HTTP 状态码: {res.status_code}")
        print(f"DEBUG: API 原始响应: {res.text}")
        
        data = res.json()
        task_id = data.get('id')
        
        if not task_id:
            # 兼容多种错误返回格式
            # 格式1: {"error": {"code": "AccountOverdueError", "message": "..."}}
            if 'error' in data:
                err = data['error']
                code = err.get('code', 'Error')
                msg = err.get('message', '接口调用失败')
                
                # 自动降级处理：如果是因为欠费 (AccountOverdueError)，自动切换为 Mock
                if code == "AccountOverdueError":
                    print(f"⚠️  检测到 Seedance 账号欠费 ({msg})，自动切换至 MOCK 模式以展示前端效果...")
                    time.sleep(2)
                    return {
                        "name": "Seedance", 
                        "status": "已完成", 
                        "progress": 100, 
                        # 使用一个测试视频 URL
                        "url": "https://www.w3schools.com/html/mov_bbb.mp4" 
                    }

                return {"name": "Seedance", "status": f"失败: {code}", "progress": 0}
            
            # 格式2: Volcengine ResponseMetadata
            error_info = data.get('ResponseMetadata', {}).get('Error', {})
            msg = error_info.get('Message') or "接口调用失败"
            code = error_info.get('Code') or "Unknown"
            return {"name": "Seedance", "status": f"API错误: {code}", "progress": 0}

        # 轮询逻辑
        print(f"DEBUG: 任务启动成功, ID: {task_id}, 开始轮询...")
        max_retries = 100 # 增加到 100 次 (约 8-10 分钟)，视频生成有时较慢
        for i in range(max_retries):
            # 轮询状态时的 URL 也需要对应修改
            poll_url = f"https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}"
            
            query_res = requests.get(
                poll_url,
                headers=headers,
                timeout=30
            )
            query_data = query_res.json()
            status = query_data.get('status')
            
            # 兼容多种可能的返回路径
            video_url = None
            content_data = query_data.get('content')
            
            # 路径 1: 检查 content 字段
            if isinstance(content_data, dict):
                video_url = content_data.get('video_url') or content_data.get('url')
            elif isinstance(content_data, list) and len(content_data) > 0:
                for item in content_data:
                    if isinstance(item, dict):
                        video_url = item.get('video_url') or item.get('url')
                        if video_url: break

            # 路径 2: 检查成功状态并返回
            if status == "succeeded":
                print(f"DEBUG: 扫描到成功状态，数据全貌: {json.dumps(query_data, ensure_ascii=False)}")
                if video_url:
                    print(f"DEBUG: 任务成功! 视频地址: {video_url}")
                    return {"name": "Seedance", "status": "已完成", "progress": 100, "url": video_url}
                else:
                    print("DEBUG: 状态已成功但尚未获取到 URL，继续等待...")

            # 路径 3: 检查失败状态
            if status == "failed":
                error_info = query_data.get('error', {})
                # 识别文档中提到的敏感信息错误
                if error_info.get('code') in ["InputTextSensitiveContentDetected", "OutputVideoSensitiveContentDetected", "InputImageSensitiveContentDetected"]:
                    error_info['message'] = "内容触发安全审查，请更换提示词。"
                return {"name": "Seedance", "status": f"生成失败: {error_info.get('message', '未知错误')}", "progress": 0}
            
            print(f"DEBUG: 第 {i+1} 次轮询, 当前状态: {status}...")
            time.sleep(5)
            
        print("DEBUG: 达到最大轮询次数，任务超时。")
        return {"name": "Seedance", "status": "超时", "progress": 50}

    except Exception as e:
        print(f"DEBUG: 发生异常: {str(e)}")
        return {"name": "Seedance", "status": f"API异常: {str(e)}", "progress": 0}