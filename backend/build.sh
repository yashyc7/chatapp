#!/bin/bash
# Install Poetry
pip install poetry==1.7.1

# Debug: Show Python and pip versions
python --version
pip --version

# Install dependencies using Poetry
poetry config virtualenvs.create false
poetry install --no-root --no-interaction

# Debug: Verify Django is installed
python -c "import django; print(f'Django version: {django.get_version()}')"

# Run Django migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput