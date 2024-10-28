# 1단계: 빌드
FROM node:20

WORKDIR /BACKEND-WEBSOCKET
COPY package.json package-lock.json ./
RUN npm install
COPY ./ ./

# 2단계: Node 서버 설정
FROM node:20

WORKDIR //BACKEND-WEBSOCKET

# 서버 파일 추가 (e.g., index.js)
COPY app.js ./

# 포트 노출
EXPOSE 3000

# Node.js 서버 시작
CMD ["node", "app.js"]
