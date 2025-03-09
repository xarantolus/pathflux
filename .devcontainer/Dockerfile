FROM ubuntu:24.04

RUN --mount=type=cache,target=/var/cache/apt/archives \
	apt-get update && \
	DEBIAN_FRONTEND=noninteractive \
	apt-get remove -y golang-go && \
	apt-get install -y \
	nodejs npm curl tar && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/*

RUN set -e; \
	arch="$(dpkg --print-architecture)"; \
	case "$arch" in \
	amd64) go_arch="amd64";; \
	arm64) go_arch="arm64";; \
	*) echo "Unsupported architecture: $arch" && exit 1;; \
	esac; \
	version="$(curl -s 'https://go.dev/VERSION?m=text' | head -n1)"; \
	curl -fsSL "https://go.dev/dl/${version}.linux-${go_arch}.tar.gz" -o "/tmp/go.tar.gz"; \
	tar -C /usr/local -xzf "/tmp/go.tar.gz"; \
	rm "/tmp/go.tar.gz"

ENV PATH="/usr/local/go/bin:${PATH}"

RUN curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s -- -b $(go env GOPATH)/bin latest

ENV PATH="/root/go/bin:${PATH}"

ARG USER=vscode

# Create a non-root user
RUN apt-get update && apt-get install -y sudo && \
	groupadd -g 1234 ${USER} && \
	useradd -u 1234 -g ${USER} -s /bin/bash -m ${USER} && \
	echo "${USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Set up Go paths for the non-root user
ENV USER_GO_PATH=/home/${USER}/go
RUN mkdir -p ${USER_GO_PATH}/bin && \
	chown -R ${USER}:${USER} ${USER_GO_PATH}

# Copy necessary binaries and set permissions
RUN cp -r /root/go/bin/* ${USER_GO_PATH}/bin/ && \
	chown -R ${USER}:${USER} ${USER_GO_PATH}/bin

ENV PATH="${USER_GO_PATH}/bin:${PATH}"
USER ${USER}
WORKDIR /home/${USER}
