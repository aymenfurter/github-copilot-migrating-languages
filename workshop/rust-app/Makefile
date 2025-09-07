# Define the default target
.DEFAULT_GOAL := help

# Define variables
HOST := 0.0.0.0
PORT := 8000

# Define targets
run:
	cargo run

build:
	cargo build

test:
	cargo test

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  run       Start the Rust application"
	@echo "  build     Build the Rust application"
	@echo "  test      Run Rust tests"
	@echo "  help      Show this help message"

.PHONY: help run build test