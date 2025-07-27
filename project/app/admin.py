from django.contrib import admin
from django.contrib.auth.models import User
from .models import UserProfile

# Optional: Add this if you want to show email/username directly
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser')

admin.site.unregister(User)  # Unregister default
admin.site.register(User, UserAdmin)  # Register customized admin
admin.site.register(UserProfile)
