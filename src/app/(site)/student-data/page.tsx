import { LegalDoc, type LegalSection } from "@/components/site/legal";
import { SITE } from "@/lib/site";

export const metadata = { title: "Student & Children’s Data", description: "The extra protections EduSphere applies to students’ and children’s personal data." };

const S: LegalSection[] = [
  { id: "why", title: "Why this notice exists", body: [
    "Schools hold personal information about children — some of the most sensitive information there is. Children cannot easily understand or manage how their data is used, so the law, and common sense, call for extra care. This notice sets out the additional commitments we make for Student data in EduSphere, on top of our Privacy Policy.",
  ] },
  { id: "who", title: "Who can access a student’s information", body: [
    "A student’s record is visible to a limited group of people:",
    ["the student’s parents or guardians that the School has linked to that student;", "the teachers who are responsible for the student’s class or teach the student a subject, within the scope of their role;", "the School’s principal or administrators, who are responsible for the student’s education and safety;", "a limited number of authorised EduSphere personnel, only when needed to provide support or keep the Service secure, under confidentiality duties and with access recorded."],
    "Other parents, other schools and other students cannot see a student’s information. Parents with several children see only their own children.",
  ] },
  { id: "what", title: "What we hold about students", body: [
    "Only information a school normally needs: name, admission and roll number, class, gender, date of birth, blood group and address (as the School chooses to enter them), the link to parents or guardians, and school activity records such as attendance, homework completion, exam marks and leave records. Schools should enter only what they need. We do not collect photographs, biometrics, precise location, social media information or government identifiers.",
  ] },
  { id: "consent", title: "Parental consent and the School’s duties", body: [
    "Where a law requires verifiable parental or guardian consent before a child’s data is processed — as the Digital Personal Data Protection Act, 2023 does for persons under 18, subject to its exemptions for educational institutions — the School is responsible for obtaining and recording it. By enrolling a student in the Service, the School confirms that it has done what the law requires.",
    "Parents who have questions or wish to withdraw consent should contact the School. If the School asks us to stop processing or delete a student’s data, we will do so subject to the School’s legal record-keeping duties.",
  ] },
  { id: "commitments", title: "Our commitments for children’s data", body: [
    "We commit that we will not:",
    ["track, profile or monitor the behaviour of children, or analyse their data to infer interests, other than the plain school-activity calculations a School requests (for example an attendance percentage);", "direct advertising, marketing or sponsored content at children, or use their data for advertising to anyone;", "sell, rent or trade children’s personal data;", "use children’s data to train third-party advertising or profiling systems;", "process children’s data in a way that is likely to cause detrimental effect on their well-being."],
  ] },
  { id: "communication", title: "Messaging and safeguarding", body: [
    "Messaging in EduSphere takes place between adults — parents, teachers and the principal. Students do not hold accounts or message anyone. Who may message whom is restricted by role. Schools should have their own safeguarding and communication policies for staff and parents, and must not use the Service to contact children directly.",
    "If you have a concern about a child’s safety connected to the Service, report it to the School’s designated safeguarding lead and to us immediately; if a child is in danger, contact the local emergency services or the Childline 1098 helpline in India.",
  ] },
  { id: "accuracy", title: "Accuracy, correction and access", body: [
    "Parents may ask the School to show them the information held about their child and to correct anything that is wrong. Teachers and administrators can correct student records and, where a register is locked, the principal can return it for correction. We help Schools respond to these requests quickly.",
  ] },
  { id: "retention", title: "Retention and leaving the school", body: [
    "When a student leaves, the School may mark the record inactive so it is hidden from day-to-day lists while history is preserved, or delete it. We retain student data only for as long as the School keeps its account and needs the data, as described in the Privacy Policy, and delete it after the agreement ends.",
  ] },
  { id: "security", title: "Extra protections", body: [
    "Student data is protected by every measure in our Security page, with a particular emphasis on school separation (no school can reach another’s data), least-privilege roles, and an audit trail of important actions. Result data stays hidden from parents until the School publishes it.",
  ] },
  { id: "contact", title: "Contact", body: [
    `Parents and guardians: please contact your child’s School first. You can also write to us at ${SITE.email} with the subject “Student data”. We will respond within a reasonable time and cooperate with the School and any competent authority.`,
  ] },
];

export default function StudentData() {
  return <LegalDoc path="/student-data" title="Student & Children’s Data" intro="Extra protections for the information of students and children: who can see it, what we will never do with it, and how parents can get help." sections={S} />;
}
