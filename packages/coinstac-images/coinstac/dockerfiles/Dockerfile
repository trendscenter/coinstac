FROM node:lts-buster

RUN cd /usr/local/src/ \      
  && git clone https://github.com/trendscenter/coinstac.git \
  && cd coinstac \
  && npm i && npm run build 
#Set working directory
WORKDIR /usr/local/src/coinstac
