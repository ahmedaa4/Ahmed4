
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
يستورد {
  القائمة، علامة زائد، مربع الرسائل، الدرع، المعلومات، إرسال، الميكروفون، X
  مصباح، بريد، بوصلة، رمز، سهم يمين، بريق، قلم رصاص، علامة صح، قفل، تسجيل خروج، المستخدم كأيقونة مستخدم، سهم يسار، مفتاح، تحديث، دائرة تنبيه، مشبك ورق، نسخ، إبهام لأعلى، إبهام لأسفل، المزيد أفقي، سلة المهملات 2، دبوس، إيقاف الدبوس، تخطيط الشبكة، خطوط الصوت، قمر، شمس، صورة كأيقونة صورة، لغات، كاميرا، إعدادات
} من 'lucide-react'؛
import ReactMarkdown from 'react-markdown';
استورد remarkGfm من 'remark-gfm'؛
import { Chat, Message, UserBalance, Language, User } from './types';
import { translations, detectLanguage } from './i18n';
import { generateAIResponse } from './services/geminiService';
import { sendOTPEmail } from './services/mailService';
import { db } from './db';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const REFILL_INTERVAL = 6 * 60 * 60 * 1000; // 6 ساعات
const STARTING_POINTS = 100;
const REFILL_POINTS = 100;
const OTP_EXPIRY_DURATION = 10 * 60 * 1000; // 10 دقائق

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const LogoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bird-arc" x1="0%" y1="0%" x2="100%" y2="100%">
        <إيقاف الإزاحة="0%" stopColor="#0052D4" />
        <إيقاف الإزاحة = "100%" stopColor = "#00AEEF" />
      </linearGradient>
      <linearGradient id="bird-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <إيقاف الإزاحة = "0%" stopColor = "#00E5FF" />
        <إيقاف الإزاحة = "100%" stopColor = "#0072FF" />
      </linearGradient>
      <linearGradient id="bird-wing1" x1="0%" y1="0%" x2="100%" y2="100%">
        <إيقاف الإزاحة = "0%" stopColor = "#00D2FF" />
        <إيقاف الإزاحة = "100%" stopColor = "#0072FF" />
      </linearGradient>
      <linearGradient id="bird-wing2" x1="0%" y1="0%" x2="100%" y2="100%">
        <إيقاف الإزاحة="0%" stopColor="#0072FF" />
        <إيقاف الإزاحة = "100%" stopColor = "#0052D4" />
      </linearGradient>
      <linearGradient id="bird-wing3" x1="0%" y1="0%" x2="100%" y2="100%">
        <إيقاف الإزاحة="0%" stopColor="#0052D4" />
        <إيقاف الإزاحة="100%" stopColor="#003399" />
      </linearGradient>
      <linearGradient id="bird-wing4" x1="0%" y1="0%" x2="100%" y2="100%">
        <إيقاف الإزاحة="0%" stopColor="#003399" />
        <إيقاف الإزاحة = "100%" stopColor = "#001166" />
      </linearGradient>
    </defs>

    {/* أعلى القوس */}
    <path d="M 190 200 C 210 140, 310 140, 320 160 C 270 150, 220 170, 220 210 Z" fill="url(#bird-arc)" />

    {/* جسم */}
    <path d="M 160 230 C 180 200, 220 200, 240 250 C 260 300, 280 340, 340 350 C 270 370, 200 330, 180 270 C 170 250, 160 240, 160 230 Z" fill="url(#bird-body)" />

    {/* منقار */}
    <path d="M 160 230 L 130 240 L 165 242 Z" fill="#0052D4" />

    {/* عين */}
    <circle cx="180" cy="220" r="5" fill="#002366" />

    {/* جناح علوي */}
    <path d="M 240 260 C 290 160, 380 110, 390 110 C 360 180, 320 240, 270 280 Z" fill="url(#bird-wing1)" />

    {/* جناح الوسط */}
    <path d="M 250 270 C 300 200, 370 160, 380 160 C 350 220, 300 270, 260 290 Z" fill="url(#bird-wing2)" />

    {/* وينغ بوت */}
    <path d="M 255 280 C 300 230, 360 210, 370 210 C 340 260, 290 290, 260 300 Z" fill="url(#bird-wing3)" />
    
    {/* Wing Bot Lowest */}
    <path d="M 260 290 C 300 250, 340 240, 350 240 C 320 280, 280 300, 260 310 Z" fill="url(#bird-wing4)" />

    {/* ريش الذيل */}
    <path d="M 290 330 L 370 380 L 350 390 Z" fill="url(#bird-wing2)" />
    <path d="M 300 330 L 360 410 L 340 410 Z" fill="url(#bird-wing3)" />
    <path d="M 310 330 L 340 420 L 320 410 Z" fill="url(#bird-wing1)" />
    
    {/* جزء الذيل المنفصل */}
    <path d="M 300 310 L 370 290 L 340 330 Z" fill="url(#bird-wing4)" />

  </svg>
);

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('amalix_lang');
    إذا كانت قيمة (saved === 'ar' || saved === 'en') فقم بإرجاع saved؛
    أعد استدعاء دالة اكتشاف اللغة.
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('amalix_theme');
    إذا كانت قيمة (saved === 'dark' || saved === 'light') فقم بإرجاع saved؛
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'chat' | 'about'>('chat');
  const [balance, setBalance] = useState<UserBalance>({ points: STARTING_POINTS, lastRefillTimestamp: Date.now() });
  const [inputText, setInputText] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({});
  
  // حالات إدارة الدردشة
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // حالات التفويض
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'verify' | 'reset'>('login');
  const [authFormData, setAuthFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', otp: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('amalix_theme', theme);
  }، [سمة])؛

  useEffect(() => {
    localStorage.setItem('amalix_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const init = async () => {
      await db.init();
      const savedUserEmail = localStorage.getItem('amalix_user_session');
      إذا كان البريد الإلكتروني للمستخدم محفوظًا {
        const userData = await db.getUser(savedUserEmail);
        إذا كانت بيانات المستخدم موجودة {
          setUser({ المعرف: userData.email، الاسم: userData.name، البريد الإلكتروني: userData.email });
          في انتظار checkAndApplyRefill(userData);
          const userChats = await db.getChats(userData.email);
          setChats(userChats);
        }
      }
    };
    init();
  }, []);

  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // معالجة اكتشاف التمرير اليدوي
  useEffect(() => {
    const container = chatContainerRef.current;
    إذا لم يكن هناك حاوية، فقم بالخروج.

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      setIsUserScrolling(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const prevChatIdRef = useRef<string | null>(null);

  // قم بالتمرير إلى الأسفل عند تبديل المحادثات أو عندما يرسل المستخدم رسالة (تصبح قيمة isLoading صحيحة)
  // لا تقم بالتمرير إلى أسفل الصفحة عند رد الذكاء الاصطناعي (تصبح قيمة isLoading خاطئة)، حتى يتمكن المستخدم من القراءة من أعلى الرد.
  useEffect(() => {
    // مرر لأسفل إذا انتقلنا للتو إلى محادثة أخرى
    إذا كان (currentChatId !== prevChatIdRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
      prevChatIdRef.current = currentChatId;
      يعود؛
    }

    // قم بالتمرير إذا أرسل المستخدم رسالة للتو (تصبح قيمة isLoading صحيحة)
    إذا كان التحميل جارياً {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    // لا تفعل شيئًا عندما تصبح قيمة isLoading خاطئة (ينتهي الذكاء الاصطناعي من الرد)
  }, [currentChatId, isLoading]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      إذا كان (أ. مثبتًا && !ب. مثبتًا) فأرجع -1؛
      إذا لم يكن a مثبتًا وكان b مثبتًا، فأرجع 1؛
      أعد b.updatedAt - a.updatedAt؛
    });
  }, [chats]);

  const syncUserData = useCallback(async (newBalance?: UserBalance) => {
    إذا لم يكن هناك مستخدم، فقم بالخروج؛
    const currentData = await db.getUser(user.email);
    const updatedBalance = newBalance || balance;
    await db.saveUser({
      ...البيانات الحالية،
      النقاط: updatedBalance.points،
      آخر طابع زمني لإعادة التعبئة: تم تحديث الرصيد. آخر طابع زمني لإعادة التعبئة
    });
  }, [user, balance]);

  useEffect(() => {
    إذا كان (المستخدم) قم بمزامنة بيانات المستخدم();
  }, [balance, user]);

  useEffect(() => {
    إذا كان (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 112)}px`;
    }
  }, [inputText]);

  // انقر على "مستمع خارجي" لعرض القوائم
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      إذا كان (activeMenuId && !(e.target as HTMLElement).closest('.chat-menu-container')) {
        setActiveMenuId(null);
      }
      إذا كان (عرض قائمة اللغات) و (ليس العنصر المستهدف هو عنصر HTML).أقرب('.lang-menu-container')) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId, showLangMenu]);

  const checkAndApplyRefill = useCallback(async (userData: any) => {
    إذا (القاعدة الفائقة) {
      يحاول {
        const { data, error } = await supabase
          .from('wallets')
          .select('balance, last_refresh')
          .eq('user_id', userData.email)
          .أعزب()؛

        إذا حدث خطأ، فقم برمي الخطأ.

        إذا (البيانات) {
          let currentPoints = data.balance || 0;
          let lastRefill = new Date(data.last_refresh || Date.now()).getTime();
          const now = Date.now();
          const elapsed = now - lastRefill;

          إذا كان (الوقت المنقضي >= فترة إعادة التعبئة) {
            const refillsEarned = Math.floor(elapsed / REFILL_INTERVAL);
            currentPoints += (refillsEarned * REFILL_POINTS);
            lastRefill = lastRefill + (refillsEarned * REFILL_INTERVAL);

            انتظر قاعدة البيانات
              .from('wallets')
              .تحديث({
                الرصيد: النقاط الحالية،
                last_refresh: new Date(lastRefill).toISOString()
              })
              .eq('user_id', userData.email);
          }

          setBalance({ points: currentPoints, lastRefillTimestamp: lastRefill });
          يعود؛
        }
      } catch (err) {
        console.error("فشل التحقق من إعادة تعبئة قاعدة البيانات الفائقة:", err);
      }
    }

    // الرجوع إلى المنطق المحلي في حالة عدم تهيئة Supabase أو فشلها
    يحاول {
      const res = await fetch(`/api/balance?email=${encodeURIComponent(userData.email)}`);
      إذا كانت النتيجة صحيحة {
        const data = await res.json();
        setBalance({ points: data.points, lastRefillTimestamp: new Date(data.last_topup_timestamp).getTime() });
      } آخر {
        throw new Error("فشلت واجهة برمجة التطبيقات");
      }
    } catch (err) {
      const now = Date.now();
      const elapsed = now - (userData.lastRefillTimestamp || now);
      let currentPoints = userData.points !== undefined ? userData.points : STARTING_POINTS;
      دع lastRefill = userData.lastRefillTimestamp || الآن؛

      إذا كان (الوقت المنقضي >= فترة إعادة التعبئة) {
        const refillsEarned = Math.floor(elapsed / REFILL_INTERVAL);
        currentPoints += (refillsEarned * REFILL_POINTS);
        lastRefill = lastRefill + (refillsEarned * REFILL_INTERVAL);
      }
      
      setBalance({ points: currentPoints, lastRefillTimestamp: lastRefill });
    }
  }, []);

  const currentChat = useMemo(() => chats.find(c => c.id === currentChatId), [chats, currentChatId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputError(null);
    const file = e.target.files?.[0];
    إذا كان الملف موجودًا {
      إذا كان حجم الملف أكبر من 5 × 1024 × 1024 {
        setInputError(isRtl ? 'طط¬ظ… ط§ظ‹طط¬ط¨ ط £ظ† ظٹظƒظˆظ† ط £ظ‚ظ‹ ظ…ظ† 5 ظ…ظٹط¬ط§ط¨ط§ظٹطھ' : 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت');
        يعود؛
      }
      إذا لم يبدأ نوع الملف بـ 'image/'،
        setInputError(isRtl ? 'ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± ظ…ظ„ظپ طµظˆط±ط© طµط§ظ„ط' : 'الرجاء تحديد ملف صورة صالح');
        يعود؛
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    setInputError(null);
    const finalInput = textOverride || inputText;
    إذا لم يتم حذف المسافات الزائدة من المدخلات النهائية، ولم يتم تحديد صورة، أو إذا كانت عملية التحميل جارية، أو إذا لم يكن المستخدم موجودًا، فقم بالخروج من البرنامج.

    إذا كان طول المدخلات النهائية أكبر من 4000 {
      setInputError(isRtl ? 'ط§ظ‹ط±ط³ط§ظ‹ط© ط·ظˆظٹظ‹ط© ط¬ط¯ط§ظ‹ (ط§ظ‹طط¯ ط§ظ‹ط £ظ‚طμظ‰ 4000 طط±ظپ)' : 'الرسالة طويلة جدًا (الحد الأقصى 4000 حرف)');
      يعود؛
    }

    const deduction = 20;

    // 1. تحقق من النقاط واخصمها من قاعدة البيانات قبل إنشاء الرد
    إذا (القاعدة الفائقة) {
      يحاول {
        // تشغيل منطق إعادة التعبئة التلقائية بالتوازي لضمان تحديث الرصيد
        انتظر التحقق من إعادة التعبئة وتطبيقها (المستخدم)؛
        
        // جلب آخر رصيد
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.email)
          .أعزب()؛

        إذا حدث خطأ في المحفظة، فقم برمي استثناء خطأ المحفظة.

        const currentBalance = walletData?.balance || 0;

        إذا كان الرصيد الحالي أقل من المبلغ المخصوم {
          setInputError(isRtl ? 'ط±طµظٹط¯ظƒ ط;ظٹط± ظƒط§ظپظچطŒ ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط± ظ„ظ„طھط¬ط¯ظٹط¯' : 'رصيد غير كافٍ. يرجى الانتظار حتى إعادة التعبئة التالية.');
          يعود؛
        }

        // خصم النقاط فوراً
        const newPoints = currentBalance - deduction;
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ balance: newPoints })
          .eq('user_id', user.email);

        إذا حدث خطأ في التحديث، فقم برمي استثناء خطأ التحديث.

        // تحديث واجهة المستخدم بالرصيد الجديد
        setBalance(prev => ({ ...prev, points: newPoints }));
      } catch (err) {
        console.error("فشل التحقق من النقاط أو خصمها:", err);
        setInputError(isRtl ? 'طط¯ط« ط®ط·ط £ ط £ ط«ظ†ط§ط، ط§ظ„طھطظ‚ظ‚ ظ…ظ† ط§ظ„ط±طμظٹط¯.' : 'خطأ في التحقق من الرصيد.');
        يعود؛
      }
    } آخر {
      إذا كانت النقاط المتبقية أقل من المبلغ المخصوم {
        setInputError(isRtl ? 'ط±طµظٹط¯ظƒ ط;ظٹط± ظƒط§ظپظچطŒ ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط± ظ„ظ„طھط¬ط¯ظٹط¯' : 'رصيد غير كافٍ. يرجى الانتظار حتى إعادة التعبئة التالية.');
        يعود؛
      }
      setBalance(prev => ({ ...prev, points: prev.points - deduction }));
    }

    setIsLoading(true);
    let updatedChat: Chat;

    إذا كان (editingMessageId && currentChat) {
      const msgIndex = currentChat.messages.findIndex(m => m.id === editingMessageId);
      إذا كان (msgIndex === -1) فارجع؛

      const newMessages = [...currentChat.messages.slice(0, msgIndex)];
      const updatedUserMessage: Message = {
        ...currentChat.messages[msgIndex],
        النص: الإدخال النهائي،
        الصورة: الصورة المحددة || غير محددة،
        الطابع الزمني: التاريخ.الآن()
      };
      newMessages.push(updatedUserMessage);
      
      updatedChat = { ...currentChat, messages: newMessages, updatedAt: Date.now() };
      setChats(prev => prev.map(c => c.id === UpdateChat.id ? UpdateChat : c));
      setEditingMessageId(null);
    } آخر {
      const newUserMessage: Message = {
        id: Date.now().toString(),
        الدور: 'مستخدم'،
        النص: الإدخال النهائي،
        الصورة: الصورة المحددة || غير محددة،
        الطابع الزمني: التاريخ.الآن()
      };
      const chatIdToUpdate = currentChatId || Date.now().toString();

      إذا لم تكن المحادثة الحالية {
        updatedChat = {
          المعرّف: chatIdToUpdate،
          العنوان: finalInput.slice(0, 30) + (finalInput.length > 30 ? '...' : ''),
          الرسائل: [رسالة المستخدم الجديد]،
          تاريخ التحديث: التاريخ الحالي
        };
        setChats(prev => [updatedChat, ...prev]);
        setCurrentChatId(updatedChat.id);
      } آخر {
        updatedChat = { ...currentChat, messages: [...currentChat.messages, newUserMessage], updatedAt: Date.now() };
        setChats(prev => prev.map(c => c.id === UpdateChat.id ? UpdateChat : c));
      }
    }
    
    const currentImage = selectedImage;
    setInputText('');
    setSelectedImage(null);

    يحاول {
      const history = updatedChat.messages.slice(0, -1).map(m => ({ role: m.role, text: m.text, image: m.image }));
      const aiResponse = await generateAIResponse(finalInput, history, currentImage || undefined);
      const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: aiResponse, timestamp: Date.now() };
      const finalChat = { ...updatedChat, messages: [...updatedChat.messages, modelMessage], updatedAt: Date.now() };
      setChats(prev => prev.map(c => c.id === FinalChat.id ? FinalChat : c));
      await db.saveChat({ ...finalChat, userId: user.email });
      
      // حفظ في قاعدة البيانات الفرعية
      إذا (القاعدة الفائقة) {
        يحاول {
          انتظر حتى يتم إدراج سجل المحادثات في قاعدة البيانات.
            user_id: user.email,
            السؤال: المدخلات النهائية،
            الإجابة: aiResponse
          });
        } catch (err) {
          console.error("فشل الحفظ في Supabase:", err);
        }
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        الدور: "عارض/عارضة أزياء"
        النص: isRtl
          ؟ "ط¹ط°ط±ط§ظ‹طŒ ط§ظ„ط®ط¯ظ…ط© ط؛ظٹط± ظ…طھظˆظپط±ط© طط§ظ„ظٹط§ظ‹. ظ‹ط§طظ‚ط§ظ‹."
          : "عذراً، الخدمة غير متوفرة حالياً. يرجى المحاولة مرة أخرى لاحقاً."
        الطابع الزمني: التاريخ.الآن()
      };
      setChats(prev => prev.map(c => c.id === updatedChat.id ? { ...c, messages: [...c.messages, errorMessage] } : c));
      
      // استرداد النقاط في حال فشل واجهة برمجة التطبيقات
      إذا (القاعدة الفائقة) {
        يحاول {
          const { data: walletData } = await supabase.from('wallets').select('balance').eq('user_id', user.email).single();
          إذا كانت بيانات المحفظة موجودة {
            const refundedPoints = walletData.balance + deduction;
            await supabase.from('wallets').update({ balance: refundedPoints }).eq('user_id', user.email);
            setBalance(prev => ({ ...prev, points: refundedPoints }));
          }
        } catch (refundErr) {
          console.error("فشل استرداد النقاط:", refundErr);
        }
      } آخر {
        setBalance(prev => ({ ...prev, points: prev.points + deduction }));
      }
    } أخيراً {
      setIsLoading(false);
    }
  };

  const nextRefillTime = useMemo(() => {
    const timeToNext = REFILL_INTERVAL - (Date.now() - balance.lastRefillTimestamp);
    إذا كان (الوقت المتبقي <= 0) فأرجع '0:00'؛
    const h = Math.floor(timeToNext / (1000 * 60 * 60));
    const m = Math.floor((timeToNext % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}:${m.toString().padStart(2, '0')}`;
  }، [توازن])؛

  const toggleRecording = () => {
    إذا لم يكن التعرف على الكلام ممكناً، فقم بالخروج.
    إذا كان التسجيل {
      recognitionRef.current?.stop();
    } آخر {
      const recognition = new SpeechRecognition();
      الاعتراف.lang = isRtl؟ 'ar-SA' : 'ar-US';
      recognition.onresult = (e: any) => setInputText(e.results[0][0].transcript);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const toggleLanguage = () => setLang(prev => prev === 'en' ? 'ar' : 'en');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setIsAuthLoading(true);

    const { email, name, password, confirmPassword, otp } = authFormData;

    يحاول {
      إذا كان وضع المصادقة هو "التسجيل" {
        إذا لم يتم حذف أي من الأحرف التالية: الاسم، أو البريد الإلكتروني، أو كلمة المرور، {
          throw new Error(isRtl ? 'ط¬ظ…ظٹط¹ ط§ظ„طظ‚ظˆظ ظ…ط·ظ„ظˆط¨ط©' : 'جميع الحقول مطلوبة');
        }
        
        إذا كان طول كلمة المرور أقل من 6 {
          throw new Error(isRtl ? 'ظƒظ‹ظ…ط© ط§ظ‹ظ…ط±ظˆط± ظٹط¬ط¨ ط £ظ‹ط§ طھظ‚ظ‹ ط¹ظ† 6 ط®ط§ظ†ط§طھ' : 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
        }

        const hasUpperCase = /[AZ]/.test(password);
        const hasLowerCase = /[az]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasArabic = /[\u0600-\u06FF]/.test(password);
        
        إذا لم يكن يحتوي على أحرف كبيرة أو صغيرة أو أرقام،
          رمي خطأ جديد(isRtl ? 'ظƒظ‹ظ…ط© ط§ظ‹ظ…ط±ظˆط± ظٹط¬ط¨ ط £ظ† طھططھظˆظٹ ط¹ظ„ظ‰ ط £طط±ظپ ط¥ظ†ط¬ظ„ظٹط²ظٹط© ظƒط¨ظٹط±ط© ظˆطط؛ظٹط±ط© ظˆط £ط±ظ‚ط§ظ…' : 'يجب أن تحتوي كلمة المرور على أحرف وأرقام كبيرة وصغيرة باللغة الإنجليزية');
        }

        إذا (كان هناك لغة عربية) {
          throw new Error(isRtl ? 'ظٹظڈظ…ظ†ط¹ ط§ط³طھط®ط¯ط§ظ… ط§ظ„ط £طط±ظپ ط§ظ„ط¹ط±ط¨ظٹط© ظپظٹ ظپظٹظ…ط© ط§ظ„ظ…ط±ظˆط±' : 'الأحرف العربية غير مسموح بها في كلمة المرور');
        }

        let apiSuccess = false;
        يحاول {
          const res = await fetch('/api/register', {
            الطريقة: 'POST'
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
          });
          
          const data = await res.json();
          إذا لم تكن النتيجة صحيحة (res.ok) {
            throw new Error(data.error || (isRtl ? 'طط¯ط« ط®ط·ط £ ط £ ط«ظ†ط§ط، ط§ظ„طھط³ط¬ظٹظ„' : 'فشل التسجيل'));
          }
          apiSuccess = true;
        } catch (apiErr: any) {
          إذا (apiErr.message && !apiErr.message.includes('fetch')) {
            throw apiErr; // قم برمي أخطاء التحقق من صحة واجهة برمجة التطبيقات مباشرةً
          }
          console.warn("فشل تسجيل واجهة برمجة التطبيقات، جارٍ الرجوع إلى قاعدة البيانات المحلية:", apiErr);
          const existing = await db.getUser(email);
          إذا (موجود) قم بإلقاء خطأ جديد(isRtl ? 'ظ‡ط°ط§ ط§ظ„ط¨ط±ظٹط¯ ظ…ط³ط¬ظ„ ط¨ط§ظ„ظپط¹ظ„' : 'البريد الإلكتروني مسجل بالفعل');
        }

        const newUser = { id: email, email, name, password, points: STARTING_POINTS, lastRefillTimestamp: Date.now() };
        await db.saveUser(newUser);
        
        // حفظ في قاعدة البيانات الفرعية
        إذا (القاعدة الفائقة) {
          يحاول {
            await supabase.from('users').insert({ id: email, email, name, password });
            await supabase.from('wallets').insert({ user_id: email, balance: STARTING_POINTS, last_refresh: new Date().toISOString() });
          } catch (err) {
            console.error("فشل حفظ المستخدم في قاعدة البيانات الفائقة:", err);
          }
        }
        
        setUser({ المعرف: البريد الإلكتروني، الاسم، البريد الإلكتروني });
        setBalance({ points: STARTING_POINTS, lastRefillTimestamp: Date.now() });
        localStorage.setItem('amalix_user_session', email);
      } else if (authMode === 'login') {
        إذا لم يتم حذف المسافات الزائدة من البريد الإلكتروني أو كلمة المرور، {
          throw new Error(isRtl ? 'ط¬ظ…ظٹط¹ ط§ظ„طظ‚ظˆظ ظ…ط·ظ„ظˆط¨ط©' : 'جميع الحقول مطلوبة');
        }

        let userDataToUse = null;

        يحاول {
          const res = await fetch('/api/login', {
            الطريقة: 'POST'
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const data = await res.json();
          إذا كانت النتيجة صحيحة {
            userDataToUse = { email: data.user.email, name: data.user.name, points: data.user.points, lastRefillTimestamp: Date.now() };
          } آخر {
            throw new Error(data.error || (isRtl ? 'ط§ظ„ط¨ط±ظٹط¯ ط £ظˆ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طμطظٹطط©' : 'بريد إلكتروني أو كلمة مرور غير صالحة'));
          }
        } catch (apiErr: any) {
          إذا (apiErr.message && !apiErr.message.includes('fetch')) {
            throw apiErr; // قم برمي أخطاء التحقق من صحة واجهة برمجة التطبيقات مباشرةً
          }
          console.warn("فشل تسجيل الدخول إلى واجهة برمجة التطبيقات، جارٍ الرجوع إلى قاعدة البيانات المحلية:", apiErr);
          const localUserData = await db.getUser(email);
          إذا (!localUserData || localUserData.password !== كلمة المرور) {
            throw new Error(isRtl ? 'ط§ظ‹ط¨ط±ظٹط¯ ط £ظˆ ظƒظ‹ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طμطظٹطط©' : 'بريد إلكتروني أو كلمة مرور غير صالحة');
          }
          userDataToUse = localUserData;
        }

        إذا كانت بيانات المستخدم المراد استخدامها {
          setUser({ id: userDataToUse.email, name: userDataToUse.name || email.split('@')[0], email: userDataToUse.email });
          انتظر التحقق من البيانات وتطبيق إعادة التعبئة (userDataToUse)؛
          const userChats = await db.getChats(userDataToUse.email);
          setChats(userChats);
          localStorage.setItem('amalix_user_session', userDataToUse.email);
        }
      } else if (authMode === 'forgot') {
        const userData = await db.getUser(email);
        إذا لم يتم العثور على بيانات المستخدم، فسيتم طرح خطأ جديد (isRtl ? 'ظ‡ط°ط§ ط§ظ„ط¨ط±ظٹط¯ ط;ظٹط± ظ…ط³ط¬ظ„ ظ„ط¯ظٹظ†ط§' : 'البريد الإلكتروني غير موجود');
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        userData.otp = generatedOtp;
        userData.otpExpiry = Date.now() + OTP_EXPIRY_DURATION;
        await db.saveUser(userData);
        في انتظار إرسال OTPEmail(email, generatorOtp);
        setAuthMode('verify');
        setAuthSuccess(t.otpSent);
      } else if (authMode === 'verify') {
        const userData = await db.getUser(email);
        إذا كان (userData.otp === otp && Date.now() < (userData.otpExpiry || 0)) {
          setAuthentication('reset');
        } آخر {
          throw new Error(Date.now() >= (userData.otpExpiry || 0) ? t.expiredOTP : t.invalidOTP);
        }
      } else if (authMode === 'reset') {
        if (password !== ConfirmPassword) throw new Error(isRtl ? 'ظƒظ„ظ…ط§طھ ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± ظ…طھط·ط§ط¨ظ‚ط©' : 'كلمات المرور غير متطابقة');
        await db.updatePassword(email, password);
        setAuthSuccess(t.passwordUpdated);
        setTimeout(() => setAuthMode('login'), 2000);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } أخيراً {
      setIsAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setChats([]);
    setCurrentChatId(null);
    localStorage.removeItem('amalix_user_session');
  };

  const startEditing = (text: string, id: string) => {
    setEditingMessageId(id);
    setInputText(text);
    إذا كان (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setFeedback(prev => ({ ...prev, [id]: prev[id] === type ? undefined : (type as any) }));
  };

  // إجراءات الدردشة
  const handleRenameChat = async (id: string) => {
    إذا لم يتم حذف المسافات الزائدة من عنوان المحادثة الجديد، {
      setRenamingChatId(null);
      يعود؛
    }
    const updatedChats = chats.map(c => c.id === id ? { ...c, title: newChatTitle } : c);
    setChats(updatedChats);
    const chatToUpdate = updatedChats.find(c => c.id === id);
    إذا كان (chatToUpdate && user) {
      await db.saveChat({ ...chatToUpdate, userId: user.email });
    }
    setRenamingChatId(null);
  };

  const handleDeleteChat = async (id: string) => {
    setChatToDelete(id);
    setActiveMenuId(null);
  };

  const confirmDeleteChat = async () => {
    إذا (كان يجب حذف المحادثة) {
      await db.deleteChat(chatToDelete);
      setChats(prev => prev.filter(c => c.id !== chatToDelete));
      إذا كان (currentChatId === chatToDelete) setCurrentChatId(null);
      setChatToDelete(null);
    }
  };

  const handleTogglePin = async (id: string) => {
    const updatedChats = chats.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
    setChats(updatedChats);
    const chatToUpdate = updatedChats.find(c => c.id === id);
    إذا كان (chatToUpdate && user) {
      await db.saveChat({ ...chatToUpdate, userId: user.email });
    }
    setActiveMenuId(null);
  };

  إذا لم يكن هناك مستخدم {
    يعود (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0b]' : 'bg-[#f8fafd]'} flex items-center justify-center p-4`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className={`w-full max-w-lg ${isDark ? 'bg-[#1e1f20] border-gray-800' : 'bg-white border-gray-50'} rounded-[48px] shadow-2xl relative border overflow-hidden`}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          {authMode !== 'login' && authMode !== 'signup' && (
            <button onClick={() => setAuthMode('login')} className={`absolute top-8 left-8 p-2 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} rounded-full transition-transform active:scale-90`}><ArrowLeft size={24} /></button>
          )}
          <div className="p-10 sm:p-16">
            <div className="flex flex-col items-center mb-10">
              <div className="mb-6">
                <LogoIcon className="w-24 h-24" />
              </div>
              <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{authMode === 'forgot' ? t.resetPassword : authMode === 'verify' ? t.verify : authMode === 'reset' ? t.newPassword : <span className="tracking-tight">Clarity <span className="text-blue-500">AI</span></span>}</h2>
              <p className="text-gray-400 text-sm font-medium mt-2">{t.authSubtitle}</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              {authError && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl text-center border border-red-100">{authError}</div>}
              {authSuccess && <div className="p-4 bg-green-50 text-green-600 text-xs font-bold rounded-2xl text-center border border-green-100">{authSuccess}</div>}
              {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot' || authMode === 'verify') && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.email}</label>
                  <input type="email" required readOnly={authMode === 'verify'} className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl py-4 px-6 mt-1 border-none focus:ring-2 focus:ring-blue-100 transition-all`} value={authFormData.email} onChange={(e) => setAuthFormData({...authFormData, email: e.target.value})} />
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.name}</label>
                  <input type="text" required className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl py-4 px-6 mt-1 border-none focus:ring-2 focus:ring-blue-100 transition-all`} value={authFormData.name} onChange={(e) => setAuthFormData({...authFormData, name: e.target.value})} />
                </div>
              )}
              {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.password}</label>
                  <input type="password" required className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl py-4 px-6 mt-1 border-none focus:ring-2 focus:ring-blue-100 transition-all`} value={authFormData.password} onChange={(e) => setAuthFormData({...authFormData, password: e.target.value})} />
                </div>
              )}
              {authMode === 'reset' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.confirmPassword}</label>
                  <input type="password" required className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl py-4 px-6 mt-1 border-none focus:ring-2 focus:ring-blue-100 transition-all`} value={authFormData.confirmPassword} onChange={(e) => setAuthFormData({...authFormData, confirmPassword: e.target.value})} />
                </div>
              )}
              {authMode === 'verify' && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.enterOTP}</label>
                  <input type="text" required maxLength={6} className={`w-full ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'} rounded-2xl py-4 px-6 mt-1 border-none text-center text-3xl font-black tracking-widest focus:ring-2 focus:ring-blue-100 transition-all`} value={authFormData.otp} onChange={(e) => setAuthFormData({...authFormData, otp: e.target.value.replace(/\D/g, '')})} />
                </div>
              )}
              <button disabled={isAuthLoading} type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                {isAuthLoading ? <RefreshCw className="animate-spin" /> : (authMode === 'login' ? t.login : authMode === 'signup' ? t.signup : authMode === 'forgot' ? t.sendCode : authMode === 'verify' ? t.verify : t.updatePassword)}
              </button>
              {authMode === 'login' && <div className="text-center mt-2"><button type="button" onClick={() => setAuthMode('forgot')} className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors">{t.forgotPassword}</button></div>}
            </form>
            {(authMode === 'login' || authMode === 'signup') && (
              <div className="mt-10 text-center text-sm font-medium text-gray-400">
                {authMode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}{' '}
                <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-blue-600 font-black hover:underline transition-colors">{authMode === 'login' ? t.signup : t.login}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  إذا كانت (العرض الحالي === 'حول') {
    يعود (
      <div className={`min-h-screen ${isDark ? 'bg-[#131314] text-[#e3e3e3]' : 'bg-[#f0f4f9] text-gray-900'} font-sans`} dir={isRtl ? 'rtl' : 'ltr'}>
        <header className={`h-16 flex items-center px-4 justify-between ${isDark ? 'bg-[#131314]/80 border-gray-800' : 'bg-white/80 border-gray-100'} backdrop-blur-md sticky top-0 z-10 border-b`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentView('chat')} className={`p-2 rounded-full transition-colors active:scale-90 ${isDark ? 'hover:bg-gray-800 text-[#c4c7c5]' : 'hover:bg-gray-100 text-gray-600'}`}>
              <ArrowLeft size={24} className={isRtl ? 'rotate-180' : ''} />
            </button>
            <h1 className="font-bold text-xl">{isRtl ? 'طظˆظ„ ط§ظ„طھط·ط¨ظٹظ‚' : 'حول التطبيق'}</h1>
          </div>
        </header>
        
        <div className="max-w-2xl mx-auto pt-10 px-4 animate-fade-in">
          <div className="flex flex-col items-center text-center mb-12">
            <LogoIcon className="w-24 h-24 mb-6" />
            <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Clarity <span className="text-blue-500">AI</span>
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {isRtl ? 'ط§ظ„ط¥طµط¯ط§ط± 1.0.0' : 'الإصدار 1.0.0'}
            </p>
          </div>

          <div className="space-y-4">
            زر
              onClick={() => setShowTermsModal(true)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] border border-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Shield size={24} />
                </div>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.terms}</span>
              </div>
              <ChevronRight size={20} className={isRtl ? 'rotate-180 text-gray-500' : 'text-gray-500'} />
            </button>

            زر
              onClick={() => setShowPrivacyModal(true)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] border border-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Lock size={24} />
                </div>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.privacy}</span>
              </div>
              <ChevronRight size={20} className={isRtl ? 'rotate-180 text-gray-500' : 'text-gray-500'} />
            </button>

            زر
              onClick={() => setShowAboutUsModal(true)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] border border-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <Info size={24} />
                </div>
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.aboutUs}</span>
              </div>
              <ChevronRight size={20} className={isRtl ? 'rotate-180 text-gray-500' : 'text-gray-500'} />
            </button>
          </div>
        </div>

        {/* النوافذ المنبثقة مُكيّفة مع القالب */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
            <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl scale-in`}>
              <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
                <h3>{t.terms}</h3>
                <button onClick={() => setShowTermsModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                {t.termsDetail.map((s, i) => <div key={i}><strong className={isDark ? 'text-white' : 'text-gray-900'}>{s.title}</strong><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{s.content}</p></div>)}
              </div>
            </div>
          </div>
        )}
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
            <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl scale-in`}>
              <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
                <h3>{t.privacy}</h3>
                <button onClick={() => setShowPrivacyModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed`}>{t.privacyIntro}</p>
                {t.privacyDetail.map((s, i) => <div key={i}><strong className={isDark ? 'text-white' : 'text-gray-900'}>{s.title}</strong><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{s.content}</p></div>)}
              </div>
            </div>
          </div>
        )}
        {showAboutUsModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
            <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl scale-in`}>
              <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
                <h3>{t.aboutUs}</h3>
                <button onClick={() => setShowAboutUsModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed whitespace-pre-wrap`}>{t.aboutUsIntro}</p>
                {t.aboutUsDetail.map((s, i) => <div key={i}><strong className={isDark ? 'text-white' : 'text-gray-900'}>{s.title}</strong><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1 whitespace-pre-wrap`}>{s.content}</p></div>)}
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-6 leading-relaxed whitespace-pre-wrap`}>{t.aboutUsOutro}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  يعود (
    <div className={`flex h-screen ${isDark ? 'bg-[#131314] text-[#e3e3e3]' : 'bg-white text-gray-900'} overflow-hidden`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* طبقة تراكب */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300 ease-out ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      <aside ref={sidebarRef} className={`fixed md:relative top-0 bottom-0 ${isRtl ? 'right-0' : 'left-0'} ${isSidebarOpen ? 'w-[85vw] max-w-[320px] md:w-[280px]' : 'w-0'} transition-all duration-300 ease-out ${isDark ? 'bg-[#1e1f20]' : 'bg-[#f0f4f9]'} ${isDark ? 'text-gray-300' : 'text-gray-700'} flex flex-col shrink-0 overflow-hidden z-[100] h-full shadow-2xl md:shadow-none`}>
        <div className="flex flex-col h-full w-[85vw] max-w-[320px] md:w-[280px]">
          {/* القسم العلوي: تبديل القائمة ودردشة جديدة */}
          <div className="p-3 flex flex-col gap-4">
            زر
              onClick={() => { setCurrentChatId(null); setCurrentView('chat'); setInputText(''); setEditingMessageId(null); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              className={`flex items-center gap-3 w-full py-3 px-4 rounded-full transition-all group active:scale-95 ${isDark ? 'bg-[#28292a] hover:bg-[#333537] text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700 shadow-sm hover:shadow-md'}`}
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              <span className="font-medium pr-2">{t.newChat}</span>
            </button>
          </div>

          {/* القسم الأوسط: سجل المحادثات */}
          <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
            <h3 className={`text-xs font-medium mb-3 px-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.recent}</h3>
            <div className="space-y-0.5">
              {sortedChats.map(chat => (
                <div key={chat.id} className="relative group chat-menu-container">
                  {renamingChatId === chat.id ? (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full animate-fade-in ${isDark ? 'bg-[#333537]' : 'bg-gray-200'}`}>
                      <input
                        التركيز التلقائي
                        className={`bg-transparent border-none focus:ring-0 text-sm w-full ${isDark ? 'text-white' : 'text-gray-900'}`}
                        القيمة = {عنوان المحادثة الجديد}
                        onChange={(e) => setNewChatTitle(e.target.value)}
                        onKeyDown={(e) => {
                          إذا كان (e.key === 'Enter') handleRenameChat(chat.id);
                          إذا كان (e.key === 'Escape') setRenamingChatId(null);
                        }}
                      />
                      <button onClick={() => handleRenameChat(chat.id)} className="text-blue-500 hover:text-blue-400 transition-colors"><Check size={16}/></button>
                    </div>
                  ) : (
                    <div className={`flex items-center gap-3 w-full p-2.5 rounded-full truncate relative transition-all ${currentChatId === chat.id ? (isDark ? 'bg-[#333537] text-white' : 'bg-[#e8eaed] text-gray-900') : (isDark ? 'hover:bg-[#28292a]' : 'hover:bg-gray-200/50')}`}>
                      زر
                        onClick={() => { setCurrentChatId(chat.id); setCurrentView('chat'); setEditingMessageId(null); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                        className="flex items-center gap-3 flex-1 truncate text-left"
                      >
                        {chat.isPinned ? <Pin size={14} className={`shrink-0 rotate-45 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} /> : <MessageSquare size={16} className="shrink-0 opacity-70" />}
                        <span className="truncate text-[14px] font-medium">{chat.title}</span>
                      </button>
                      زر
                        onClick={() => setActiveMenuId(activeMenuId === chat.id ? null : chat.id)}
                        className={`p-1.5 opacity-0 group-hover:opacity-100 rounded-full transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-300'}`}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  )}

                  {activeMenuId === chat.id && (
                    <div className={`absolute top-full ${isRtl ? 'right-0' : 'left-0'} mt-1 w-48 border rounded-2xl shadow-xl z-[110] p-1.5 flex flex-col gap-0.5 overflow-hidden animate-fade-in ${isDark ? 'bg-[#28292a] border-gray-700' : 'bg-white border-gray-100'}`}>
                      زر
                        onClick={() => { setRenamingChatId(chat.id); setNewChatTitle(chat.title); setActiveMenuId(null); }}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'hover:bg-[#333537] text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        <Pencil size={16} /> {t.rename}
                      </button>
                      زر
                        onClick={() => handleTogglePin(chat.id)}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'hover:bg-[#333537] text-gray-200' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        {chat.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                        {chat.isPinned ? t.unpin : t.pin}
                      </button>
                      <div className={`h-px my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                      زر
                        onClick={() => handleDeleteChat(chat.id)}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-sm font-medium transition-colors ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 size={16} /> {t.delete}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* القسم السفلي: المستخدم والإعدادات */}
          <div className={`mt-auto p-3 space-y-1 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            زر
              onClick={() => {
                setCurrentView('about');
                إذا كان (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`flex items-center gap-3 w-full p-2.5 rounded-full text-sm font-medium transition-colors ${currentView === 'about' ? (isDark ? 'bg-[#28292a] text-white' : 'bg-gray-200 text-gray-900') : (isDark ? 'hover:bg-[#28292a] text-gray-400' : 'hover:bg-gray-200/50 text-gray-600')}`}
            >
              <حجم المعلومات={18} />{isRtl ؟ 'طظˆظ‹ ط§ظ‹طھط·ط¨ظٹظ‚' : 'حول التطبيق'}
            </button>
            <div className={`p-3 rounded-2xl mt-2 border ${isDark ? 'bg-[#28292a] border-gray-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.balance}</span>
                {balance.points} {t.pointsShort}</span>
              </div>
              <div className={`text-[10px] font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.refillIn}: {nextRefillTime}</div>
            </div>
            <div className={`mt-2 p-2 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-[#28292a]' : 'bg-white shadow-sm border border-gray-100'}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">{user.name[0].toUpperCase()}</div>
              <div className={`flex-1 min-w-0 font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.name}</div>
              <button onClick={logout} className={`p-2 rounded-full transition-colors active:scale-90 ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400' : 'text-gray-500 hover:bg-gray-100 hover:text-red-500'}`}><LogOut size={16} /></button>
            </div>
          </div>
        </div>
      </aside>
      <main className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-[#131314]' : 'bg-white'} relative h-full transition-colors duration-300`}>
        <header className={`h-16 flex items-center px-4 justify-between ${isDark ? 'bg-[#131314]/80 border-gray-800' : 'bg-white/80 border-gray-100'} backdrop-blur-md sticky top-0 z-10 transition-colors duration-300`}>
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className={`p-2 rounded-full transition-colors active:scale-90 ${isDark ? 'hover:bg-gray-800 text-[#c4c7c5]' : 'hover:bg-gray-100 text-gray-600'}`}>
                <Menu size={24} />
              </button>
            )}
            <div className="flex items-center gap-2">
              زر
                onClick={() => setShowSecurityModal(true)}
                className={`p-1.5 rounded-full transition-colors ${isDark ? 'text-emerald-400 hover:bg-gray-800' : 'text-emerald-500 hover:bg-emerald-50'}`}
                عنوان = {isRtl ؟ "ط £ظ…ط§ظ† ظˆط§ظ„ط®طμظˆطμظٹط©" : "الأمان والخصوصية"}
              >
                <Shield size={28} className="fill-emerald-500/20" />
              </button>
              <h1 className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Clarity <span className="text-blue-500">AI</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative lang-menu-container">
              زر
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all active:scale-90 ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                العنوان: "اختر اللغة"
              >
                <Languages ​​size={18} />
                <span className="text-xs font-bold uppercase">{lang}</span>
              </button>
              {showLangMenu && (
                <div className={`absolute top-full mt-2 ${isRtl ? 'left-0' : 'right-0'} w-24 rounded-xl shadow-lg border overflow-hidden z-50 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  {(['en', 'ar', 'tr', 'fr', 'de', 'hi', 'zh', 'ku'] كلغة[]).map((l) => (
                    زر
                      المفتاح={l}
                      onClick={() => {
                        setLang(l);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-center px-4 py-2 text-sm font-medium transition-colors ${lang === l ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600') : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50')}`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={toggleTheme} className={`p-2 rounded-full transition-all active:scale-90 ${isDark ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border ${isDark ? 'bg-blue-900/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
              <span className={`text-[10px] font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{balance.points} {t.pointsShort}</span>
            </div>
          </div>
        </header>
        
        {currentView === 'about' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar">
            <div className="max-w-2xl mx-auto pt-10 animate-fade-in">
              <div className="flex flex-col items-center text-center mb-12">
                <LogoIcon className="w-24 h-24 mb-6" />
                <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Clarity <span className="text-blue-500">AI</span>
                </h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {isRtl ? 'ط§ظ„ط¥طµط¯ط§ط± 1.0.0' : 'الإصدار 1.0.0'}
                </p>
              </div>

              <div className="space-y-4">
                زر
                  onClick={() => setShowTermsModal(true)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] border border-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Shield size={24} />
                    </div>
                    <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.terms}</span>
                  </div>
                  <ChevronRight size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                </button>

                زر
                  onClick={() => setShowPrivacyModal(true)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] border border-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Lock size={24} />
                    </div>
                    <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.privacy}</span>
                  </div>
                  <ChevronRight size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                </button>

                زر
                  onClick={() => setShowAboutUsModal(true)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${isDark ? 'bg-[#1e1f20] hover:bg-[#28292a] border border-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                      <Info size={24} />
                    </div>
                    <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.aboutUs}</span>
                  </div>
                  <ChevronRight size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar pb-64">
              {!currentChat ? (
                <div className="max-w-4xl mx-auto pt-10 sm:pt-20 flex flex-col items-center text-center animate-fade-in">
                  <div className="mb-8 animate-pulse">
                    <LogoIcon className="w-24 h-24" />
                  </div>
                  <h2 className={`text-4xl sm:text-6xl font-black mb-8 leading-tight tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.welcomeMessage}</h2>
                </div>
              ) : (
            <div className="max-w-4xl mx-auto space-y-16">
              {currentChat.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
                  <div className={`flex flex-col gap-1 w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                    {msg.role === 'user' ? (
                      <div className={`px-6 py-4 max-w-[85%] rounded-[24px] relative group/msg transition-all ${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-[#f0f4f9] text-gray-900'} ${editingMessageId === msg.id ? 'ring-4 ring-blue-500/20' : ''}`}>
                        {msg.image && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                            <img src={msg.image} alt="تحميل المستخدم" className="max-w-full h-auto object-contain max-h-[400px]" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <p dir="auto" className="text-[17px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className={`flex items-center gap-2 mt-3 opacity-0 group-hover/msg:opacity-100 transition-opacity ${isRtl ? 'justify-end' : 'justify-start'}`}>
                           <button onClick={() => startEditing(msg.text, msg.id)} className={`p-1.5 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} rounded-full text-gray-400 transition-colors`}><Pencil size={16}/></button>
                           <button onClick={() => handleCopyText(msg.text, msg.id)} className={`p-1.5 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} rounded-full text-gray-400 transition-colors`}>{copiedId === msg.id ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full max-w-none" dir="auto">
                        <div className={`prose prose-lg max-w-none font-normal leading-[1.8] tracking-normal ${isDark ? 'prose-invert text-[#e3e3e3]' : 'text-gray-900'}
                          عناوين النثر: أسود، عناوين النثر: mb-5، عناوين النثر: mt-10
                          ${isDark ? 'prose-headings:text-white prose-strong:text-white' : 'prose-headings:text-gray-900 prose-strong:text-gray-900'}
                          prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                          prose-p:mb-6 prose-p:mt-0
                          نثر قوي: خط أسود
                          prose-li:my-2 prose-ul:list-disc prose-ol:list-decimal prose-ol:pl-6 prose-ul:pl-6
                          prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                          ${isDark ? 'prose-code:bg-gray-800' : 'prose-code:bg-gray-100'}
                        `}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            المكونات = {{
                              h1: ({node, ...props}) => <h1 className="text-3xl sm:text-4xl font-black mb-6 mt-10" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-2xl sm:text-3xl font-black mb-5 mt-8" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-xl sm:text-2xl font-black mb-4 mt-6" {...props} />,
                              li: ({node, ...props}) => <li className="mb-2 pl-2" {...props} />,
                              p: ({node, ...props}) => <p className={`mb-4 text-[1.1rem] leading-relaxed ${isDark ? 'text-[#e3e3e3]' : 'text-gray-800'}`} {...props} />,
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                        
                        <div className={`flex items-center gap-4 mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          <button onClick={() => handleCopyText(msg.text, msg.id)} className={`p-2 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors active:scale-90`} title={isRtl ? "ظ†ط³ط®" : "نسخ"}>
                            {copiedId === msg.id ? <Check size={18} className="text-green-600"/> : <Copy size={18}/>}
                          </button>
                          <button onClick={() => handleFeedback(msg.id, 'like')} className={`p-2 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-all active:scale-90 ${feedback[msg.id] === 'like' ? 'text-blue-600 bg-blue-50/10 shadow-sm' : ''}`}>
                            <ThumbsUp size={18} className={feedback[msg.id] === 'like' ? 'fill-current' : ''} />
                          </button>
                          <button onClick={() => handleFeedback(msg.id, 'dislike')} className={`p-2 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-all active:scale-90 ${feedback[msg.id] === 'dislike' ? 'text-red-600 bg-red-50/10 shadow-sm' : ''}`}>
                            <ThumbsDown size={18} className={feedback[msg.id] === 'dislike' ? 'fill-current' : ''} />
                          </button>
                          <button className={`p-2 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-full transition-colors active:scale-90`}><MoreHorizontal size={18}/></button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-6 items-center px-6 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center"><Sparkles size={18} className="text-white"/></div>
                  <div className="flex gap-1.5"><div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* مربع إدخال عائم على شكل حبة دواء */}
        <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 w-[90%] max-w-4xl z-40">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            
            {/* معاينة الصورة */}
            {selectedImage && (
              <div className="flex justify-center px-4 animate-fade-in">
                <div className={`relative group p-2 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-xl`}>
                  <img src={selectedImage} alt="محدد" className="h-32 w-auto rounded-xl object-cover" referrerPolicy="no-referrer" />
                  زر
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg hover:bg-red-700 transition-colors active:scale-90"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* اقتراحات */}
            {!currentChatId && inputText.length === 0 && (
              <div className="flex overflow-x-auto no-scrollbar gap-3 px-4 mb-3 animate-fade-in pb-2">
                {t.readyPrompts.map((p, i) => {
                  const Icon = p.icon === 'Pencil' ? Pencil : p.icon === 'Lightbulb' ? Lightbulb : p.icon === 'Compass' ? Compass : p.icon === 'Code' ? Code : p.icon === 'ChefHat' ? Sparkles : Sparkles;
                  يعود (
                    زر
                      المفتاح={i}
                      onClick={() => handleSendMessage(p.text)}
                      className={`shrink-0 text-left flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-300 border ${isDark ? 'bg-[#1e1f20]/40 border-gray-800/60 hover:bg-gray-800 hover:border-gray-700' : 'bg-white/60 border-gray-200/60 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'} hover:-translate-y-0.5 group backdrop-blur-sm`}
                      dir="auto"
                    >
                      <div className={`p-1.5 rounded-full w-fit ${isDark ? 'bg-gray-800/50 group-hover:bg-gray-700' : 'bg-gray-100/50 group-hover:bg-white'} transition-colors`}>
                        <Icon size={16} className={p.color} />
                      </div>
                      <span className={`text-[13px] font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{p.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className={`relative flex items-end gap-2 p-2 w-full rounded-[28px] border transition-all duration-300 ${inputError ? 'border-red-500 bg-red-50/50' : isDark ? 'bg-[#1e1f20] border-gray-700 shadow-sm focus-within:border-gray-600 focus-within:shadow-md' : 'bg-white border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:border-gray-300 focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}`}>
              
              {/* إجراء اليسار (إرفاق) */}
              <div className="shrink-0 pb-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  قبول "صورة/*"
                  className="hidden"
                />
              </div>

              {/* منطقة النص */}
              <div className="flex-1 flex flex-col justify-center min-h-[44px] py-1">
                {inputError && (
                  <div className="px-2 pb-1 text-xs font-bold text-red-500 animate-fade-in flex items-center gap-1">
                    <AlertCircle size={12} />
                    {inputError}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  القيمة = {inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    إذا حدث خطأ في الإدخال، فقم بتعيين قيمة خطأ الإدخال إلى null.
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder={isRtl ? "ط§ط³ط£ظ„ Clarity AI" : "اسأل Clarity AI"}
                  صفوف={1}
                  dir="auto"
                  className={`w-full bg-transparent border-none focus:ring-0 resize-none px-2 py-1.5 text-[16px] leading-relaxed transition-all duration-300 ${isDark ? 'text-gray-100 placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'} custom-scrollbar`}
                  style={{ maxHeight: '150px' }}
                />
              </div>

              {/* الإجراءات الصحيحة (الميكروفون، الكاميرا، الإرسال) */}
              <div className="flex items-center gap-1 shrink-0 pb-1">
                زر
                  onClick={toggleRecording}
                  className={`p-2.5 rounded-full transition-colors ${isRecording ? 'text-red-500 bg-red-50 animate-pulse' : isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                  title={isRtl ? "طھطط¯ط«" : "تحدث"}
                >
                  <Mic size={22} />
                </button>
                زر
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2.5 rounded-full transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                  title={isRtl ? "ط¥ط±ظپط§ظ‚ طµظˆط±ط©" : "إرفاق صورة"}
                >
                  <Camera size={22} />
                </button>
                
                زر
                  onClick={() => handleSendMessage()}
                  معطل = {(!inputText.trim() && !selectedImage) || جارٍ التحميل}
                  className={`ml-1 p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${inputText.trim() || selectedImage ? 'bg-black text-white hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-md' : isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  <Send size={20} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </main>

      {/* النوافذ المنبثقة مُكيّفة مع القالب */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl scale-in`}>
            <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
              <h3>{t.terms}</h3>
              <button onClick={() => setShowTermsModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
              {t.termsDetail.map((s, i) => <div key={i}><strong className={isDark ? 'text-white' : 'text-gray-900'}>{s.title}</strong><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{s.content}</p></div>)}
            </div>
          </div>
        </div>
      )}
      
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl scale-in`}>
            <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
              <h3>{t.privacy}</h3>
              <button onClick={() => setShowPrivacyModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed`}>{t.privacyIntro}</p>
              {t.privacyDetail.map((s, i) => <div key={i}><strong className={isDark ? 'text-white' : 'text-gray-900'}>{s.title}</strong><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>{s.content}</p></div>)}
            </div>
          </div>
        </div>
      )}

      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl scale-in`}>
            <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Shield size={24} className="fill-emerald-500/20" />
                </div>
                <h3 className="text-lg">{isRtl ? 'ط £ظ…ط§ظ† ظˆط§ظ„ط®طظˆطμظٹط© ظ…ط§ط¯ط«ط§طھ ظˆطھط´ظپط±ظ‡ط§' : 'الأمان والخصوصية'}</h3>
              </div>
              <button onClick={() => setShowSecurityModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
            </div>
            <div className="p-8 text-center space-y-4">
              <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {isRtl
                  ؟ 'ط®طμظˆطμظٹطھظƒ ظ‡ظٹ ط £ظˆظ„ظˆظٹطھظ†ط§.ط¬ظ…ظٹط¹ ط§ظ„ظ…طط§ط¯ط«ط§طھ ظپظٹ Clarity AI ظ…ط´ظھپط±ط© ط§ظ…ط§ظ…ط§ظ‹ (التشفير من طرف إلى طرف). ظ‚ط±ط§ط،ط© ط±ط³ط§ط¦ظ„ظƒ ط§ظˆ ط§ظ„ظˆطμظˆظ„ ط¥ظ„ظٹظ‡ط§.ط¨ظٹط§ظ†ط§طھظƒ ط§ظ…ظ†ط© ظˆظ…طظ…ظٹط© ط¨ط £طط¯ط« ط¨ط±ظˆطھظˆظظƒظˆظ„ط§طھ ط§ظ„طھط´ظپظٹط±.
                  خصوصيتك هي أولويتنا. جميع المحادثات في Clarity AI مشفرة بالكامل (تشفير من طرف إلى طرف). لا يمكن لأي طرف ثالث، ولا حتى تطبيق Clarity AI نفسه، قراءة رسائلك أو الوصول إليها. بياناتك آمنة ومحمية بأحدث بروتوكولات التشفير.
              </p>
              زر
                onClick={() => setShowSecurityModal(false)}
                className={`mt-6 w-full py-3 rounded-full font-bold transition-transform active:scale-95 ${isDark ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
              >
                {هل؟ 'طط³ظ†ط§ظ‹طŒ ظپظ‡ظ…طھ' : 'فهمت'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showAboutUsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl scale-in`}>
            <div className={`p-8 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'} flex justify-between items-center font-bold`}>
              <h3>{t.aboutUs}</h3>
              <button onClick={() => setShowAboutUsModal(false)} className={`${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} p-2 rounded-full transition-colors`}><X size={24} /></button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed whitespace-pre-wrap`}>{t.aboutUsIntro}</p>
              {t.aboutUsDetail.map((s, i) => <div key={i}><strong className={isDark ? 'text-white' : 'text-gray-900'}>{s.title}</strong><p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1 whitespace-pre-wrap`}>{s.content}</p></div>)}
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-6 leading-relaxed whitespace-pre-wrap`}>{t.aboutUsOutro}</p>
            </div>
          </div>
        </div>
      )}
      
      {showRefillModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[40px] w-full max-sm p-10 text-center scale-in shadow-2xl`}>
            <h3 className="text-2xl font-black mb-4">{t.insufficientPoints}</h3>
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t.insufficientPointsDesc}</p>
            <div className={`p-6 rounded-3xl mb-8 border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">{t.refillIn}</p>
              <p className="text-4xl font-black text-blue-600">{nextRefillTime}</p>
            </div>
            <button onClick={() => setShowRefillModal(false)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">موافق</button>
          </div>
        </div>
      )}

      {chatToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-fade-in">
          <div className={`${isDark ? 'bg-[#1e1f20] text-[#e3e3e3]' : 'bg-white text-gray-900'} rounded-[32px] w-full max-w-sm p-8 text-center scale-in shadow-2xl`}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-black mb-2">{t.delete}</h3>
            <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.confirmDelete}</p>
            <div className="flex gap-3">
              <button onClick={() => setChatToDelete(null)} className={`flex-1 py-3.5 rounded-xl font-bold transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                {هل؟ 'ط¥ظ‹ط؛ط§ط،' : 'إلغاء'}
              </button>
              <button onClick={confirmDeleteChat} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

تصدير التطبيق الافتراضي؛
