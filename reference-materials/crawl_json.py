import os
import re
import json
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

# ===================== 配置 =====================
BASE_URL = "https://beicunyihuivfx.shotgunstudio.com"
JSON_SAVE_DIR = "shotgun_json_data"
DEBUGGING_URL = "http://localhost:9222"
# ================================================

# 全局变量
request_counter = 0
visited_pages = set()  # 页面去重（修复死循环）
pending_requests = []

def safe_filename(s):
    return re.sub(r'[^\w\-]', '_', s)[:150]

# 保存：request body + response data
def save_combined_data(url, req_body, resp_data):
    global request_counter
    os.makedirs(JSON_SAVE_DIR, exist_ok=True)

    timestamp = int(time.time() * 1000)
    request_counter += 1
    fname = f"crud_requests_{timestamp}_{request_counter}.json"
    path = os.path.join(JSON_SAVE_DIR, fname)

    result = {
        "url": url,
        "request_body": req_body,
        "response_data": resp_data
    }

    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"✅ 已保存: {fname}")
    except Exception as e:
        print(f"⚠️ 保存失败: {e}")

# 监听网络
def listen_network(page):
    # 监听请求
    def on_request(req):
        url = req.url
        if "/crud/requests" not in url or BASE_URL not in url:
            return

        try:
            body = req.post_data_json
        except:
            body = None

        pending_requests.append({
            "url": url,
            "body": body
        })

    # 监听响应
    def on_response(res):
        url = res.url
        if "/crud/requests" not in url or BASE_URL not in url:
            return

        if not pending_requests:
            return

        req = pending_requests.pop(0)

        try:
            resp_data = res.json()
            save_combined_data(url, req["body"], resp_data)
        except:
            pass

    page.on("request", on_request)
    page.on("response", on_response)

# 递归爬页面（修复：页面去重，不会死循环）
def crawl_page(page, url):
    parsed = urlparse(url)
    
    # 只爬主站
    if BASE_URL not in url:
        return
    # 退出页面不爬
    if "logout" in url.lower():
        return
    # 已经访问过的页面，不再访问（关键修复）
    if parsed.path in visited_pages:
        return

    # 标记为已访问
    visited_pages.add(parsed.path)

    try:
        print(f"🔍 访问: {url}")
        page.goto(url, timeout=120000, wait_until="networkidle")
        page.wait_for_timeout(2000)

        # 获取所有链接
        links = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        for link in links:
            crawl_page(page, link)

    except Exception as e:
        print(f"❌ 失败: {url} | {str(e)[:100]}")

# 主函数
def main():
    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(DEBUGGING_URL)
        page = browser.contexts[0].pages[0]

        print("🔌 开始监听 /crud/requests (request + response)")
        listen_network(page)

        print("🚀 开始遍历页面...")
        crawl_page(page, BASE_URL)

        print(f"\n🎉 抓取完成！总共保存 {request_counter} 个 JSON")
        print(f"📂 路径: {os.path.abspath(JSON_SAVE_DIR)}")

if __name__ == "__main__":
    main()