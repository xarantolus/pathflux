FROM node:22 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY frontend/ ./
RUN npm run build -- --outDir dist

FROM golang:alpine AS builder
RUN apk add --no-cache gcc musl-dev sqlite-dev
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download -x
COPY backend/ .
RUN --mount=type=cache,target=/root/.cache/go-build \
	--mount=type=cache,target=/go/pkg/mod \
	CGO_ENABLED=1 go build -v -o /app/pathflux

FROM alpine:latest
RUN apk add --no-cache sqlite-libs
WORKDIR /app/
COPY --from=builder /app/pathflux /app/pathflux
COPY --from=frontend-builder /app/frontend/dist /frontend/dist
CMD ["/app/pathflux"]
