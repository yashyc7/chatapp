from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'conversations', views.ConversationViewSet, basename='conversation')
router.register(r'messages', views.MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', auth.register_user, name='register'),
    path('login/', auth.login_user, name='login'),
]