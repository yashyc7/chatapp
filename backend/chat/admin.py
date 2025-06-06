from django.contrib import admin
from .models import Conversation, Message
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model

User = get_user_model()


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "updated_at")
    filter_horizontal = ("participants",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "sender", "conversation", "timestamp", "is_read")
    list_filter = ("is_read", "timestamp")
    search_fields = ("content",)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Define the fields to display in list view
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "photo_url",
        "is_staff",
        "firebase_user_id",
        "firebase_extra_data",
    )

    # Define the fieldsets for detail/edit view
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {"fields": ("first_name", "last_name", "email", "photo_url")},
        ),
        (_("Firebase info"), {"fields": ("firebase_user_id", "firebase_extra_data")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )

    # Optional: fields to show in the 'add user' form
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "password1",
                    "password2",
                    "email",
                    "photo_url",
                    "firebase_user_id",
                ),
            },
        ),
    )

    search_fields = ("username", "email", "firebase_user_id")
    ordering = ("username",)
