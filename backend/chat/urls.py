from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth
from .views import unread_messages

router = DefaultRouter()
router.register(r"users", views.UserViewSet)
router.register(r"conversations", views.ConversationViewSet, basename="conversation")
router.register(r"messages", views.MessageViewSet, basename="message")

urlpatterns = [
    path("", include(router.urls)),
    path("register/", auth.register_user, name="register"),
    path("login/", auth.login_user, name="login"),
    path("google_login/", auth.google_login, name="google_login"),
]

urlpatterns += [
    path("unread_messages/", unread_messages, name="unread_messages"),
]
