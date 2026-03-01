import os
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# تحميل متغيرات البيئة
load_dotenv()

app = FastAPI(title="Clarity AI Backend")

# إعداد Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

# إعداد Gemini بأمان
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
ai_client = None
if GEMINI_API_KEY:
    try:
        from google import genai
        ai_client = genai.Client(api_key=GEMINI_API_KEY)
        print("Gemini initialized")
    except Exception as e:
        print("Gemini init failed:", e)

# نماذج البيانات
class ChatRequest(BaseModel):
    user_id: str
    question: str

class RegisterRequest(BaseModel):
    user_id: str
    email: str
    name: str
    password: str

# ==========================================
# تسجيل المستخدم
# ==========================================
@app.post("/register")
async def register_user(request: RegisterRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="إعداد قاعدة البيانات غير مكتمل.")
        
    user_id = request.user_id
    email = request.email
    name = request.name
    password = request.password
    
    try:
        supabase.table("users").insert({
            "id": user_id,
            "email": email,
            "name": name,
            "password": password
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"حدث خطأ أثناء التسجيل: {str(e)}")
        
    try:
        supabase.table("wallets").insert({
            "user_id": user_id,
            "balance": 100,
            "last_refresh": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"حدث خطأ أثناء إنشاء المحفظة: {str(e)}")
        
    return {"message": "تم التسجيل بنجاح وتم إضافة 100 نقطة إلى محفظتك."}

# ==========================================
# تحديث الرصيد إذا لزم
# ==========================================
def refresh_wallet_if_needed(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="إعداد قاعدة البيانات غير مكتمل.")
        
    response = supabase.table("wallets").select("balance, last_refresh").eq("user_id", user_id).execute()
    if not response.data:
        return None
        
    wallet = response.data[0]
    balance = wallet.get("balance", 0)
    last_refresh_str = wallet.get("last_refresh")
    
    if last_refresh_str:
        try:
            last_refresh = datetime.fromisoformat(last_refresh_str.replace('Z', '+00:00'))
        except ValueError:
            last_refresh = datetime.now(timezone.utc)
            
        now = datetime.now(timezone.utc)
        hours = (now - last_refresh).total_seconds() / 3600
        if hours >= 6:
            intervals = int(hours // 6)
            added_points = intervals * 100
            new_balance = balance + added_points
            new_last_refresh = last_refresh + timedelta(hours=intervals * 6)
            supabase.table("wallets").update({
                "balance": new_balance,
                "last_refresh": new_last_refresh.isoformat()
            }).eq("user_id", user_id).execute()
            return new_balance
            
    return balance

# ==========================================
# إرسال سؤال إلى Gemini
# ==========================================
@app.post("/ask")
async def ask_gemini(request: ChatRequest):
    if not ai_client:
        raise HTTPException(status_code=500, detail="إعداد Gemini غير مكتمل.")
        
    user_id = request.user_id
    question = request.question
    balance = refresh_wallet_if_needed(user_id)
    if balance is None:
        raise HTTPException(status_code=404, detail="لم يتم العثور على محفظة لهذا المستخدم.")
        
    amount = 20
    if balance < amount:
        return {"answer": "عذرًا، رصيدك غير كافٍ."}
        
    new_balance = balance - amount
    supabase.table("wallets").update({"balance": new_balance}).eq("user_id", user_id).execute()
    
    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=question,
        )
        answer = response.text
    except Exception as e:
        supabase.table("wallets").update({"balance": balance}).eq("user_id", user_id).execute()
        raise HTTPException(status_code=500, detail="حدث خطأ في معالجة الطلب.")
    
    supabase.table("chat_history").insert({
        "user_id": user_id,
        "question": question,
        "answer": answer
    }).execute()
    
    return {"answer": answer, "remaining_balance": new_balance}

# ==========================================
# عرض لوحة التحكم
# ==========================================
@app.get("/dashboard/{user_id}", response_class=HTMLResponse)
async def dashboard(user_id: str):
    balance = refresh_wallet_if_needed(user_id)
    if balance is None:
        return HTMLResponse(content="<h3 style='text-align:center; color:red;'>المستخدم غير موجود</h3>", status_code=404)
        
    history_response = supabase.table("chat_history").select("question, answer").eq("user_id", user_id).order("id", desc=True).execute()
    history = history_response.data
    
    html_content = f"""
    <html dir="rtl" lang="ar">
        <head>
            <title>لوحة تحكم المستخدم</title>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; color: #111827; padding: 2rem; max-width: 800px; margin: auto; }}
                .header-card {{ background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 2rem; text-align: center; border: 1px solid #e5e7eb; }}
                .balance {{ font-size: 2rem; font-weight: bold; color: #10b981; }}
                .chat-card {{ background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 1rem; border: 1px solid #e5e7eb; }}
                .question {{ font-weight: bold; color: #2563eb; margin-bottom: 0.5rem; font-size: 1.1rem; }}
                .answer {{ color: #4b5563; line-height: 1.6; white-space: pre-wrap; }}
            </style>
        </head>
        <body>
            <div class="header-card">
                <h2>مرحبًا بك في لوحة التحكم</h2>
                <p>رصيدك الحالي: <span class="balance">{balance}</span> نقطة</p>
                <p style="font-size: 0.9rem; color: #6b7280;">يتم إضافة 100 نقطة تلقائيًا كل 6 ساعات.</p>
            </div>
            <h3 style="color: #374151;">سجل المحادثات السابقة:</h3>
    """
    
    if not history:
        html_content += "<p style='text-align: center; color: #6b7280;'>لا يوجد سجل محادثات حتى الآن.</p>"
    else:
        for chat in history:
            html_content += f"""
            <div class="chat-card">
                <div class="question">س: {chat['question']}</div>
                <div class="answer">ج: {chat['answer']}</div>
            </div>
            """
            
    html_content += "</body></html>"
    return HTMLResponse(content=html_content)
