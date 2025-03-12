from django.urls import path, include
from . import views

urlpatterns = [
    path("api", views.UserListApiView.as_view()),
    path("login", views.LoginApiView.as_view()),
    # path("validate-signature", views.ValidateSignatureApiView.as_view()),
]
