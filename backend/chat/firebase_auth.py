import logging

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from firebase_admin import auth

User = get_user_model()
logger = logging.getLogger(__name__)


class FireBaseAuthBackend:
    """Custom authentication backend for Firebase authentication."""

    def authenticate(self, request, firebase_token=None, **kwargs):
        """Authenticate the user using the Firebase ID token."""

        # Extract token from Authorization header if not explicitly passed
        if not firebase_token:
            auth_header = request.META.get("HTTP_AUTHORIZATION")
            if auth_header and auth_header.startswith("Bearer "):
                firebase_token = auth_header.split(" ")[1]

        if not firebase_token:
            logger.warning("Firebase token not found in request.")
            return None

        try:
            # Verify Firebase token
            decoded_token = auth.verify_id_token(firebase_token)
            logger.debug(f"Decoded Firebase token: {decoded_token}")

            uid = decoded_token.get("uid") or decoded_token.get("sub")
            email = decoded_token.get("email")
            name = decoded_token.get("name", "")
            picture = decoded_token.get("picture", "")

            if not email:
                logger.error("Firebase token does not contain an email address.")
                return None

            # Create username based on email prefix if not explicitly set
            username = email.split("@")[0]
            # Get or create the user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": name.split(" ")[0],
                    "last_name": name.split("")[1],
                    "firebase_user_id": uid,
                    "firebase_extra_data": decoded_token,
                    "photo_url": picture,
                },
            )

            if created:
                logger.info(f"New Firebase user created: {email}")
            else:
                # Optional: sync updated name or picture
                user.first_name = name
                user.photo_url = picture
                user.firebase_extra_data = decoded_token
                user.save(
                    update_fields=["first_name", "photo_url", "firebase_extra_data"]
                )

            return user

        except auth.ExpiredIdTokenError:
            logger.error("Firebase token has expired.")
        except auth.InvalidIdTokenError:
            logger.error("Invalid Firebase token provided.")
        except auth.RevokedIdTokenError:
            logger.error("Firebase token has been revoked.")
        except auth.UserDisabledError:
            logger.error("Firebase user account is disabled.")
        except Exception as e:
            logger.exception(f"Unexpected Firebase authentication error: {e}")

        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except ObjectDoesNotExist:
            logger.warning(f"User with ID {user_id} not found.")
            return None
