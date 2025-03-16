#!/bin/bash
# Install Poetry
pip install poetry==1.7.1

# Debug: Show Python and pip versions
python --version
pip --version

# Force regenerate poetry.lock file
poetry lock --no-update

# Install dependencies using Poetry
poetry config virtualenvs.create false
poetry install --no-interaction --no-ansi --only main --no-root

# Debug: Verify Django is installed
python -c "import django; print(f'Django version: {django.get_version()}')"

# Run Django migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput