from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from .models import User
from .serializers import UserSerializer
from rest_framework.authtoken.models import Token
from django.http import JsonResponse
from rest_framework.parsers import MultiPartParser, FormParser
import tensorflow as tf
from PIL import Image
import numpy as np
import io
from ml_model import model, load_and_preprocess_image

class UserListApiView(APIView):
    # permission_classes = [permissions.IsAuthenticated]
    def get(self, request, *args, **kwargs):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        data = {
            "username": request.data.get("username"),
            "email": request.data.get("email"),
            "password": request.data.get("password"),
            "fullName": request.data.get("fullName"),
        }
        serializer = UserSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"message": "User created successfully", "data": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginApiView(APIView):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"message": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(password):
            return Response(
                {"message": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(user)
        return Response(
            {"token": "RealToken", "user": serializer.data}, status=status.HTTP_200_OK
        )


# class ValidateSignatureApiView(APIView):
#     parser_classes = (MultiPartParser, FormParser)

#     def post(self, request, *args, **kwargs):
#         username = request.data.get("username")
#         # file = request.data.get("file")
#         # if not file:
#         #     return Response(
#         #         {"message": "No file provided"}, status=status.HTTP_400_BAD_REQUEST
#         #     )

#         try:
#             user = User.objects.get(username=username)
#             original_image_file = user.signature

#             new_image = GET FROM PNG FROM REQUEST
#             X1 = np.array([load_and_preprocess_image(origial_iamge)])
#             X2 = np.array([load_and_preprocess_image(new_image)])

#             # Make prediction
#             prediction = model.predict([X1, X2])

#             return Response({"probability": prediction}, status=status.HTTP_200_OK)
#         except Exception as e:
#             return Response(
#                 {"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
