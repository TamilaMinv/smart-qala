import os
import json

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from dotenv import load_dotenv
from google import genai

import models
from database import engine, get_db


# =====================================================
# ENV + GEMINI
# =====================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY не найден. Проверь файл backend/.env"
    )

gemini_client = genai.Client(
    api_key=GEMINI_API_KEY
)

# Gemini будет пробовать модели по очереди.
# Если первая перегружена/недоступна — используется следующая.
GEMINI_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
]


# =====================================================
# DATABASE
# =====================================================

models.Base.metadata.create_all(bind=engine)


# =====================================================
# APP
# =====================================================

app = FastAPI(
    title="SMART QALA API",
    description="Backend API for SMART QALA",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# PYDANTIC MODELS
# =====================================================


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class EmployeeCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    model_config = {
        "from_attributes": True
    }


class IdeaCreate(BaseModel):
    title: str
    problem: str
    solution: str
    location: str
    author_id: int


class IdeaResponse(BaseModel):
    id: int
    author_id: int | None
    title: str
    problem: str
    solution: str
    location: str
    category: str
    status: str
    supporters: int

    model_config = {
        "from_attributes": True
    }


class StatusUpdate(BaseModel):
    status: str


class SupportRequest(BaseModel):
    user_id: int


class SupportResponse(BaseModel):
    idea_id: int
    supporters: int
    supported: bool


# =====================================================
# AI MODELS
# =====================================================


class AIPrepareRequest(BaseModel):
    text: str


class AIPrepareResponse(BaseModel):
    title: str
    problem: str
    solution: str
    location: str


class AIClassificationResponse(BaseModel):
    category: str


class AIChatMessage(BaseModel):
    role: str
    text: str


class AIChatRequest(BaseModel):
    messages: list[AIChatMessage]
    language: str = "ru"


class AIChatResponse(BaseModel):
    finished: bool
    message: str
    title: str = ""
    problem: str = ""
    solution: str = ""
    location: str = ""


# =====================================================
# AI SETTINGS
# =====================================================


IDEA_CATEGORIES = [
    "Транспорт",
    "ЖКХ",
    "Экология",
    "Безопасность",
    "Образование",
    "Здравоохранение",
    "Городская инфраструктура",
    "Цифровые сервисы",
    "Социальная сфера",
    "Другое",
]


# =====================================================
# GEMINI WITH AUTOMATIC FALLBACK
# =====================================================


def generate_with_gemini(
    prompt: str,
    response_model,
):
    """
    Пробует несколько Gemini-моделей по очереди.

    Если модель перегружена, недоступна или возвращает
    некорректный результат, автоматически пробует следующую.
    """

    last_error = None

    for model_name in GEMINI_MODELS:

        try:
            print(
                f"Gemini: пробуем модель {model_name}"
            )

            response = gemini_client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_json_schema":
                        response_model.model_json_schema(),
                },
            )

            if not response.text:
                raise ValueError(
                    "Gemini вернул пустой ответ"
                )

            result = json.loads(response.text)

            # Pydantic проверяет, что Gemini действительно
            # вернул все необходимые поля правильного типа.
            validated_result = response_model(**result)

            print(
                f"Gemini: успешно — {model_name}"
            )

            return validated_result

        except Exception as error:

            last_error = error

            print(
                f"Gemini: модель {model_name} не сработала"
            )
            print(
                f"Причина: {error}"
            )

            print(
                "Gemini: пробуем следующую модель..."
            )

    print(
        "Gemini: все резервные модели недоступны"
    )

    print(
        f"Последняя ошибка: {last_error}"
    )

    raise RuntimeError(
        "Все Gemini-модели временно недоступны"
    )


# =====================================================
# AI — PREPARE IDEA
# =====================================================


def prepare_idea_with_ai(text: str):

    prompt = f"""
Ты — AI-помощник городской платформы SMART QALA.

SMART QALA — платформа цифровых инициатив жителей.
Жители предлагают цифровые решения, которые могут
сделать город удобнее, безопаснее и технологичнее.

Пользователь может описать свою идею обычным языком,
не заполняя официальную форму.

Твоя задача — превратить его сообщение в аккуратную
структурированную заявку.

ВАЖНО:

1. Не придумывай факты, которых пользователь не сообщал.
2. Не меняй смысл инициативы.
3. Пиши понятно и официально, но без сложной бюрократии.
4. Чётко разделяй проблему и решение.
5. Название должно быть коротким и понятным.
6. Если территория не указана, используй "Семей".
7. Не добавляй технологии, которых пользователь не предлагал,
   если они не являются очевидной частью его идеи.
8. Не оценивай, хорошая инициатива или плохая.
9. Не отклоняй инициативу.

Верни следующие поля:

title:
короткое и понятное название инициативы.

problem:
какую городскую проблему описывает пользователь.

solution:
какое цифровое решение предлагает пользователь.

location:
город, район или территория.

Сообщение пользователя:

{text}
"""

    try:

        return generate_with_gemini(
            prompt=prompt,
            response_model=AIPrepareResponse,
        )

    except Exception as error:

        print(
            "Gemini prepare final error:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "AI-помощник временно недоступен. "
                "Попробуйте ещё раз."
            ),
        )


# =====================================================
# AI — CHAT ASSISTANT
# =====================================================


def chat_with_ai(messages: list[AIChatMessage], language: str = "ru"):

    language = "kk" if language == "kk" else "ru"

    conversation = "\n".join(
        (("Тұрғын" if language == "kk" else "Житель")
         if message.role == "user" else "SMART QALA")
        + ": " + message.text
        for message in messages
    )

    if language == "kk":
        language_instruction = """
ПАЙДАЛАНУШЫ ҚАЗАҚ ТІЛІН ТАҢДАДЫ.
БҮКІЛ ЖАУАПТЫ ТЕК ҚАЗАҚ ТІЛІНДЕ ЖАЗ.
ЕШҚАШАН ОРЫС ТІЛІНЕ АУЫСПА.
message, title, problem, solution және location өрістерінің
барлығын қазақ тілінде жаз.
Сұрақтарды табиғи әрі түсінікті қазақ тілінде қой.
"""
    else:
        language_instruction = """
ПОЛЬЗОВАТЕЛЬ ВЫБРАЛ РУССКИЙ ЯЗЫК.
ВЕСЬ ОТВЕТ ПИШИ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
message, title, problem, solution и location пиши по-русски.
"""

    prompt = f"""
Ты — AI-помощник городской платформы SMART QALA.

{language_instruction}

Помоги жителю сформулировать полноценную цифровую инициативу
через короткий естественный диалог.

Нужно выяснить:
1. problem — городскую проблему;
2. solution — решение пользователя;
3. location — территорию реализации.

title создай самостоятельно, когда информации достаточно.

ПРАВИЛА:
1. Анализируй всю переписку.
2. Не используй фиксированный сценарий.
3. Не спрашивай повторно уже сообщённое.
4. Если информации недостаточно, задай ОДИН наиболее полезный вопрос.
5. Не придумывай факты или решение за пользователя.
6. Не меняй смысл инициативы.
7. Не оценивай инициативу.
8. Пиши кратко, дружелюбно и без бюрократии.
9. Если территория не указана, уточни её.
10. Когда проблема, решение и территория известны, заверши диалог.
11. ЯЗЫКОВАЯ ИНСТРУКЦИЯ ВЫШЕ ОБЯЗАТЕЛЬНА И ИМЕЕТ ВЫСШИЙ ПРИОРИТЕТ.

Если данных недостаточно:
finished = false
message = один следующий вопрос на выбранном языке
title = ""
problem = ""
solution = ""
location = ""

Если данных достаточно:
finished = true
message = короткое сообщение на выбранном языке, что заявка готова
title = название на выбранном языке
problem = проблема на выбранном языке
solution = решение на выбранном языке
location = территория на выбранном языке

ТЕКУЩИЙ ДИАЛОГ:
{conversation}
"""

    try:
        return generate_with_gemini(prompt=prompt, response_model=AIChatResponse)
    except Exception as error:
        print("Gemini chat final error:", error)
        detail = (
            "AI-көмекші уақытша қолжетімсіз. Қайталап көріңіз."
            if language == "kk"
            else "AI-помощник временно недоступен. Попробуйте ещё раз."
        )
        raise HTTPException(status_code=503, detail=detail)


# =====================================================
# AI — CLASSIFICATION
# =====================================================


def classify_idea_with_ai(
    title: str,
    problem: str,
    solution: str,
):

    categories_text = "\n".join(
        f"- {category}"
        for category in IDEA_CATEGORIES
    )

    prompt = f"""
Ты — AI-модуль автоматической классификации
городской платформы SMART QALA.

Тебе передана цифровая инициатива жителя.

Твоя задача — определить ОДНУ наиболее подходящую
категорию инициативы.

РАЗРЕШЁННЫЕ КАТЕГОРИИ:

{categories_text}

ПРАВИЛА:

1. Выбери строго одну категорию из списка.
2. Не создавай новые категории.
3. Определяй категорию по основной городской проблеме
   и цели инициативы.
4. Если инициатива действительно не подходит ни к одной
   категории, выбери "Другое".
5. Не объясняй выбор.
6. Не оценивай качество инициативы.
7. Не решай, нужно ли принимать или отклонять инициативу.

Название инициативы:
{title}

Проблема:
{problem}

Предлагаемое решение:
{solution}
"""

    try:

        result = generate_with_gemini(
            prompt=prompt,
            response_model=AIClassificationResponse,
        )

        category = result.category

        # Дополнительная страховка:
        # даже если модель каким-то образом вернула
        # категорию не из разрешённого списка.
        if category not in IDEA_CATEGORIES:
            return "Другое"

        return category

    except Exception as error:

        print(
            "Gemini classification final error:",
            error,
        )

        # Если вообще все Gemini-модели недоступны,
        # создание заявки НЕ ломается.
        return "Ожидает классификации"


# =====================================================
# BASIC
# =====================================================


@app.get("/")
def root():

    return {
        "message": "SMART QALA API работает"
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }


# =====================================================
# AI API
# =====================================================


@app.post(
    "/ai/chat",
    response_model=AIChatResponse,
)
def ai_chat(
    request: AIChatRequest,
):

    if not request.messages:

        raise HTTPException(
            status_code=400,
            detail="Диалог пуст",
        )

    for message in request.messages:

        if message.role not in [
            "user",
            "assistant",
        ]:

            raise HTTPException(
                status_code=400,
                detail="Некорректная роль сообщения",
            )

        if not message.text.strip():

            raise HTTPException(
                status_code=400,
                detail="Сообщение не может быть пустым",
            )

    return chat_with_ai(
        messages=request.messages,
        language=request.language,
    )


@app.post(
    "/ai/prepare-idea",
    response_model=AIPrepareResponse,
)
def ai_prepare_idea(
    request: AIPrepareRequest,
):

    text = request.text.strip()

    if len(text) < 10:

        raise HTTPException(
            status_code=400,
            detail="Опишите идею немного подробнее",
        )

    return prepare_idea_with_ai(text)


# =====================================================
# AUTH
# =====================================================


@app.post(
    "/login",
    response_model=UserResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):

    email = login_data.email.strip().lower()

    user = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if (
        user is None
        or user.password != login_data.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Неверный email или пароль",
        )

    return user


# =====================================================
# RESIDENT REGISTRATION
# =====================================================


@app.post(
    "/register",
    response_model=UserResponse,
)
def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db),
):

    email = (
        register_data.email
        .strip()
        .lower()
    )

    name = register_data.name.strip()

    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Введите имя",
        )

    if len(register_data.password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Пароль должен содержать минимум 6 символов",
        )

    existing_user = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if existing_user is not None:

        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует",
        )

    new_user = models.User(
        name=name,
        email=email,
        password=register_data.password,
        role="resident",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# =====================================================
# ADMIN
# =====================================================


@app.get(
    "/admin/employees",
    response_model=list[UserResponse],
)
def get_government_employees(
    db: Session = Depends(get_db),
):

    return (
        db.query(models.User)
        .filter(
            models.User.role == "government"
        )
        .order_by(
            models.User.id.desc()
        )
        .all()
    )


@app.post(
    "/admin/employees",
    response_model=UserResponse,
)
def create_government_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
):

    email = (
        employee.email
        .strip()
        .lower()
    )

    name = employee.name.strip()

    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Введите ФИО сотрудника",
        )

    if len(employee.password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Пароль должен содержать минимум 6 символов",
        )

    existing_user = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if existing_user is not None:

        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует",
        )

    new_employee = models.User(
        name=name,
        email=email,
        password=employee.password,
        role="government",
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee


@app.delete(
    "/admin/employees/{employee_id}",
)
def delete_government_employee(
    employee_id: int,
    db: Session = Depends(get_db),
):

    employee = (
        db.query(models.User)
        .filter(
            models.User.id == employee_id,
            models.User.role == "government",
        )
        .first()
    )

    if employee is None:

        raise HTTPException(
            status_code=404,
            detail="Сотрудник не найден",
        )

    db.delete(employee)
    db.commit()

    return {
        "message": "Сотрудник удалён"
    }


# =====================================================
# ALL PUBLIC IDEAS
# =====================================================


@app.get(
    "/ideas",
    response_model=list[IdeaResponse],
)
def get_ideas(
    db: Session = Depends(get_db),
):

    return (
        db.query(models.Idea)
        .order_by(
            models.Idea.id.desc()
        )
        .all()
    )


# =====================================================
# USER IDEAS
# =====================================================


@app.get(
    "/users/{user_id}/ideas",
    response_model=list[IdeaResponse],
)
def get_user_ideas(
    user_id: int,
    db: Session = Depends(get_db),
):

    user = (
        db.query(models.User)
        .filter(
            models.User.id == user_id
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="Пользователь не найден",
        )

    return (
        db.query(models.Idea)
        .filter(
            models.Idea.author_id == user_id
        )
        .order_by(
            models.Idea.id.desc()
        )
        .all()
    )


# =====================================================
# ONE IDEA
# =====================================================


@app.get(
    "/ideas/{idea_id}",
    response_model=IdeaResponse,
)
def get_idea(
    idea_id: int,
    db: Session = Depends(get_db),
):

    idea = (
        db.query(models.Idea)
        .filter(
            models.Idea.id == idea_id
        )
        .first()
    )

    if idea is None:

        raise HTTPException(
            status_code=404,
            detail="Инициатива не найдена",
        )

    return idea


# =====================================================
# CREATE IDEA
# =====================================================


@app.post(
    "/ideas",
    response_model=IdeaResponse,
)
def create_idea(
    idea: IdeaCreate,
    db: Session = Depends(get_db),
):

    author = (
        db.query(models.User)
        .filter(
            models.User.id == idea.author_id
        )
        .first()
    )

    if author is None:

        raise HTTPException(
            status_code=404,
            detail="Автор не найден",
        )

    if author.role != "resident":

        raise HTTPException(
            status_code=403,
            detail="Только житель может создавать инициативы",
        )

    # -------------------------------------------------
    # AI автоматически определяет категорию
    # -------------------------------------------------

    category = classify_idea_with_ai(
        title=idea.title,
        problem=idea.problem,
        solution=idea.solution,
    )

    # -------------------------------------------------
    # Сохраняем инициативу в PostgreSQL
    # -------------------------------------------------

    new_idea = models.Idea(
        author_id=idea.author_id,
        title=idea.title,
        problem=idea.problem,
        solution=idea.solution,
        location=idea.location,
        category=category,
        status="Получена",
        supporters=0,
    )

    db.add(new_idea)
    db.commit()
    db.refresh(new_idea)

    return new_idea


# =====================================================
# GOVERNMENT
# =====================================================


@app.patch(
    "/ideas/{idea_id}/status",
    response_model=IdeaResponse,
)
def update_idea_status(
    idea_id: int,
    status_data: StatusUpdate,
    db: Session = Depends(get_db),
):

    allowed_statuses = [
        "Получена",
        "На рассмотрении",
        "В работе",
        "Нужны уточнения",
        "Завершена",
        "Отклонена",
    ]

    if status_data.status not in allowed_statuses:

        raise HTTPException(
            status_code=400,
            detail="Недопустимый статус",
        )

    idea = (
        db.query(models.Idea)
        .filter(
            models.Idea.id == idea_id
        )
        .first()
    )

    if idea is None:

        raise HTTPException(
            status_code=404,
            detail="Инициатива не найдена",
        )

    idea.status = status_data.status

    db.commit()
    db.refresh(idea)

    return idea


# =====================================================
# IDEA SUPPORT
# =====================================================


@app.get(
    "/ideas/{idea_id}/support/{user_id}",
    response_model=SupportResponse,
)
def get_support_status(
    idea_id: int,
    user_id: int,
    db: Session = Depends(get_db),
):

    idea = (
        db.query(models.Idea)
        .filter(
            models.Idea.id == idea_id
        )
        .first()
    )

    if idea is None:

        raise HTTPException(
            status_code=404,
            detail="Инициатива не найдена",
        )

    support = (
        db.query(models.IdeaSupport)
        .filter(
            models.IdeaSupport.idea_id == idea_id,
            models.IdeaSupport.user_id == user_id,
        )
        .first()
    )

    return {
        "idea_id": idea.id,
        "supporters": idea.supporters,
        "supported": support is not None,
    }


@app.post(
    "/ideas/{idea_id}/support",
    response_model=SupportResponse,
)
def toggle_idea_support(
    idea_id: int,
    support_data: SupportRequest,
    db: Session = Depends(get_db),
):

    idea = (
        db.query(models.Idea)
        .filter(
            models.Idea.id == idea_id
        )
        .first()
    )

    if idea is None:

        raise HTTPException(
            status_code=404,
            detail="Инициатива не найдена",
        )

    user = (
        db.query(models.User)
        .filter(
            models.User.id == support_data.user_id
        )
        .first()
    )

    if user is None:

        raise HTTPException(
            status_code=404,
            detail="Пользователь не найден",
        )

    if user.role != "resident":

        raise HTTPException(
            status_code=403,
            detail="Поддерживать инициативы могут только жители",
        )

    existing_support = (
        db.query(models.IdeaSupport)
        .filter(
            models.IdeaSupport.idea_id == idea_id,
            models.IdeaSupport.user_id == support_data.user_id,
        )
        .first()
    )

    # -------------------------------------------------
    # Если уже поддерживал — снимаем поддержку
    # -------------------------------------------------

    if existing_support is not None:

        db.delete(existing_support)

        idea.supporters = max(
            0,
            idea.supporters - 1,
        )

        db.commit()
        db.refresh(idea)

        return {
            "idea_id": idea.id,
            "supporters": idea.supporters,
            "supported": False,
        }

    # -------------------------------------------------
    # Если ещё не поддерживал — добавляем поддержку
    # -------------------------------------------------

    new_support = models.IdeaSupport(
        idea_id=idea_id,
        user_id=support_data.user_id,
    )

    db.add(new_support)

    idea.supporters += 1

    db.commit()
    db.refresh(idea)

    return {
        "idea_id": idea.id,
        "supporters": idea.supporters,
        "supported": True,
    }