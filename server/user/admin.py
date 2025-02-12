from django.contrib import admin
from .models import User

class UserAdmin(admin.ModelAdmin):
    fieldsets = [
        (None, {'fields': ['username']}),
        (None, {'fields': ['email', 'fullName']}),
        (None, {'fields': ['createdAt', 'updatedAt']}),
    ]
    list_display = ('username', 'email', 'fullName', 'createdAt', 'updatedAt')

admin.site.register(User, UserAdmin)