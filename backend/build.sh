#!/bin/bash
# Install Poetry
pip install poetry==1.7.1

# Install dependencies using Poetry
poetry config virtualenvs.create false
poetry install --no-dev --no-interaction

# Run Django migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput