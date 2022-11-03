FROM keymetrics/pm2:latest-alpine

# 暴露端口
EXPOSE 9675

# 创建目录
RUN mkdir -p /home/Service

# 复制源码
WORKDIR /home/Service
COPY . /home/Service

# 容器启动时，启动应用服务
CMD ["pm2", "start", "pm2.json"]