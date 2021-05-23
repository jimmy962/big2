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
