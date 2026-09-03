.PHONY: help install run test migrate docker-build docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install      - Install dependencies"
	@echo "  make run          - Run development server"
	@echo "  make test         - Run tests"
	@echo "  make migrate      - Run database migrations"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"

install:
	pip install -r requirements.txt

run:
	python manage.py runserver

test:
	python manage.py test payments

migrate:
	python manage.py makemigrations payments
	python manage.py migrate

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down