FROM node:22-bookworm

# === Системные утилиты ===
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget git ca-certificates gnupg \
    jq ripgrep sqlite3 htop nano unzip \
    gcc g++ make \
    php php-cli php-mbstring php-xml php-curl php-mysql \
    composer \
    python3 python3-pip python3-venv \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# === Python пакеты ===
RUN pip3 install --break-system-packages \
    requests httpx beautifulsoup4 pyyaml

# === Go ===
RUN curl -fsSL https://go.dev/dl/go1.24.5.linux-amd64.tar.gz | tar -C /usr/local -xz
ENV PATH=$PATH:/usr/local/go/bin:/root/go/bin

# === Opencode ===
RUN curl -fsSL https://opencode.ai/install | bash

# === Рабочие директории ===
RUN mkdir -p /data/agents/logs /data/projects /workspace

WORKDIR /var/www/

CMD ["tail", "-f", "/dev/null"]
