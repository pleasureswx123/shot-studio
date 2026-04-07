import os
import re
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright, Page

# ===================== 配置项 =====================
BASE_URL = "https://beicunyihuivfx.shotgunstudio.com"
SAVE_DIR = "shotgun_html_pages"
DEBUGGING_URL = "http://localhost:9222"
MAX_SAVE_PER_TYPE = 3  # 其他类型最多3个，page 不受此限制

# 必须抓取的白名单 URL
MANDATORY_URLS = {
    "https://beicunyihuivfx.shotgunstudio.com/projects",
    "https://beicunyihuivfx.shotgunstudio.com/page/5520",
    "https://beicunyihuivfx.shotgunstudio.com/page/media_center?type=Version&tree_path=%2Fbrowse_tree%2FProject%2Fall&global=true&project_sel=all",
    "https://beicunyihuivfx.shotgunstudio.com/page/5521",
    "https://beicunyihuivfx.shotgunstudio.com/page/5523",
}
# ===================================================

visited = set()
domain = urlparse(BASE_URL).netloc
type_save_count = {}

# 从URL提取实体类型
def get_entity_type_from_url(url):
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    parts = path.split("/")

    # page 页面
    if len(parts) >= 2 and parts[0] == "page":
        return "page"

    # 详情页 detail/Shot/1234
    if len(parts) >= 3 and parts[0] == "detail":
        return parts[1]

    if parts[0] == "projects":
        return "projects"

    return "other"

# ===================== ✅ 核心修改在这里 =====================
def should_save_url(url):
    # 白名单直接保存
    if url in MANDATORY_URLS:
        print(f"✅ 白名单强制保存: {url}")
        return True

    entity_type = get_entity_type_from_url(url)

    # ===================== ✅ 关键：page 类型 无限制，直接允许保存 =====================
    if entity_type == "page":
        return True

    # 其他类型（Shot/HumanUser/other...）仍然限制最多 3 个
    if entity_type not in type_save_count:
        type_save_count[entity_type] = 0

    if type_save_count[entity_type] >= MAX_SAVE_PER_TYPE:
        print(f"⏭️ 跳过 {entity_type}（已达上限）: {url}")
        return False

    type_save_count[entity_type] += 1
    return True
# ==============================================================

def clean_filename(url):
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    query = parsed.query
    if query:
        path += "_" + query
    if not path:
        path = "index"
    path = path.replace("/", "_")
    path = re.sub(r"[^\w\-]", "_", path)
    return path[:200]

def save_html(url, html):
    os.makedirs(SAVE_DIR, exist_ok=True)
    filename = clean_filename(url)
    file_path = os.path.join(SAVE_DIR, f"{filename}.html")

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"💾 已保存: {url}")
    except Exception as e:
        print(f"⚠️ 保存失败: {url} | {str(e)}")

def crawl(page: Page, current_url):
    current_url = urljoin(BASE_URL, current_url)

    if domain not in current_url or current_url in visited:
        return
    if "logout" in current_url.lower() or "sign_out" in current_url.lower():
        return
    visited.add(current_url)

    if not should_save_url(current_url):
        return

    try:
        print(f"\n🔗 正在访问: {current_url}")
        page.goto(current_url, timeout=120000, wait_until="networkidle")
        html = page.content()
        save_html(current_url, html)

        links = page.eval_on_selector_all("a[href]", "els => els.map(e => e.href)")
        for link in links:
            crawl(page, link)
    except Exception as e:
        print(f"❌ 失败: {current_url} | {str(e)}")

def main():
    with sync_playwright() as p:
        try:
            browser = p.chromium.connect_over_cdp(DEBUGGING_URL)
            context = browser.contexts[0]
            page = context.pages[0]

            print("\n🚀 开始抓取（page 无限制，其他每类最多3个）...\n")

            # 先抓白名单
            for mandatory_url in MANDATORY_URLS:
                crawl(page, mandatory_url)

            crawl(page, BASE_URL)

            print(f"\n🎉 抓取完成！总处理页面：{len(visited)}")
            print("\n📊 已保存统计（page 无限制）：")
            for t, c in type_save_count.items():
                print(f"   {t}: {c} 个")
            print(f"\n📂 保存目录：{os.path.abspath(SAVE_DIR)}")

        except Exception as e:
            print(f"💥 错误: {e}")

if __name__ == "__main__":
    main()