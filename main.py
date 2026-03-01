import os
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from supabase import create_client, Client
from google import genai
from dotenv import load_dotenv

# طھط­ظ…ظٹظ„ ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¨ظٹط¦ط©
load_dotenv()

app = FastAPI(title="Clarity AI Backend")

# ط¥ط¹ط¯ط§ط¯ ط§ظ„ط§طھطµط§ظ„ ط¨ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ظˆ Gemini
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

if GEMINI_API_KEY:
    ai_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    ai_client = None

class ChatRequest(BaseModel):
    user_id: str
    question: str

class RegisterRequest(BaseModel):
    user_id: str
    email: str
    name: str
    password: str

# ==========================================
# ظ†ظ‚ط·ط© ط§ظ„ظ†ظ‡ط§ظٹط© (Endpoint) ظ„ظ„طھط³ط¬ظٹظ„
# ==========================================
@app.post("/register")
async def register_user(request: RegisterRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="ط¥ط¹ط¯ط§ط¯ط§طھ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± ظ…ظƒطھظ…ظ„ط©.")
        
    user_id = request.user_id
    email = request.email
    name = request.name
    password = request.password
    
    # 1. ط¥ط¶ط§ظپط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط³طھط®ط¯ظ… ط¥ظ„ظ‰ ط¬ط¯ظˆظ„ users
    try:
        supabase.table("users").insert({
            "id": user_id,
            "email": email,
            "name": name,
            "password": password
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط§ظ„طھط³ط¬ظٹظ„: {str(e)}")
        
    # 2. ط¥ظ†ط´ط§ط، ط³ط¬ظ„ ظپظٹ ط¬ط¯ظˆظ„ wallets ط¨ط±طµظٹط¯ 100 ظ†ظ‚ط·ط©
    try:
        supabase.table("wallets").insert({
            "user_id": user_id,
            "balance": 100,
            "last_refresh": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ط­ط¯ط« ط®ط·ط£ ط£ط«ظ†ط§ط، ط¥ظ†ط´ط§ط، ط§ظ„ظ…ط­ظپط¸ط©: {str(e)}")
        
    return {"message": "طھظ… ط§ظ„طھط³ط¬ظٹظ„ ط¨ظ†ط¬ط§ط­ ظˆطھظ… ط¥ط¶ط§ظپط© 100 ظ†ظ‚ط·ط© ط¥ظ„ظ‰ ظ…ط­ظپط¸طھظƒ."}

# ==========================================
# ط¯ط§ظ„ط© ظ…ط³ط§ط¹ط¯ط©: ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظˆظ‚طھ ظˆطھط­ط¯ظٹط« ط§ظ„ط±طµظٹط¯ طھط±ط§ظƒظ…ظٹط§ظ‹
# ==========================================
def refresh_wallet_if_needed(user_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="ط¥ط¹ط¯ط§ط¯ط§طھ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± ظ…ظƒطھظ…ظ„ط©.")
        
    # ط¬ظ„ط¨ ط¨ظٹط§ظ†ط§طھ ظ…ط­ظپط¸ط© ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظ‚ط· (ط®طµظˆطµظٹط©)
    response = supabase.table("wallets").select("balance, last_refresh").eq("user_id", user_id).execute()
    
    if not response.data:
        return None
        
    wallet = response.data[0]
    balance = wallet.get("balance", 0)
    last_refresh_str = wallet.get("last_refresh")
    
    if last_refresh_str:
        # طھط­ظˆظٹظ„ ط§ظ„ظ†طµ ط¥ظ„ظ‰ ظƒط§ط¦ظ† ظˆظ‚طھ (ظ…ط¹ط§ظ„ط¬ط© طµظٹط؛ط© Supabase)
        try:
            last_refresh = datetime.fromisoformat(last_refresh_str.replace('Z', '+00:00'))
        except ValueError:
            last_refresh = datetime.now(timezone.utc)
            
        now = datetime.now(timezone.utc)
        
        # ط­ط³ط§ط¨ ط§ظ„ط³ط§ط¹ط§طھ ط§ظ„طھظٹ ظ…ط±طھ
        hours = (now - last_refresh).total_seconds() / 3600
        
        # ظ…ظ†ط·ظ‚ ط§ظ„ط²ظٹط§ط¯ط© ط§ظ„طھط±ط§ظƒظ…ظٹط© ط¥ط°ط§ ظ…ط± 6 ط³ط§ط¹ط§طھ ط£ظˆ ط£ظƒط«ط±
        if hours >= 6:
            intervals = int(hours // 6)
            added_points = intervals * 100
            new_balance = balance + added_points
            
            # طھط­ط¯ظٹط« ط§ظ„ظˆظ‚طھ ظ„ظٹظƒظˆظ† ط¯ظ‚ظٹظ‚ط§ظ‹ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ظپطھط±ط§طھ ط§ظ„طھظٹ ظ…ط±طھ
            new_last_refresh = last_refresh + timedelta(hours=intervals * 6)
            
            # ط­ظپط¸ ط§ظ„طھط­ط¯ظٹط« ظپظٹ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
            supabase.table("wallets").update({
                "balance": new_balance,
                "last_refresh": new_last_refresh.isoformat()
            }).eq("user_id", user_id).execute()
            
            return new_balance
            
    return balance

# ==========================================
# ظ†ظ‚ط·ط© ط§ظ„ظ†ظ‡ط§ظٹط© (Endpoint) ظ„ط¥ط±ط³ط§ظ„ ط§ظ„ط³ط¤ط§ظ„
# ==========================================
@app.post("/ask")
async def ask_gemini(request: ChatRequest):
    if not ai_client:
        raise HTTPException(status_code=500, detail="ط¥ط¹ط¯ط§ط¯ط§طھ Gemini ط؛ظٹط± ظ…ظƒطھظ…ظ„ط©.")
        
    user_id = request.user_id
    question = request.question

    # 1. طھط­ط¯ظٹط« ط§ظ„ط±طµظٹط¯ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ط¥ط°ط§ ظ…ط± 6 ط³ط§ط¹ط§طھ ظˆط¬ظ„ط¨ ط§ظ„ط±طµظٹط¯ ط§ظ„ط­ط§ظ„ظٹ
    balance = refresh_wallet_if_needed(user_id)
    if balance is None:
        raise HTTPException(status_code=404, detail="ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ط­ظپط¸ط© ظ„ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ….")
        
    # 2. ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط±طµظٹط¯ (ظٹط¬ط¨ ط£ظ† ظٹظƒظˆظ† 20 ط£ظˆ ط£ظƒط«ط±)
    amount = 20
    if balance < amount:
        return {"answer": "ط¹ط°ط±ط§ظ‹طŒ ط±طµظٹط¯ظƒ ط؛ظٹط± ظƒط§ظپظچ."}
        
    # 3. ط®طµظ… 20 ظ†ظ‚ط·ط©
    new_balance = balance - amount
    supabase.table("wallets").update({"balance": new_balance}).eq("user_id", user_id).execute()
    
    # 4. ط¥ط±ط³ط§ظ„ ط§ظ„ط³ط¤ط§ظ„ ظ„ظ€ Gemini
    try:
        response = ai_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=question,
        )
        answer = response.text
    except Exception as e:
        # ط¥ط±ط¬ط§ط¹ ط§ظ„ط±طµظٹط¯ ظپظٹ ط­ط§ظ„ ظپط´ظ„ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ
        supabase.table("wallets").update({"balance": balance}).eq("user_id", user_id).execute()
        raise HTTPException(status_code=500, detail="ط­ط¯ط« ط®ط·ط£ ظپظٹ ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط·ظ„ط¨.")

    # 5. ط­ظپط¸ ط§ظ„ظ…ط­ط§ط¯ط«ط© (ط®ط§طµط© ط¨ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظ‚ط·)
    supabase.table("chat_history").insert({
        "user_id": user_id,
        "question": question,
        "answer": answer
    }).execute()
    
    return {"answer": answer, "remaining_balance": new_balance}

# ==========================================
# طµظپط­ط© ط¹ط±ط¶ ط§ظ„ط¨ظٹط§ظ†ط§طھ (ط§ظ„ط±طµظٹط¯ ظˆط³ط¬ظ„ ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ)
# ==========================================
@app.get("/dashboard/{user_id}", response_class=HTMLResponse)
async def dashboard(user_id: str):
    # طھط­ط¯ظٹط« ط§ظ„ط±طµظٹط¯ ظ‚ط¨ظ„ ط§ظ„ط¹ط±ط¶ ظ„ط¶ظ…ط§ظ† ط±ط¤ظٹط© ط£ط­ط¯ط« ط±طµظٹط¯
    balance = refresh_wallet_if_needed(user_id)
    if balance is None:
        return HTMLResponse(content="<h3 style='text-align:center; color:red;'>ط§ظ„ظ…ط³طھط®ط¯ظ… ط؛ظٹط± ظ…ظˆط¬ظˆط¯</h3>", status_code=404)
        
    # ط¬ظ„ط¨ ط³ط¬ظ„ ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ ط§ظ„ط®ط§طµ ط¨ظ‡ط°ط§ ط§ظ„ظ…ط³طھط®ط¯ظ… ظپظ‚ط· (ط¶ظ…ط§ظ† ط§ظ„ط®طµظˆطµظٹط©)
    history_response = supabase.table("chat_history").select("question, answer").eq("user_id", user_id).order("id", desc=True).execute()
    history = history_response.data
    
    html_content = f"""
    <html dir="rtl" lang="ar">
        <head>
            <title>ظ„ظˆط­ط© طھط­ظƒظ… ط§ظ„ظ…ط³طھط®ط¯ظ…</title>
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
                <h2>ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…</h2>
                <p>ط±طµظٹط¯ظƒ ط§ظ„ط­ط§ظ„ظٹ: <span class="balance">{balance}</span> ظ†ظ‚ط·ط©</p>
                <p style="font-size: 0.9rem; color: #6b7280;">ظٹطھظ… ط¥ط¶ط§ظپط© 100 ظ†ظ‚ط·ط© طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظƒظ„ 6 ط³ط§ط¹ط§طھ.</p>
            </div>
            <h3 style="color: #374151;">ط³ط¬ظ„ ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط©:</h3>
    """
    
    if not history:
        html_content += "<p style='text-align: center; color: #6b7280;'>ظ„ط§ ظٹظˆط¬ط¯ ط³ط¬ظ„ ظ…ط­ط§ط¯ط«ط§طھ ط­طھظ‰ ط§ظ„ط¢ظ†.</p>"
    else:
        for chat in history:
            html_content += f"""
            <div class="chat-card">
                <div class="question">ط³: {chat['question']}</div>
                <div class="answer">ط¬: {chat['answer']}</div>
            </div>
            """
            
    html_content += "</body></html>"
    return HTMLResponse(content=html_content)
