FROM golang:1.14.2-alpine
RUN mkdir -p src
ADD ./src /src
RUN mkdir -p public
ADD ./public /public
RUN apk add git
RUN go get -u github.com/gorilla/websocket
WORKDIR /src
RUN go build main.go
CMD ["./main"]
EXPOSE 8000
# docker build -t jelly55/big2_main:version3 .
# docker run -it --publish 8000:8000 jelly55/big2_main:version3
# docker exec -it c9e8111c46ae /bin/sh

#deploy...
#ssh root@ip_address (do it in the personal-projects directory)
#docker pull jelly55/big2_main:version3
#docker run -it --publish 8000:8000 jelly55/big2_main:version3
