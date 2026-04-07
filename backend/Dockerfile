FROM python:3.12-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖（使用清华镜像源加速）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
#    -i https://pypi.tuna.tsinghua.edu.cn/simple \
#    --trusted-host pypi.tuna.tsinghua.edu.cn

# 复制源码（开发模式下由 volume 覆盖）
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
