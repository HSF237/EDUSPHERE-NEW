import { cookies } from "next/headers";

export const LANGS = [
  { code: "en", label: "English", short: "EN" },
  { code: "ml", label: "മലയാളം", short: "മല" },
  { code: "hi", label: "हिन्दी", short: "हि" },
] as const;
export type Lang = (typeof LANGS)[number]["code"];
export const LANG_COOKIE = "es_lang";

export async function getLang(): Promise<Lang> {
  try {
    const v = (await cookies()).get(LANG_COOKIE)?.value;
    return v === "ml" || v === "hi" ? v : "en";
  } catch { return "en"; }
}

/** English text -> translation. Anything missing from the dictionary simply stays in English. */
const ML: Record<string, string> = {
  Overview: "അവലോകനം", Daily: "ദിനചര്യ", Academics: "അക്കാദമിക്", Connect: "ആശയവിനിമയം", School: "സ്കൂള്ൾ", Account: "അക്കൗണ്ട്", Finance: "ധനകാര്യം",
  Dashboard: "ഡാഷ്ബോർഡ്", Schools: "സ്കൂളുകൾ", Attendance: "ഹാജർ", Homework: "ഹോംവർക്ക്", "Discussed portions": "പഠിപ്പിച്ച ഭാഗങ്ങൾ", "Class diary": "ക്ലാസ് ഡയറി", Timetable: "ടൈംടേബിൾ",
  "Exams & marks": "പരീക്ഷയും മാർക്കും", "Exams & report cards": "പരീക്ഷയും റിപ്പോർട്ട് കാർഡും", Leave: "അവധി", Messages: "സന്ദേശങ്ങൾ", Announcements: "അറിയിപ്പുകൾ", "Parent meetings": "രക്ഷിതാക്കളുടെ യോഗം",
  Notifications: "അറിയിപ്പുകൾ", Students: "വിദ്യാർത്ഥികൾ", Teachers: "അധ്യാപകർ", "Classes & subjects": "ക്ലാസുകളും വിഷയങ്ങളും", Substitutes: "പകരം അധ്യാപകർ", Reports: "റിപ്പോർട്ടുകൾ", Settings: "ക്രമീകരണങ്ങൾ",
  Fees: "ഫീസ്", "Parent alerts": "രക്ഷിതാക്കൾക്കുള്ള അലേർട്ടുകൾ", Home: "ഹോം", More: "കൂടുതൽ", "Sign out": "പുറത്തുകടക്കുക", "Sign in": "പ്രവേശിക്കുക",
  "Welcome back": "വീണ്ടും സ്വാഗതം", Email: "ഇമെയിൽ", Password: "പാസ്‌വേഡ്", Name: "പേര്", Class: "ക്ലാസ്", Roll: "റോൾ", Status: "സ്ഥിതി", Active: "സജീവം", Disabled: "പ്രവർത്തനരഹിതം", Date: "തീയതി",
  Subject: "വിഷയം", Title: "തലക്കെട്ട്", Message: "സന്ദേശം", Save: "സേവ് ചെയ്യുക", Cancel: "റദ്ദാക്കുക", Delete: "ഇല്ലാത്താക്കുക", Pending: "തീർപ്പാക്കാത്തത്", Completed: "പൂർത്തിയായി", Overdue: "കാലാവധി കഴിഞ്ഞു",
  Present: "ഹാജർ", Absent: "അസാന്നിധ്യം", Late: "വൈകി", "Report card": "റിപ്പോർട്ട് കാർഡ്", Total: "ആകെ", Percentage: "ശതമാനം", Rank: "റാങ്ക്", Marks: "മാർക്ക്", Grade: "ഗ്രേഡ്",
  "Parent link": "രക്ഷിതാവിനുള്ള ലിങ്ക്", "Create school": "സ്കൂള് സൃഷ്ടിക്കുക", Amount: "തുക", Paid: "അടച്ചത്", Due: "ബാക്കി", Balance: "ബാക്കി തുക", Receipt: "രസീത്", "Fee structure": "ഫീസ് ഘടന",
  "Record payment": "പണം രേഖപ്പെടുത്തുക", "Print": "പ്രിന്റ് ചെയ്യുക", "No children linked": "കുട്ടികളെ ബന്ധിപ്പിച്ചിട്ടില്ല", "Change password": "പാസ്‌വേഡ് മാറ്റുക", Profile: "പ്രൊഫൈൽ", Language: "ഭാഷ",
  "Upcoming homework": "വരാനിരിക്കുന്ന ഹോംവർക്ക്", "Recent leave": "സമീപകാല അവധി", Guardians: "രക്ഷിതാക്കൾ", "Add student": "വിദ്യാർത്ഥിയെ ചേർക്കുക", "New announcement": "പുതിയ അറിയിപ്പ്",
  "No students found": "വിദ്യാർത്ഥികളെ കണ്ടെത്തിയില്ല", "No homework yet": "ഹോംവർക്ക് ഇതുവരെയില്ല", "No announcements yet": "അറിയിപ്പുകൾ ഇതുവരെയില്ല", Search: "തിരയുക", Filter: "ഫിൽട്ടർ",
  "Export your school’s data": "നിങ്ങളുടെ സ്കൂളിന്റെ ഡാറ്റ എക്സ്പോർട്ട് ചെയ്യുക", "School branding": "സ്കൂള് ബ്രാൻഡിംഗ്", "ID cards": "തിരിച്ചറിയൽ കാർഡുകൾ", Attachment: "അറ്റാച്ച്മെന്റ്", Download: "ഡൗൻലോഡ്",
};
const HI: Record<string, string> = {
  Overview: "सारांश", Daily: "दैनिक", Academics: "शैक्षणिक", Connect: "संपर्क", School: "विद्यालय", Account: "खाता", Finance: "वित्त",
  Dashboard: "डैशबोर्ड", Schools: "विद्यालय", Attendance: "उपस्थिति", Homework: "गृहकार्य", "Discussed portions": "पढ़ाया गया पाठ्यक्रम", "Class diary": "कक्षा डायरी", Timetable: "समय-सारणी",
  "Exams & marks": "परीक्षा और अंक", "Exams & report cards": "परीक्षा और रिपोर्ट कार्ड", Leave: "अवकाश", Messages: "संदेश", Announcements: "सूचनाएँ", "Parent meetings": "अभिभावक बैठकें",
  Notifications: "अधिसूचनाएँ", Students: "छात्र", Teachers: "शिक्षक", "Classes & subjects": "कक्षाएँ और विषय", Substitutes: "स्थानापन्न शिक्षक", Reports: "रिपोर्ट", Settings: "सेटिंग्स",
  Fees: "शुल्क", "Parent alerts": "अभिभावक अलर्ट", Home: "होम", More: "और", "Sign out": "साइन आउट", "Sign in": "साइन इन",
  "Welcome back": "फिर से स्वागत है", Email: "ईमेल", Password: "पासवर्ड", Name: "नाम", Class: "कक्षा", Roll: "रोल", Status: "स्थिति", Active: "सक्रिय", Disabled: "निष्क्रिय", Date: "तारीख",
  Subject: "विषय", Title: "शीर्षक", Message: "संदेश", Save: "सहेजें", Cancel: "रद्द करें", Delete: "हटाएँ", Pending: "लंबित", Completed: "पूर्ण", Overdue: "समय सीमा समाप्त",
  Present: "उपस्थित", Absent: "अनुपस्थित", Late: "देर से", "Report card": "रिपोर्ट कार्ड", Total: "कुल", Percentage: "प्रतिशत", Rank: "रैंक", Marks: "अंक", Grade: "ग्रेड",
  "Parent link": "अभिभावक लिंक", "Create school": "विद्यालय बनाएँ", Amount: "राशि", Paid: "भुगतान किया", Due: "बकाया", Balance: "शेष राशि", Receipt: "रसीद", "Fee structure": "शुल्क संरचना",
  "Record payment": "भुगतान दर्ज करें", Print: "प्रिंट करें", "No children linked": "कोई बच्चा जुड़ा नहीं है", "Change password": "पासवर्ड बदलें", Profile: "प्रोफ़ाइल", Language: "भाषा",
  "Upcoming homework": "आगामी गृहकार्य", "Recent leave": "हाल का अवकाश", Guardians: "अभिभावक", "Add student": "छात्र जोड़ें", "New announcement": "नई सूचना",
  "No students found": "कोई छात्र नहीं मिला", "No homework yet": "अभी कोई गृहकार्य नहीं", "No announcements yet": "अभी कोई सूचना नहीं", Search: "खोजें", Filter: "फ़िल्टर",
  "Export your school’s data": "अपने विद्यालय का डेटा निर्यात करें", "School branding": "विद्यालय ब्रांडिंग", "ID cards": "पहचान पत्र", Attachment: "संलग्नक", Download: "डाउनलोड",
};
const DICT: Record<Lang, Record<string, string>> = { en: {}, ml: ML, hi: HI };
export const tr = (lang: Lang, s: string) => DICT[lang][s] ?? s;
