import os
import sys
from daphne.cli import CommandLineInterface

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "chat_project.settings")
    sys.argv = [
        "daphne",
        "-b",
        "0.0.0.0",
        "-p",
        "8000",
        "chat_project.asgi:application",
    ]
    CommandLineInterface.entrypoint()
