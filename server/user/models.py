from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class User(models.Model):
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
    fullName = models.CharField(max_length=100)
    signature = models.ImageField(upload_to="signatures", blank=True, null=True)

    def save(self, *args, **kwargs):
        """Ensure password is hashed before saving."""
        if not self.password.startswith('pbkdf2_sha256$'):
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def check_password(self, password):
        """Check if password is correct."""
        return check_password(password, self.password)
        
    def __str__(self):
        return self.username
