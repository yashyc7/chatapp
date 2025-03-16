#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e  

echo "Setting up virtual environment..."
python -m venv /opt/venv
source /opt/venv/bin/activate

echo "Upgrading pip and installing Poetry..."
pip install --upgrade pip
pip install poetry==2.1.1  # Ensure the correct version

echo "Installing dependencies using Poetry..."
poetry install --no-dev --no-interaction --no-ansi
