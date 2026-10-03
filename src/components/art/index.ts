export { Spot, type SpotName } from "./spot";
export { SceneClassroom, SceneReader, SceneLaptop, SceneParent, SceneCampus } from "./scenes";
import type { SpotName } from "./spot";

const T: [RegExp, SpotName][] = [
  [/^attendance/i, "attendance"], [/^homework/i, "homework"], [/diary/i, "diary"], [/timetable/i, "timetable"], [/exam/i, "exams"],
  [/leave/i, "leave"], [/message/i, "messages"], [/announcement/i, "announcements"], [/meeting|ptm/i, "ptm"], [/substitut/i, "substitutes"],
  [/^students/i, "students"], [/^teachers/i, "teachers"], [/classes/i, "classes"], [/report/i, "reports"], [/notification/i, "notifications"],
  [/settings/i, "settings"], [/^schools/i, "schools"], [/overview/i, "schools"],
];
export const spotForTitle = (t: string): SpotName | undefined => T.find(([r]) => r.test(t))?.[1];
