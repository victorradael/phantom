VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
ALEMBIC := $(VENV)/bin/alembic

.DEFAULT_GOAL := help

.PHONY: help setup up down logs migrate

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "  setup    Cria .venv dentro de backend/ e roda as migrations"
	@echo "  up       Sobe a aplicacao com Docker Compose"
	@echo "  down     Derruba a aplicacao e os containers"
	@echo "  logs     Exibe os logs da aplicacao em tempo real"
	@echo "  migrate  Roda as migrations do banco de dados"

setup:
	@echo ">> Criando .venv em backend/$(VENV)..."
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -e ".[dev]"
	@echo ">> Rodando migrations..."
	$(MAKE) migrate

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f api

migrate:
	$(ALEMBIC) upgrade head
