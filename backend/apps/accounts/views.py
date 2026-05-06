from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .models import Notification
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, NotificationSerializer

class NotificationListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.request.user.notifications.all()

class NotificationMarkReadView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({"message": "Marked as read"})
        except Notification.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
from accounts.permissions import IsCoordinator

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer

class MeView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class SupervisorListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated, IsCoordinator)
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role__iexact='supervisor').order_by('email')

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        # In JWT, logout is usually handled by deleting the token on the client side.
        # If using a blacklist, you can add the refresh token here.
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
