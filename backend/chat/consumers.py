import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["url_route"]["kwargs"]["user_id"]
        self.user_room_name = f"user_{self.user_id}"

        # Join user's personal room
        await self.channel_layer.group_add(self.user_room_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave user's personal room
        await self.channel_layer.group_discard(self.user_room_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "chat_message":
            message = data.get("message")
            conversation_id = data.get("conversation_id")
            recipient_id = data.get("recipient_id")

            # Save message to database
            saved_message = await self.save_message(
                sender_id=self.user_id, conversation_id=conversation_id, content=message
            )

            # Send message to recipient's personal room
            recipient_room = f"user_{recipient_id}"
            await self.channel_layer.group_send(
                recipient_room,
                {
                    "type": "chat_message",
                    "message": {
                        "id": saved_message.id,
                        "sender_id": int(self.user_id),
                        "conversation_id": conversation_id,
                        "content": message,
                        "timestamp": saved_message.timestamp.isoformat(),
                        "is_read": False,
                    },
                },
            )

            # Send confirmation back to sender
            await self.channel_layer.group_send(
                self.user_room_name,
                {
                    "type": "chat_message",
                    "message": {
                        "id": saved_message.id,
                        "sender_id": int(self.user_id),
                        "conversation_id": conversation_id,
                        "content": message,
                        "timestamp": saved_message.timestamp.isoformat(),
                        "is_read": False,
                    },
                },
            )

    async def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(
            text_data=json.dumps({"type": "chat_message", "message": message})
        )

    @database_sync_to_async
    def save_message(self, sender_id, conversation_id, content):
        sender = User.objects.get(id=sender_id)
        conversation = Conversation.objects.get(id=conversation_id)
        message = Message.objects.create(
            conversation=conversation, sender=sender, content=content
        )
        return message
