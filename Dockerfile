# docker build -t wolweb .
FROM golang:1.14-alpine AS builder

RUN mkdir /wolweb
WORKDIR /wolweb

# Install Dependecies
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    git clone -b rebuild https://github.com/komarK0X/wolweb . && \
    go mod init wolweb && \
    go get -d github.com/gorilla/handlers && \
    go get -d github.com/gorilla/mux && \
    go get -d github.com/ilyakaznacheev/cleanenv

# Build Source Files
RUN go build -o wolweb . 

# Create 2nd Stage final image
FROM alpine
WORKDIR /wolweb
COPY --from=builder /wolweb/index.html .
COPY --from=builder /wolweb/wolweb .
COPY --from=builder /wolweb/devices.json .
COPY --from=builder /wolweb/config.json .
COPY --from=builder /wolweb/static ./static

ARG WOLWEBPORT=8089

CMD ["/wolweb/wolweb"]

EXPOSE ${WOLWEBPORT}
