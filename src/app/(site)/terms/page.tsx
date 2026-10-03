import { LegalDoc, type LegalSection } from "@/components/site/legal";
import { SITE } from "@/lib/site";

export const metadata = { title: "Terms & Conditions", description: "The terms that govern use of the EduSphere school management platform." };

const S: LegalSection[] = [
  { id: "intro", title: "About these Terms", body: [
    `These Terms & Conditions (“Terms”) are a legal agreement about your use of EduSphere, a web-based school management platform operated by ${SITE.operator} (“EduSphere”, “we”, “us” or “our”), including our website, applications, features and related services (together, the “Service”).`,
    "By creating an account, signing in, or otherwise using the Service, you confirm that you have read, understood and agree to be bound by these Terms and by our Privacy Policy, Student & Children’s Data notice, Cookie Policy and Acceptable Use Policy, all of which are incorporated by reference. If you do not agree, you must not use the Service.",
    "Most users reach EduSphere because a school has set up an account for them. In that case, your school’s own rules and policies apply in addition to these Terms, and your school — not EduSphere — decides who gets an account and what they may do.",
  ] },
  { id: "definitions", title: "Definitions", body: [
    "In these Terms:",
    ["“School” means the educational institution that has subscribed to the Service or for which an account workspace has been created.", "“School Administrator” or “Principal” means a user authorised by the School to manage its workspace, including users, classes, permissions and published information.", "“Teacher” means a staff member who uses the Service to record or view classroom information.", "“Parent” means a parent, guardian or other person linked by the School to one or more Students.", "“Student” means a child or young person enrolled at the School whose records are held in the Service.", "“User” means any person who accesses the Service under an account, including School Administrators, Teachers and Parents.", "“School Data” means all information, content and records that a School or its Users submit to or generate in the Service, including personal data of Students, Parents and staff.", "“Platform Administrator” means personnel of EduSphere authorised to provision schools and operate the Service."],
  ] },
  { id: "roles", title: "Our role and the School’s role", body: [
    "EduSphere provides software. The School decides why and how Student, Parent and staff information is collected and used in its workspace. For School Data, the School is the party that determines the purpose and means of processing (the “data fiduciary” or “controller”), and EduSphere acts as a service provider that processes School Data on the School’s documented instructions (the “data processor”).",
    "Each School is solely responsible for: having a lawful basis and any required consents (including verifiable parental consent for children) before entering personal data into the Service; the accuracy of the data it enters; deciding which of its staff hold which roles and permissions; telling Parents and Students how their information is used; and responding to requests from the people the data is about.",
    "We do not make decisions about individual Students, grade or discipline Students, or verify the information that Schools and Teachers enter.",
  ] },
  { id: "eligibility", title: "Eligibility and accounts", body: [
    "Accounts are created by the School or by us on the School’s behalf. You may use an account only if you are authorised by the School to do so. Accounts are personal and may not be shared, sold or transferred.",
    "Persons under the age of 18 do not receive their own accounts. Student information is accessed by the Student’s Parents and the School’s authorised staff. Parents who access the Service on a child’s behalf do so as the child’s guardian.",
    "You agree to provide accurate information, to keep your sign-in credentials confidential, to choose a strong password, and to notify the School or us immediately if you suspect unauthorised use of your account. You are responsible for all activity under your account until you have told us otherwise and a reasonable time to act has passed.",
    "A School may deactivate an account at any time. We may suspend or deactivate an account if we reasonably believe these Terms have been breached, the account has been compromised, or the account poses a risk to the Service or other Users.",
  ] },
  { id: "service", title: "The Service", body: [
    "The Service currently includes tools for attendance with approval, homework, class diary, discussed portions, timetables and substitutes, exams, marks and report cards, leave requests, announcements, parent–teacher meetings, private messaging, notifications, reports and analytics, user and permission management, and an audit trail. Features may be added, changed or retired over time.",
    "We aim to provide a reliable, secure and accurate Service, but the Service is delivered over the internet, depends on third-party infrastructure and is provided “as available”. We do not promise that it will be uninterrupted or error-free. We will make reasonable efforts to give notice of planned maintenance.",
    "The Service supports, but does not replace, a School’s professional judgement and legal duties. Schools remain responsible for maintaining any records they are legally required to keep, and should keep their own backups of anything business-critical.",
  ] },
  { id: "roles-permissions", title: "Roles, permissions and approvals", body: [
    "The Service applies role-based access. Principals manage and oversee the School workspace, approve attendance registers, publish results and grant permissions. Teachers record classroom work for the classes and subjects assigned to them. Parents view information about their own children. Platform Administrators provision and support Schools.",
    "School Administrators may grant Teachers additional responsibilities by assigning a position and enabling individual permissions. A School is responsible for the permissions it grants and for reviewing them regularly. Where information (such as attendance or exam results) requires approval or publication before it is shown to Parents, you agree not to attempt to bypass that control.",
    "Approved attendance registers are locked and can be changed only after a School Administrator returns them for correction. Exam results are not visible to Parents until published.",
  ] },
  { id: "school-data", title: "School Data and ownership", body: [
    "As between the School and EduSphere, the School owns and retains all rights in School Data. You grant us a limited, non-exclusive, worldwide, royalty-free licence to host, store, copy, process, transmit and display School Data solely to provide, secure, support and improve the Service for the School, and as otherwise required by law.",
    "We do not sell School Data, use it for advertising, or build advertising profiles of Students, Parents or staff. We may create and use aggregated, de-identified statistics that cannot reasonably identify any individual or School to operate, secure and improve the Service.",
    "On written request and subject to payment of any outstanding fees, we will provide a School with an export of its School Data in a commonly used format and, when the agreement ends, delete or anonymise School Data within a reasonable period, except where retention is required by law or necessary to resolve a dispute or enforce these Terms.",
  ] },
  { id: "user-content", title: "Your content and conduct", body: [
    "You are responsible for the messages, notices, remarks, diary entries and other content you submit. You must have the right to submit it, and it must comply with the Acceptable Use Policy and applicable law.",
    "Messages in the Service are private communications between the participants, but the School may be able to access its workspace records for safeguarding, legal and administrative purposes in line with its own policies and the Privacy Policy. Do not use messaging to share sensitive information that is not necessary for a school purpose.",
    "We may remove or restrict content, or suspend an account, where we reasonably believe it breaches these Terms, is unlawful, or puts a child or any person at risk.",
  ] },
  { id: "acceptable-use", title: "Acceptable use", body: [
    "You agree to use the Service lawfully, respectfully and only for legitimate school purposes. In particular you must not:",
    ["access, or attempt to access, another School’s data, another User’s account, or information you are not authorised to see;", "share your credentials, or use someone else’s credentials;", "upload malware, probe or test the Service’s security without written permission, or interfere with its operation;", "scrape, copy, resell, sublicense or reverse engineer the Service except as permitted by law;", "harass, threaten, defame, discriminate against or exploit anyone, or share sexual, violent, hateful or otherwise unlawful content;", "enter personal data about a person without a lawful basis, or about children without the consents the School is required to obtain;", "use the Service to send spam or unrelated commercial communications."],
    "The full rules are in the Acceptable Use Policy.",
  ] },
  { id: "children", title: "Children and student data", body: [
    "The Service is designed for use by Schools and Parents, not directly by children. Student records are entered and managed by the School. Schools are responsible for obtaining verifiable consent from a Parent or guardian where the law requires it before a child’s personal data is processed.",
    "Our Student & Children’s Data notice explains the additional safeguards that apply to children’s information, including that we do not track or profile children for advertising or monitor their behaviour for any purpose other than the School’s educational and administrative functions.",
  ] },
  { id: "privacy", title: "Privacy and data protection", body: [
    "Our Privacy Policy explains what personal data we process, why, who we share it with, how long we keep it and what rights you have. It forms part of these Terms.",
    "We process personal data in line with applicable data-protection laws, which include the Information Technology Act, 2000 (India) and the Digital Personal Data Protection Act, 2023 (India), together with any other law that applies to the School. Where the School is located outside India, the School is responsible for identifying and following its local data-protection requirements and we will cooperate reasonably.",
    "If we become aware of a personal-data breach affecting School Data, we will notify the affected School without undue delay so that it can meet its own obligations.",
  ] },
  { id: "security", title: "Security", body: [
    "We use reasonable technical and organisational measures to protect the Service, including encrypted connections, hashed passwords, role-based access, school-level data separation, signed and expiring sessions and an audit trail. No system is perfectly secure, and we cannot guarantee that unauthorised access will never occur.",
    "You must protect your own devices and credentials, sign out on shared devices, and report suspected incidents promptly. Please read our Security page, including how to report a vulnerability responsibly.",
  ] },
  { id: "ip", title: "Intellectual property", body: [
    `The Service, including its software, design, illustrations, text, graphics, trademarks and logos, is owned by ${SITE.operator} or its licensors and is protected by copyright and other laws. Subject to these Terms, we grant Schools and Users a limited, non-exclusive, non-transferable, revocable right to access and use the Service for their internal school purposes during the term of the agreement.`,
    "All rights not expressly granted are reserved. You must not remove proprietary notices or use our names or logos without written permission. If you send us feedback or suggestions, we may use them freely without obligation to you.",
  ] },
  { id: "third-parties", title: "Third-party services", body: [
    "The Service relies on third-party providers for hosting, database, content delivery and similar infrastructure (for example, managed cloud hosting and a managed PostgreSQL database). These providers process data only to deliver their services to us and are bound by their own terms and security commitments. Links to external websites are provided for convenience; we are not responsible for their content or practices.",
  ] },
  { id: "fees", title: "Fees and payment", body: [
    "Unless agreed otherwise in writing, fees, billing cycles and any trial or pilot arrangements are set out in the order, quotation or agreement between the School and us. Fees are exclusive of applicable taxes (such as GST), which are payable in addition where they apply.",
    "If a School’s account is overdue, we may, after reasonable written notice, suspend access until payment is made. Suspension does not delete School Data. Fees already paid are non-refundable except where required by law or stated in the School’s agreement.",
  ] },
  { id: "availability", title: "Availability, support and changes", body: [
    "We use commercially reasonable efforts to keep the Service available but do not guarantee any particular uptime unless a written service-level agreement says so. We may suspend the Service briefly for maintenance, security or to comply with the law.",
    "We provide support by email and messaging during normal business hours, India time, on a reasonable-efforts basis.",
    "We may change the Service or these Terms. If we make a material change to these Terms we will give reasonable notice — for example by email to School Administrators, a notice in the Service, or an updated date at the top of this page. Continued use after the change takes effect means you accept the updated Terms. If you do not agree, you should stop using the Service and tell your School.",
  ] },
  { id: "term", title: "Term, suspension and termination", body: [
    "These Terms apply from when you first access the Service until your account or the School’s agreement ends. A School may stop using the Service at any time by giving written notice. We may terminate or suspend a School’s access for material breach that is not remedied within a reasonable period after notice, for non-payment as described above, where required by law, or immediately where necessary to protect Users, children or the Service.",
    "On termination, rights to use the Service end, and Sections that by their nature should survive (including ownership, disclaimers, liability limits, indemnities and governing law) continue to apply. Data handling after termination follows Section 7.",
  ] },
  { id: "disclaimer", title: "Disclaimers", body: [
    "To the fullest extent permitted by law, the Service is provided “as is” and “as available”, without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, non-infringement and accuracy. We do not warrant that the Service will meet every requirement of a School, that results or calculations will be error-free, or that information entered by Schools and Users is accurate.",
    "Calculated figures such as percentages, grades, ranks and analytics are produced from the data entered into the Service. Schools should review them before relying on them for decisions affecting Students, including promotion and certification.",
  ] },
  { id: "liability", title: "Limitation of liability", body: [
    "To the fullest extent permitted by law, EduSphere and its owners, directors, employees and contractors will not be liable for any indirect, incidental, special, consequential, exemplary or punitive damages, or for loss of profits, revenue, goodwill, data or business opportunity, arising out of or in connection with the Service or these Terms, even if advised of the possibility of such loss.",
    "Our total aggregate liability for all claims relating to the Service in any twelve-month period will not exceed the greater of (a) the fees the relevant School paid to us for the Service in the twelve months before the event giving rise to the claim, and (b) INR 10,000.",
    "Nothing in these Terms excludes or limits liability that cannot be excluded or limited by law, including liability for fraud, wilful misconduct, or death or personal injury caused by negligence.",
  ] },
  { id: "indemnity", title: "Indemnity", body: [
    "Each School agrees to indemnify and hold harmless EduSphere against claims, losses and reasonable costs arising out of (a) the School’s or its Users’ breach of these Terms or applicable law, (b) School Data entered without a lawful basis or required consent, or (c) content submitted by the School’s Users that infringes the rights of others. We will give prompt notice of any claim, allow the School reasonable control of the defence and cooperate at the School’s expense.",
  ] },
  { id: "governing-law", title: "Governing law and disputes", body: [
    `These Terms are governed by the laws of India. Subject to the paragraph below, the courts located in ${SITE.jurisdiction} have exclusive jurisdiction over any dispute arising out of or in connection with them.`,
    "Before starting formal proceedings, the parties agree to try in good faith to resolve a dispute through discussion for at least thirty days after one party gives written notice of it. Nothing prevents either party from seeking urgent injunctive relief from a competent court.",
  ] },
  { id: "force-majeure", title: "Events beyond our control", body: [
    "Neither party is liable for failure or delay caused by events beyond its reasonable control, including natural disasters, epidemics, war, civil unrest, strikes, government action, power or internet failures, or failures of third-party infrastructure providers, provided it takes reasonable steps to limit the effect.",
  ] },
  { id: "general", title: "General", body: [
    "Entire agreement: these Terms, together with the documents they incorporate and any written order or agreement with the School, are the entire agreement concerning the Service and replace earlier understandings.",
    "Severability: if a provision is found unenforceable, the remainder stays in effect and the provision will be enforced to the maximum extent permissible. Waiver: failing to enforce a right is not a waiver of it. Assignment: you may not assign your rights without our written consent; we may assign ours in connection with a merger, acquisition or sale of the business. No third-party rights: these Terms do not create rights for anyone other than the parties, except that Parents may enforce the protections intended for their children’s data through the School. Notices: we may give notice by email, in the Service or by posting on our site; you may give notice to the contact address below.",
  ] },
  { id: "contact", title: "Contact us", body: [
    `${SITE.operator}, ${SITE.location}.`,
    [`Email: ${SITE.email}`, `WhatsApp: ${SITE.phoneDisplay}`],
    "These Terms are a general-purpose template provided for transparency. Schools with specific regulatory requirements should seek independent legal advice.",
  ] },
];

export default function Terms() {
  return <LegalDoc path="/terms" title="Terms & Conditions" intro="Please read these terms carefully. They explain what you can expect from EduSphere, what we expect from you and your school, and how responsibility is shared." sections={S} />;
}
