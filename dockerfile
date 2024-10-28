FROM node:18

WORKDIR /BACKEND-WEBSOCKET
COPY package.json package-lock.json ./
RUN npm ci
COPY ./ ./

# 포트 노출
EXPOSE 3000

# Node.js 서버 시작
CMD ["node", "app.js"]
