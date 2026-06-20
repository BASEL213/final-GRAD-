FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p uploads/projects uploads/documents
RUN chown -R node:node /app
EXPOSE 3000
USER node
CMD ["node", "server.js"]
