from django.urls import path
from user.views import UserListApiView, LoginApiView, ValidateSignatureApiView

urlpatterns = [
    path("user/", UserListApiView.as_view(), name="user-list"),
    path("user/login", LoginApiView.as_view(), name="user-login"),
    path("user/validate-signature",ValidateSignatureApiView.as_view(),name="validate-signature",),
]
