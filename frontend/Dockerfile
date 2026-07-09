# Stage 1: build the React app into static files
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build
# Vite outputs static files to /app/dist

# Stage 2: serve those static files with a lightweight web server.
# The final image only contains Nginx + the built files — none of your
# node_modules or source code ship in the actual running container.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]