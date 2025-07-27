from django.urls import path
from . import views

urlpatterns = [
    path('home/', views.home, name='home'),
    path('',views.demo, name='demo'),
    path('login/', views.log, name='login'),
    path('signup/', views.signup, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('get_question/', views.get_question, name='get_question'),
    path('verify_answer/', views.verify_answer, name='verify_answer'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('complete_game/', views.complete_game, name='complete_game'),
]
