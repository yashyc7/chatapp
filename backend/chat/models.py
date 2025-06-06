from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    photo_url = models.URLField(max_length=500, null=True, blank=True)
    firebase_user_id = models.CharField(max_length=1000, null=True, blank=True)
    firebase_extra_data = models.JSONField(null=True, blank=True)

    class Meta:
        app_label = "chat"
        db_table = "chat_user"

    def __str__(self):
        return self.username


class Conversation(models.Model):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,  # Changed from 'auth.User' to settings.AUTH_USER_MODEL
        related_name="conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Conversation {self.id}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Changed from 'auth.User' to settings.AUTH_USER_MODEL
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"
