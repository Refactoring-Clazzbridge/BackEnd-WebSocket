FROM node:20-alpine

WORKDIR /BACKEND-WEBSOCKET
COPY package.json package-lock.json ./
RUN npm install
COPY ./ ./

# 포트 노출
EXPOSE 3001

# Node.js 서버 시작
CMD ["node", "app.js"]
