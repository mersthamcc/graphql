import { intArg, nonNull, objectType, stringArg } from "nexus";
import { auth, hasRole } from "keycloak-connect-graphql";
import { Context } from "../context";

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.list.field("feed", {
      type: "News",
      resolve: auth((_: any, args: {}, context: Context) => {
        return context.prisma.news.findMany({
          orderBy: { publishDate: "desc" },
          take: 10,
        });
      }),
    });

    t.list.field("members", {
      type: "Member",
      resolve: hasRole(["realm:ROLE_MEMBERSHIP"])(
        (_: any, args: {}, context: Context) => {
          return context.prisma.member.findMany();
        }
      ),
    });

    t.list.field("memberSummary", {
      type: "Member",
      args: {
        start: nonNull(intArg()),
        length: nonNull(intArg()),
      },
      resolve: hasRole(["realm:ROLE_MEMBERSHIP"])(
        (_: any, args: { start: number; length: number }, context: Context) => {
          return context.prisma.member.findMany({
            take: args.length,
            skip: args.start,
          });
        }
      ),
    });

    t.field("member", {
      type: "Member",
      args: {
        id: nonNull(intArg()),
      },
      resolve: hasRole(["realm:ROLE_MEMBERSHIP"])(
        (_: any, args: { id: number }, context: Context) => {
          return context.prisma.member.findUnique({
            where: {
              id: args.id,
            },
          });
        }
      ),
    });

    t.list.field("attributes", {
      type: "AttributeDefinition",
      resolve: (_: any, args: any, context: Context) => {
        return context.prisma.attributeDefinition.findMany({
          orderBy: {
            key: "asc",
          },
        });
      },
    });

    t.list.field("membershipCategories", {
      type: "MemberCategory",
      args: {
        where: "MemberCategoryWhereInput",
      },
      resolve: auth((_: any, args: any, context: Context) => {
        return context.prisma.memberCategory.findMany({
          orderBy: {
            key: "asc",
          },
          where: args.where || undefined,
        });
      }),
    });

    t.list.field("myOrders", {
      type: "Order",
      resolve: auth((_: any, args: any, context: Context) => {
        return context.prisma.order.findMany({
          orderBy: {
            createDate: "asc",
          },
          where: {
            // @ts-ignore
            ownerUserId: context.kauth.accessToken.content.sub,
          },
        });
      }),
    });

    t.list.field("orders", {
      type: "Order",
      args: {
        where: "OrderWhereInput",
      },
      resolve: hasRole(["realm:ROLE_MEMBERSHIP"])(
        (_: any, args: any, context: Context) => {
          return context.prisma.order.findMany({
            orderBy: {
              createDate: "asc",
            },
            where: args.where || undefined,
          });
        }
      ),
    });
  },
});
