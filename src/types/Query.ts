import { intArg, nonNull, objectType, stringArg } from "nexus";
import { auth, hasRole } from "keycloak-connect-graphql";
import { Context } from "../context";
import { Totals } from "./Totals";

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.list.field("feed", {
      type: "News",
      args: {
        page: intArg(),
      },
      resolve: auth((_: any, args: { page: number }, context: Context) => {
        return context.prisma.news.findMany({
          where: {
            draft: false,
          },
          orderBy: {
            publishDate: "desc",
          },
          take: 10,
          skip: args.page == null ? 0 : (args.page - 1) * 10,
        });
      }),
    });

    t.list.field("news", {
      type: "News",
      args: {
        start: nonNull(intArg()),
        length: nonNull(intArg()),
        searchString: stringArg(),
      },
      resolve: auth(
        (
          _: any,
          args: { start: number; length: number; searchString: string },
          context: Context
        ) => {
          return context.prisma.news.findMany({
            orderBy: { publishDate: "desc" },
            where:
              args.searchString == null
                ? undefined
                : {
                    OR: [
                      {
                        title: {
                          contains: args.searchString,
                          mode: "insensitive",
                        },
                      },
                      {
                        body: {
                          contains: args.searchString,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
            skip: args.start,
            take: args.length,
          });
        }
      ),
    });

    t.field("newsTotals", {
      type: "Totals",
      args: {
        searchString: stringArg(),
      },
      resolve: auth(
        (_: any, args: { searchString: string }, context: Context) => {
          return {
            totalRecords: context.prisma.news.count(),
            totalMatching: context.prisma.news.count({
              where:
                args.searchString == null
                  ? undefined
                  : {
                      OR: [
                        {
                          title: {
                            contains: args.searchString,
                            mode: "insensitive",
                          },
                        },
                        {
                          body: {
                            contains: args.searchString,
                            mode: "insensitive",
                          },
                        },
                      ],
                    },
            }),
          };
        }
      ),
    });

    t.field("newsItem", {
      type: "News",
      args: {
        id: nonNull(intArg()),
      },
      resolve: (_: any, args: { id: number }, context: Context) => {
        return context.prisma.news.findUnique({
          where: {
            id: args.id,
          },
        });
      },
    });

    t.field("newsItemByPath", {
      type: "News",
      args: {
        path: nonNull(stringArg()),
      },
      resolve: (_: any, args: { path: string }, context: Context) => {
        return context.prisma.news.findUnique({
          where: {
            path: args.path,
          },
        });
      },
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
