import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from firebase_admin import auth

# Get the Django User model
User = get_user_model()
import jwt

# Setup logging
logger = logging.getLogger(__name__)


class FireBaseAuthBackend:
    """Custom authentication backend for Firebase authentication."""

    def authenticate(self, request, firebase_token=None, **kwargs):
        """Authenticate the user using the Firebase ID token."""

        # Extract token from the request header if not provided
        if firebase_token is None:
            auth_header = request.META.get("HTTP_AUTHORIZATION")
            if auth_header and auth_header.startswith("Bearer "):
                firebase_token = auth_header.split(" ")[1]

        # If there's no token, return None
        if not firebase_token:
            logger.warning("No Firebase token provided.")
            return None

        try:
            # Verify Firebase token
            decoded_token = auth.verify_id_token(firebase_token)
            # decoded_token = jwt.decode(firebase_token, options={"verify_signature": False})
            uid = decoded_token.get("uid")
            email = decoded_token.get("email")
            name = decoded_token.get("name", "")

            if not email:
                logger.error(f"Firebase token does not contain email: {decoded_token}")
                return None

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email.split("@")[0],
                    "first_name": name,
                    "firebase_user_id": uid,
                    "firebase_extra_data": decoded_token,
                },
            )

            if created:
                logger.info(f"New user created: {email}")

            return user  # Returning authenticated user

        except auth.ExpiredIdTokenError as e:
            logger.error("Firebase Authentication error: Token has expired.")
        except auth.InvalidIdTokenError as e:
            logger.error("Firebase Authentication error: Invalid token provided.")
        except auth.RevokedIdTokenError as e:
            logger.error("Firebase Authentication error: Token has been revoked.")
        except auth.UserDisabledError as e:
            logger.error("Firebase Authentication error: User account is disabled.")
        except Exception as e:
            logger.exception(f"Firebase Authentication failed: {str(e)}")

        return None

    def get_user(self, user_id):
        """Retrieve user instance by ID."""
        try:
            return User.objects.get(pk=user_id)
        except ObjectDoesNotExist:
            logger.warning(f"User with ID {user_id} not found.")
            return None
