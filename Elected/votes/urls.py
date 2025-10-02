from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('login_api/', views.login_api, name='login_api'),
    path('logout_api/', views.logout_api, name='logout_api'),
    path('vote_api/', views.vote_api, name='vote_api'),
    path('results_api/', views.results_api, name='results_api'),
    path('ballot/', views.ballot, name='ballot'),
]
