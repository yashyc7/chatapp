#!/bin/bash

# Install Poetry
pip install poetry==2.1.1

# Debug: Show versions
python --version
pip --version

# Install dependencies using Poetry directly
poetry config virtualenvs.create false
poetry install --no-dev --no-interaction --no-ansi

# Debug: Verify Django is installed
python -c "import django; print(f'Django version: {django.get_version()}')"

# Run Django migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput