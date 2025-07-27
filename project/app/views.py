from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import json
from openai import OpenAI
from .models import UserProfile

def demo(request):
    return render(request, 'demo.html')

@login_required
def home(request):
    return render(request, 'index.html')

def log(request):  # login view
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, 'Invalid username or password.')
            return redirect('login')
    return render(request, 'login.html')

def signup(request):
    if request.method == 'POST':
        username = request.POST['username']
        email = request.POST['email']
        password = request.POST['password']
        confirm_password = request.POST['confirm_password']

        if password != confirm_password:
            messages.error(request, 'Passwords do not match.')
            return redirect('signup')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists.')
            return redirect('signup')

        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user)  # Create profile on signup
        messages.success(request, 'Account created successfully. Please log in.')
        return redirect('login')

    return render(request, 'signup.html')

def logout_view(request):
    logout(request)
    return redirect('login')

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
)

@login_required
def get_question(request):
    prompt = (
        "Generate a simple coding-based multiple-choice question. Question should be in an understandable format, shouldn't be too complex, and should be suitable for a beginner. Should be readable and clear. "
        "Respond ONLY with a JSON object with keys 'id', 'question', 'options' (a list of 4 strings), and 'answer_index' (the index of the correct option, 0-based). "
        "Do not include any explanation or extra text. "
        "Example: {\"id\": 123, \"question\": \"What is 2+2?\", \"options\": [\"3\", \"4\", \"5\", \"6\"], \"answer_index\": 1}"
    )
    completion = client.chat.completions.create(
        model="deepseek/deepseek-r1-0528:free",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    print("AI raw response:", completion.choices[0].message.content)
    import re, json
    try:
        try:
            data = json.loads(completion.choices[0].message.content)
        except Exception:
            match = re.search(r'\{.*\}', completion.choices[0].message.content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
            else:
                raise ValueError("No JSON found in AI response.")
        request.session['last_question_id'] = data["id"]
        request.session['last_answer_index'] = data["answer_index"]
        return JsonResponse({
            "id": data["id"],
            "question": data["question"],
            "options": data["options"]
        })
    except Exception as e:
        print("AI parse error:", e)
        return JsonResponse({
            "id": 1,
            "question": "What is 2+2?",
            "options": ["3", "4", "5", "6"]
        })

@csrf_exempt
@login_required
def verify_answer(request):
    if request.method == "POST":
        data = json.loads(request.body)
        selected_index = int(data.get("selected_index"))
        question_id = str(data.get("question_id"))

        last_id = str(request.session.get('last_question_id'))
        last_answer_index = int(request.session.get('last_answer_index', -1))

        user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
        user_profile.total_questions += 1

        correct = False
        if question_id == last_id and last_answer_index != -1:
            correct = (selected_index == last_answer_index)
            if correct:
                user_profile.correct_answers += 1
                user_profile.points += 10  # 10 points per correct answer

        user_profile.save()
        return JsonResponse({"correct": correct, "points": user_profile.points})

    return JsonResponse({"correct": False})

@login_required
def complete_game(request):
    user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
    user_profile.points += 50  # 50 points for completing the game
    user_profile.save()
    messages.success(request, 'Congratulations! You completed the game and earned 50 points!')
    return redirect('dashboard')

@login_required
def dashboard(request):
    user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
    context = {
        'points': user_profile.points,
        'total_questions': user_profile.total_questions,
        'correct_answers': user_profile.correct_answers,
    }
    return render(request, 'dashboard.html', context)
