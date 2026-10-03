import { LegalDoc, type LegalSection } from "@/components/site/legal";
import { SITE } from "@/lib/site";

export const metadata = { title: "Acceptable Use Policy", description: "Rules for using EduSphere safely, lawfully and respectfully." };

const S: LegalSection[] = [
  { id: "purpose", title: "Purpose", body: ["This Policy sets out what is and isn’t allowed when using EduSphere. It protects children, families, staff and the Service. It forms part of our Terms & Conditions. Schools are responsible for making sure their users follow it."] },
  { id: "principles", title: "Core principles", body: ["Use EduSphere for legitimate school purposes only. Treat everyone with respect. Look only at information that your role entitles you to see. Keep sign-in details private. Report problems."] },
  { id: "allowed", title: "What you may do", body: [["record and view attendance, homework, diary, portions, marks, leave and similar school information for your own classes, subjects or children;", "send respectful messages to teachers, parents and the principal about school matters;", "post accurate announcements and notices;", "export or print information about your own students or children for school purposes;", "ask us questions and suggest improvements."]] },
  { id: "prohibited", title: "What you must not do", body: [
    "You must not:",
    ["access another school’s data, another user’s account or information outside your role, or try to bypass permission, approval or locking controls;", "share, sell or lend your account, or use another person’s credentials;", "enter inaccurate attendance, marks or records knowingly, or alter records to mislead;", "use the Service to bully, harass, threaten, defame, stalk, shame or discriminate against any person, including on grounds of religion, caste, gender, disability or origin;", "share sexual, violent, hateful, extremist or illegal content, or anything that exploits or endangers a child;", "send spam, chain messages, political canvassing or commercial promotions;", "copy student data to personal devices, social media or messaging groups beyond what is necessary and permitted by the School;", "upload malware, probe for vulnerabilities, overload the Service, scrape it or use automated tools without our permission;", "use the Service in breach of any law, or to infringe intellectual property or privacy rights;", "impersonate staff, parents or EduSphere."],
  ] },
  { id: "messaging", title: "Messaging etiquette", body: ["Messages are for school matters. Be courteous and factual. Do not use messaging for urgent emergencies — call the school. Do not share passwords, bank details or other sensitive information in chat. Staff must keep communications with parents professional and appropriate to their role."] },
  { id: "children", title: "Protecting children", body: ["Children’s information must be used only to support their education, safety and welfare. Staff must follow their School’s child-safeguarding policy. Anyone who finds content that suggests a child is at risk should report it to the School’s safeguarding lead and to us immediately."] },
  { id: "monitoring", title: "Monitoring and enforcement", body: ["Schools can review activity in their workspace through the audit trail. We may investigate suspected breaches, preserve evidence, remove content, suspend or terminate accounts, and notify the School or the authorities where required by law. Serious or repeated breaches may lead to permanent removal."] },
  { id: "report", title: "Reporting a problem", body: [`If you see misuse, or think your account has been compromised, tell your School and email ${SITE.email} with the subject “Abuse report”. For a security vulnerability, see our Security page.`] },
];

export default function AUP() {
  return <LegalDoc path="/acceptable-use" title="Acceptable Use Policy" intro="Simple rules that keep EduSphere safe, fair and useful for the whole school community." sections={S} />;
}
