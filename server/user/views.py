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
from ml_model import distance_model, probability_model, load_and_preprocess_image, load_and_preprocess_inmemory_image
import cv2

class UserListApiView(APIView):
    # permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
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
            "signature": request.FILES.get("signature"),
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


class ValidateSignatureApiView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        if not username:
            return Response(
                {"message": "Username not provided."},
                status=status.HTTP_400_BAD_REQUEST,)

        new_image = request.FILES.get("test_signature")
        if not new_image:
            return Response(
                {"message": "No signature file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(username=username)
            original_image_path = user.signature.path
            X1 = np.array([load_and_preprocess_image(original_image_path)])
            X2 = np.array([load_and_preprocess_inmemory_image(new_image)])
            # Make prediction
            distance_prediction = distance_model.predict([X1, X2])
            prediction = probability_model.predict(distance_prediction)[0][0]

            return Response({"probability": prediction}, status=status.HTTP_200_OK)
        except Exception as e:
            print(str(e))
            return Response(
                {"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
