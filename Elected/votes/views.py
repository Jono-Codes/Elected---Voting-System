from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from .models import Position, Candidate, Vote
from django.views.decorators.csrf import csrf_exempt
import json

def home(request):
    return render(request, "votes/index.html")

@csrf_exempt
def login_api(request):
    data = json.loads(request.body)
    user = authenticate(username=data.get("username"), password=data.get("password"))
    if user:
        auth_login(request, user)
        return JsonResponse({"success": True, "userId": user.id})
    return JsonResponse({"success": False, "message": "Invalid credentials"})

@csrf_exempt
def logout_api(request):
    auth_logout(request)
    return JsonResponse({"success": True})

@login_required
@csrf_exempt
def vote_api(request):
    data = json.loads(request.body)
    candidate_id = data.get("candidateId")
    if not candidate_id:
        return JsonResponse({"success": False, "message": "Candidate not specified"})

    try:
        candidate = Candidate.objects.get(id=candidate_id)
        Vote.objects.get_or_create(voter=request.user, candidate=candidate)
        return JsonResponse({"success": True})
    except Candidate.DoesNotExist:
        return JsonResponse({"success": False, "message": "Candidate not found"})

def results_api(request):
    results = []
    for c in Candidate.objects.all():
        # Get the URL of the image, or None if no image is set
        image_url = c.image.url if c.image else None 
        
        results.append({
            "id": c.id,
            "name": c.name,
            "position": c.position.name,
            # NEW FIELD: image_url
            "image_url": image_url, 
            "votes": Vote.objects.filter(candidate=c).count()
        })
    return JsonResponse(results, safe=False)

@login_required
def ballot(request):
    positions = Position.objects.prefetch_related('candidates').all()
    if request.method == 'POST':
        candidate_id = request.POST.get('candidate')
        try:
            candidate = Candidate.objects.get(id=candidate_id)
            Vote.objects.get_or_create(voter=request.user, candidate=candidate)
            return redirect('ballot')
        except Candidate.DoesNotExist:
            messages.error(request, "Candidate not found.")
            return redirect('ballot')
    return render(request, 'votes/ballot.html', {'positions': positions})
