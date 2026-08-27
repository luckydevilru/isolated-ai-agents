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
ENV PATH=$PATH:/usr/local/go/bin

# === Opencode ===
RUN curl -fsSL https://opencode.ai/install | HOME=/tmp bash \
    && mv /tmp/.opencode /usr/local/lib/opencode \
    && ln -s /usr/local/lib/opencode/bin/opencode /usr/local/bin/opencode \
    && rm -rf /tmp/.opencode

# === OpenChamber (Web UI for OpenCode) ===
RUN npm install -g @openchamber/web

# === Рабочие директории ===
RUN mkdir -p /data/agents/logs /data/projects /workspace

# === Entrypoint: чинит права $HOME-томов и переключается на node (uid 1000) ===
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /var/www/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]
