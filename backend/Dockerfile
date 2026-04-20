FROM node:18-alpine

WORKDIR /usr/src/app

# Only copy package json to leverage Docker build cache
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Pass in expected ports
EXPOSE 4000

# Start Express server via main entry script
CMD ["npm", "start"]
