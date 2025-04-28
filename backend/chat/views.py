from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Conversation, Message
from .serializers import UserSerializer, ConversationSerializer, MessageSerializer
from django.core.exceptions import ValidationError


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for User model with basic optimizations
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class ConversationViewSet(viewsets.ModelViewSet):
    """
    Optimized Conversation viewset with efficient querying
    """

    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(participants=self.request.user)
            .prefetch_related("participants")
            .distinct()
        )

    @action(detail=False, methods=["post"])
    def start_conversation(self, request):
        user_id = request.data.get("user_id")
        if not user_id:
            return Response(
                {"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            other_user = User.objects.only("id").get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Efficient conversation lookup
        conversation = (
            Conversation.objects.filter(participants=request.user)
            .filter(participants=other_user)
            .distinct()
            .first()
        )

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
            conversation.refresh_from_db()

        serializer = self.get_serializer(conversation)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """
    Highly optimized Message viewset with select_related and prefetch_related
    """

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.request.query_params.get("conversation_id")

        queryset = (
            Message.objects.select_related("sender", "conversation")
            .prefetch_related("conversation__participants")
            .filter(conversation__participants=self.request.user)
            .order_by("timestamp")
        )

        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)

        return queryset

    def perform_create(self, serializer):
        conversation_id = self.request.data.get("conversation_id")

        # Efficient exists check first
        if not Conversation.objects.filter(
            id=conversation_id, participants=self.request.user
        ).exists():
            raise ValidationError("Invalid conversation ID")

        conversation = Conversation.objects.get(id=conversation_id)
        serializer.save(sender=self.request.user, conversation=conversation)

    @action(detail=False, methods=["post"])
    def mark_as_read(self, request):
        conversation_id = request.data.get("conversation_id")
        if not conversation_id:
            return Response(
                {"error": "Conversation ID is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Single optimized update query
        updated_count = Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=request.user,
            sender__in=User.objects.filter(conversations__id=conversation_id).exclude(
                id=request.user.id
            ),
            is_read=False,
        ).update(is_read=True)

        if updated_count == 0:
            # Verify conversation exists if no messages were updated
            if not Conversation.objects.filter(
                id=conversation_id, participants=request.user
            ).exists():
                return Response(
                    {"error": "Conversation not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        return Response({"status": f"{updated_count} messages marked as read"})


@api_view(["GET"])
def unread_messages(request):
    """
    Optimized unread messages endpoint with select_related
    """
    unread_messages = (
        Message.objects.select_related("sender", "conversation")
        .prefetch_related("conversation__participants")
        .filter(conversation__participants=request.user, is_read=False)
        .exclude(sender=request.user)
        .order_by("-timestamp")
    )

    serialized_messages = MessageSerializer(unread_messages, many=True).data
    return Response(serialized_messages)
