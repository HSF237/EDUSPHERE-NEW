import type { Lang } from "./i18n";

// Extra strings for the public sign-in page (kept separate from the main dictionary).
const ML: Record<string, string> = {
  "Signing in…": "സൈൻ ഇൻ ചെയ്യുന്നു…", "Sign in with the account your school gave you.": "നിങ്ങളുടെ സ്കൂൾ നൽകിയ അക്കൗണ്ട് ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക.", "Forgot your password? Ask your principal or class teacher for a reset link.": "പാസ്‌വേഡ് മറന്നോ? റീസെറ്റ് ലിങ്കിനായി പ്രിൻസിപ്പലിനോടോ ക്ലാസ് ടീച്ചറോടോ ചോദിക്കുക.", "Create your school": "നിങ്ങളുടെ സ്കൂൾ ഉണ്ടാക്കുക", "Back to home": "ഹോമിലേക്ക് മടങ്ങുക", "Terms": "നിബന്ധനകൾ", "Privacy Policy": "സ്വകാര്യതാ നയം", "Privacy": "സ്വകാര്യത", "and": "ഒപ്പം", "By signing in you agree to our": "സൈൻ ഇൻ ചെയ്യുന്നതിലൂടെ നിങ്ങൾ ഇവ അംഗീകരിക്കുന്നു:", "Password updated. Please sign in.": "പാസ്‌വേഡ് മാറ്റി. ദയവായി സൈൻ ഇൻ ചെയ്യുക.", "One platform for every school, teacher and parent.": "ഓരോ സ്കൂളിനും അധ്യാപകനും രക്ഷിതാവിനും ഒരൊറ്റ പ്ലാറ്റ്ഫോം.", "Attendance, homework, timetables, exams, leave and messaging — with every school’s data kept separate and secure.": "ഹാജർ, ഹോംവർക്ക്, ടൈംടേബിൾ, പരീക്ഷകൾ, അവധി, സന്ദേശങ്ങൾ — ഓരോ സ്കൂളിന്റെയും ഡാറ്റ വേറിട്ടും സുരക്ഷിതമായും.",
};
const HI: Record<string, string> = {
  "Signing in…": "साइन इन हो रहा है…", "Sign in with the account your school gave you.": "अपने विद्यालय द्वारा दिए गए खाते से साइन इन करें।", "Forgot your password? Ask your principal or class teacher for a reset link.": "पासवर्ड भूल गए? रीसेट लिंक के लिए प्रिंसिपल या कक्षा शिक्षक से पूछें।", "Create your school": "अपना विद्यालय बनाएँ", "Back to home": "होम पर वापस जाएँ", "Terms": "शर्तें", "Privacy Policy": "गोपनीयता नीति", "Privacy": "गोपनीयता", "and": "और", "By signing in you agree to our": "साइन इन करके आप इनसे सहमत हैं:", "Password updated. Please sign in.": "पासवर्ड बदल गया। कृपया साइन इन करें।", "One platform for every school, teacher and parent.": "हर विद्यालय, शिक्षक और अभिभावक के लिए एक मंच।", "Attendance, homework, timetables, exams, leave and messaging — with every school’s data kept separate and secure.": "उपस्थिति, गृहकार्य, समय-सारणी, परीक्षा, अवकाश और संदेश — हर विद्यालय का डेटा अलग और सुरक्षित।",
};

const OAUTH_ML: Record<string, string> = {
  "or": "അല്ലെങ്കിൽ",
  "Sign-in didn't complete. Please try again.": "സൈൻ ഇൻ പൂർത്തിയായില്ല. വീണ്ടും ശ്രമിക്കുക.",
  "Sign-in was cancelled.": "സൈൻ ഇൻ റദ്ദാക്കി.",
  "No EduSphere account uses this email. Ask your school for access, or create your school.": "ഈ ഇമെയിൽ ഉപയോഗിക്കുന്ന EduSphere അക്കൗണ്ട് ഇല്ല. പ്രവേശനത്തിനായി സ്കൂളിനോട് ചോദിക്കുക, അല്ലെങ്കിൽ നിങ്ങളുടെ സ്കൂൾ ഉണ്ടാക്കുക.",
  "This email is linked to a different sign-in. Use your email and password.": "ഈ ഇമെയിൽ മറ്റൊരു സൈൻ ഇന്നുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു. ഇമെയിലും പാസ്‌വേഡും ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക.",
  "Your email isn't verified with this provider. Verify it, then try again.": "ഈ ദാതാവിൽ നിങ്ങളുടെ ഇമെയിൽ സ്ഥിരീകരിച്ചിട്ടില്ല. സ്ഥിരീകരിച്ച ശേഷം വീണ്ടും ശ്രമിക്കുക.",
  "This account is inactive. Ask your principal for help.": "ഈ അക്കൗണ്ട് നിഷ്‌ക്രിയമാണ്. സഹായത്തിനായി പ്രിൻസിപ്പലിനോട് ചോദിക്കുക.",
  "Too many failed attempts. Try again later, or ask your school for a reset link.": "വളരെയധികം പരാജയപ്പെട്ട ശ്രമങ്ങൾ. കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ റീസെറ്റ് ലിങ്കിനായി സ്കൂളിനോട് ചോദിക്കുക.",
};

const OAUTH_HI: Record<string, string> = {
  "or": "या",
  "Sign-in didn't complete. Please try again.": "साइन इन पूरा नहीं हुआ। कृपया पुनः प्रयास करें।",
  "Sign-in was cancelled.": "साइन इन रद्द कर दिया गया।",
  "No EduSphere account uses this email. Ask your school for access, or create your school.": "इस ईमेल वाला कोई EduSphere खाता नहीं है। पहुँच के लिए अपने विद्यालय से पूछें, या अपना विद्यालय बनाएँ।",
  "This email is linked to a different sign-in. Use your email and password.": "यह ईमेल किसी अन्य साइन-इन से जुड़ा है। अपने ईमेल और पासवर्ड से साइन इन करें।",
  "Your email isn't verified with this provider. Verify it, then try again.": "इस प्रदाता के साथ आपका ईमेल सत्यापित नहीं है। सत्यापित करके पुनः प्रयास करें।",
  "This account is inactive. Ask your principal for help.": "यह खाता निष्क्रिय है। सहायता के लिए अपने प्रिंसिपल से पूछें।",
  "Too many failed attempts. Try again later, or ask your school for a reset link.": "बहुत अधिक असफल प्रयास। कुछ देर बाद प्रयास करें, या रीसेट लिंक के लिए विद्यालय से पूछें।",
};

export const trx = (lang: Lang, s: string) =>
  (lang === "ml" ? ML[s] ?? OAUTH_ML[s] : lang === "hi" ? HI[s] ?? OAUTH_HI[s] : undefined) ?? s;
