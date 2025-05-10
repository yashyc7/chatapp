from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from .serializers import RegistrationSerializer
from firebase_admin import auth


@api_view(["POST"])
@permission_classes([AllowAny])
def register_user(request):
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)
    if user:
        token, created = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
            }
        )
    return Response(
        {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
    )
@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    try:
        # Get the token from request data
        firebase_token = request.data.get('firebase_token')
        if not firebase_token:
            return Response({'error': 'No token provided'}, status=400)

        # Verify Firebase token
        decoded_token = auth.verify_id_token(firebase_token)
        
        # Get user info
        email = decoded_token.get('email')
        name = request.data.get('display_name', '')
        photo_url = request.data.get('photo_url', '')

        if not email:
            return Response({'error': 'No email found'}, status=400)

        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email.split('@')[0],  # Create username from email
                'first_name': name,
                # Add any other fields you want to set
            }
        )

        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'photo_url': photo_url
        })

    except Exception as e:
        return Response({'error': str(e)}, status=400)