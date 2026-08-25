FROM node:22-bookworm

RUN apt-get update && apt-get install -y \
    curl \
    git \
    iputils-ping \
    php \
    php-cli \
    php-mbstring \
    php-xml \
    php-curl \
    composer \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://mimo.xiaomi.com/install | bash

RUN mkdir -p /data/agents/logs /data/projects /workspace

WORKDIR /var/www/

CMD ["tail", "-f", "/dev/null"]
