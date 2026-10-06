import type { Prisma } from "@prisma/client";
export function announcementScope(ctx:{schoolId:string;role:string;classIds:string[]}):Prisma.AnnouncementWhereInput {
  return {schoolId:ctx.schoolId,...(ctx.role==="ADMIN"?{}:{OR:[
    {audience:{in:ctx.role==="TEACHER"?["ALL","TEACHERS"]:["ALL","PARENTS"]}},
    {audience:"CLASS",classId:{in:ctx.classIds}},
  ]})};
}
