import { LegalDoc, type LegalSection } from "@/components/site/legal";

export const metadata = { title: "Cookie Policy", description: "The cookies and similar technologies EduSphere uses, and your choices." };

const S: LegalSection[] = [
  { id: "what", title: "What cookies are", body: ["Cookies are small text files that a website stores in your browser. They are widely used to keep you signed in, to remember settings and to make websites work."] },
  { id: "use", title: "How EduSphere uses cookies", body: [
    "EduSphere uses only cookies that are strictly necessary for the Service to work. We do not use advertising cookies, cross-site tracking cookies or third-party analytics cookies.",
    ["es_session (essential): a signed, HTTP-only, expiring token that keeps you signed in. It is set when you sign in, is sent only over HTTPS in production, and expires after seven days or when you sign out. Without it the Service cannot recognise you.", "es_class (essential, teachers): remembers which class workspace a teacher last selected so that the right menu and tools appear.", "Preference storage (essential): in some places your browser may keep small, non-identifying interface settings, such as an open or closed menu, to make pages work smoothly."],
  ] },
  { id: "consent", title: "Consent", body: ["Because these cookies are strictly necessary to provide the service you request, they do not require consent in the way that optional cookies do. If we ever introduce optional cookies, such as analytics, we will ask for your consent first and update this page."] },
  { id: "control", title: "Managing cookies", body: ["You can delete or block cookies in your browser settings. If you block the essential cookies you will not be able to sign in. Signing out removes the session cookie."] },
  { id: "third", title: "Third-party content", body: ["Our pages may load fonts or scripts from reputable content delivery networks. These requests can reveal your IP address and browser details to the provider, as with any web request. We do not use them to track you across sites."] },
  { id: "changes", title: "Changes", body: ["We will update this page if our use of cookies changes and show the updated date at the top."] },
];

export default function Cookies() {
  return <LegalDoc path="/cookies" title="Cookie Policy" intro="EduSphere uses only the cookies it needs to keep you signed in and working. No advertising cookies. No cross-site tracking." sections={S} />;
}
