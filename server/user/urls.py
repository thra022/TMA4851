from django.urls import path, include
from . import views

urlpatterns = [
    path("api", views.UserListApiView.as_view()),
]
