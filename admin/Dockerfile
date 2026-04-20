FROM node:18-alpine as build

WORKDIR /app

# Install dependencies FIRST (caching)
COPY package*.json ./
RUN npm install

# Build application
COPY . .
RUN npm run build

# Stage 2: Serve over lightweight Nginx
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
