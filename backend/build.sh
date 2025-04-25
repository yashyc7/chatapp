#!/bin/bash

# Exit on any error
set -e  

echo "Setting up virtual environment..."
python -m venv /opt/venv
source /opt/venv/bin/activate

echo "Installing Poetry..."
pip install poetry

echo "Installing dependencies using Poetry..."
poetry install --no-dev --no-interaction --no-ansi

echo "Collecting static files..."
python manage.py collectstatic --noinput