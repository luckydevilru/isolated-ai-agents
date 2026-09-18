FROM node:22-bookworm

# === Системные утилиты ===
# PHP 8.4 (из репозитория Sury), т.к. laravel/framework ^13 и совр. symfony
# требуют >=8.4.1, а в Debian bookworm из коробки только PHP 8.2.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl wget git ca-certificates gnupg \
    jq ripgrep sqlite3 htop nano unzip \
    gcc g++ make \
    python3 python3-pip python3-venv \
    mariadb-client \
    && install -d /usr/share/keyrings \
    && curl -fsSL https://packages.sury.org/php/apt.gpg -o /usr/share/keyrings/sury-php.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/sury-php.gpg] https://packages.sury.org/php/ bookworm main" > /etc/apt/sources.list.d/php-sury.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        php8.4-cli php8.4-mbstring php8.4-xml php8.4-curl \
        php8.4-mysql php8.4-zip php8.4-intl php8.4-gd php8.4-sqlite3 \
    && update-alternatives --set php /usr/bin/php8.4 \
    && curl -fsSL https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
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
    && chown -R node:node /usr/local/lib/opencode \
    && chmod -R u+rwX /usr/local/lib/opencode \
    && rm -rf /tmp/.opencode

# === OpenChamber (Web UI for OpenCode) ===
# Always install the latest published @openchamber/web.
# CAUTION: @openchamber/web 1.24.0 is currently broken on npm (depends on the
# absent @openchamber/sdk@1.23.1), so a rebuild would fail with ETARGET — only
# rebuild once a fixed release is published.
# The upgrade-timeout patch (../patch-openchamber.js) is a ONE-TIME MANUAL fix
# for @openchamber/web <= 1.24.0 and is deliberately NOT applied here — see
# README for the apply/status/revert commands.
RUN npm install -g @openchamber/web

# === Рабочие директории ===
RUN mkdir -p /data/agents/logs /data/projects /workspace

# === Playwright (браузеры для MCP) ===
RUN npx -y playwright install --with-deps chromium

# === Entrypoint: чинит права $HOME-томов и переключается на node (uid 1000) ===
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /var/www/

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["tail", "-f", "/dev/null"]
