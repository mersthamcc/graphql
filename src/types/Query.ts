import {nonNull, objectType, stringArg} from "nexus";
import {auth, hasRole} from "keycloak-connect-graphql";
import {Context} from "../context";

export const Query = objectType({
    name: "Query",
    definition(t) {

        t.list.field("feed", {
            type: "News",
            resolve: auth((_: any, args: {}, context: Context) => {
                return context.prisma.news.findMany({
                    orderBy: {publishDate: "desc"},
                    take: 10
                });
            }),
        });

        t.list.field("members", {
            type: "Member",
            resolve: hasRole(["realm:ROLE_MEMBERSHIP"])((_: any, args: {}, context: Context) => {
                return context.prisma.member.findMany();
            })
        });

        t.list.field("membershipCategories", {
            type: "MemberCategory",
            args: {
                where: "MemberCategoryWhereInput"
            },
            resolve: auth((_: any, args: any, context: Context) => {
                return context.prisma.memberCategory.findMany({
                    orderBy: {
                        key: "asc"
                    },
                    where: args.where || undefined
                });
            })
        });
    },
});
