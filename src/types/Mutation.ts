import { arg, intArg, list, nonNull, objectType, stringArg } from "nexus";
import { auth, hasRole } from "keycloak-connect-graphql";
import { Context } from "../context";
import { encrypt } from "../helpers/Encryption";

export const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("createMember", {
      type: "Member",
      description: "Add a new member to the register",
      args: {
        data: nonNull(arg({ type: "MemberInput" })),
      },
      resolve: auth(
        async (_: any, args: { id: number; data: any }, context: Context) => {
          const now = new Date();
          // @ts-ignore
          console.log(context.kauth.accessToken.content);
          // @ts-ignore
          console.log(context.kauth.accessToken.content.sub);
          return context.prisma.member.create({
            data: {
              type: "member",
              registrationDate: now,
              // @ts-ignore
              ownerUserId: context.kauth.accessToken.content.sub,
              subscription: {
                create: {
                  price: args.data.subscription.price,
                  pricelistItem: {
                    connect: {
                      id: args.data.subscription.pricelistItemId,
                    },
                  },
                  addedDate: now,
                  year: args.data.subscription.year,
                  order: {
                    connect: {
                      id: args.data.subscription.orderId,
                    },
                  },
                },
              },
              attributes: {
                create: await Promise.all(
                  args.data.attributes.map(
                    async (attr: { key: string; value: any }) => {
                      const encrypted = await encrypt(
                        JSON.stringify(attr.value)
                      );
                      return {
                        definition: {
                          connect: {
                            key: attr.key,
                          },
                        },
                        updatedDate: now,
                        createdDate: now,
                        value: {
                          encrypted,
                        },
                      };
                    }
                  )
                ),
              },
            },
          });
        }
      ),
    });

    t.field("updateMember", {
      type: "Member",
      description: "Update an existing member",
      args: {
        id: nonNull(intArg()),
        data: nonNull(list(arg({ type: "AttributeInput" }))),
      },
      resolve: auth(
        async (_: any, args: { id: number; data: any }, context: Context) => {
          const currentRecord = await context.prisma.member.findUnique({
            where: {
              id: args.id,
            },
          });

          if (
            !(
              currentRecord?.ownerUserId ===
                // @ts-ignore
                context.kauth.accessToken.content.email.id ||
              context.kauth.accessToken?.hasRole("realm:ROLE_MEMBERSHIP")
            )
          ) {
            throw new Error("You are not authorised to update this member");
          }

          const now = new Date();
          return context.prisma.member.update({
            where: {
              id: args.id,
            },
            data: {
              attributes: {
                upsert: await Promise.all(
                  args.data.map(async (attr: { key: string; value: any }) => {
                    const encrypted = await encrypt(JSON.stringify(attr.value));
                    const attribute = await context.prisma.attributeDefinition.findUnique(
                      {
                        where: {
                          key: attr.key,
                        },
                      }
                    );
                    return {
                      where: {
                        memberId_attributeId: {
                          memberId: args.id,
                          attributeId: attribute ? attribute?.id : 0,
                        },
                      },
                      update: {
                        value: {
                          encrypted,
                        },
                        updatedDate: now,
                      },
                      create: {
                        value: {
                          encrypted,
                        },
                        createdDate: now,
                        updatedDate: now,
                        definition: {
                          connect: {
                            key: attr.key,
                          },
                        },
                      },
                    };
                  })
                ),
              },
            },
          });
        }
      ),
    });

    t.field("createOrder", {
      type: "Order",
      args: {
        uuid: nonNull(stringArg()),
      },
      resolve: auth(
        async (
          _: any,
          args: { uuid: string; paymentType: string },
          context: Context
        ) => {
          const now = new Date();

          return context.prisma.order.create({
            data: {
              uuid: args.uuid,
              createDate: now,
              // @ts-ignore
              ownerUserId: context.kauth.accessToken.content.sub,
            },
          });
        }
      ),
    });

    t.field("addPaymentToOrder", {
      type: "Payment",
      args: {
        orderId: nonNull(intArg()),
        payment: nonNull("PaymentInput"),
      },
      resolve: auth(
        async (
          _: any,
          args: {
            orderId: number;
            payment: any;
          },
          context: Context
        ) => {
          return context.prisma.payment.create({
            data: {
              type: args.payment.type,
              reference: args.payment.reference,
              date: args.payment.date,
              amount: args.payment.amount,
              processingFees: args.payment.processingFees,
              collected: args.payment.collected,
              reconciled: args.payment.reconciled,
              order: {
                connect: {
                  id: args.orderId,
                },
              },
            },
          });
        }
      ),
    });

    t.field("saveNews", {
      type: "News",
      args: {
        news: nonNull("NewsInput"),
      },
      resolve: hasRole(["realm:ROLE_NEWS"])(
        async (
          _: any,
          args: {
            news: any;
          },
          context: Context
        ) => {
          return context.prisma.news.upsert({
            create: {
              title: args.news.title,
              body: args.news.body,
              author: args.news.author,
              createdDate: args.news.createdDate,
              publishDate: args.news.publishDate,
              path: args.news.path,
              uuid: args.news.uuid,
              draft: args.news.draft,
              socialSummary: args.news.socialSummary,
              attributes: {
                create: await Promise.all(
                  args.news.attributes?.map(
                    async (attr: { name: string; value: any }) => {
                      return {
                        newsId: args.news.id,
                        name: attr.name,
                        value: attr.value,
                      };
                    }
                  )
                ),
              },
            },
            update: {
              title: args.news.title,
              body: args.news.body,
              author: args.news.author,
              publishDate: args.news.publishDate,
              path: args.news.path,
              draft: args.news.draft,
              socialSummary: args.news.socialSummary,
              attributes: {
                upsert: await Promise.all(
                  args.news.attributes?.map(
                    async (attr: { name: string; value: any }) => {
                      return {
                        create: {
                          value: attr.value,
                        },
                        where: {
                          newsId: args.news.id,
                          name: attr.name,
                        },
                      };
                    }
                  )
                ),
              },
            },
            where: {
              id: args.news.id,
            },
          });
        }
      ),
    });

    t.field("deleteNews", {
      type: "News",
      args: {
        id: nonNull(intArg()),
      },
      resolve: hasRole(["realm:ROLE_NEWS"])(
        async (
          _: any,
          args: {
            id: number;
          },
          context: Context
        ) => {
          return context.prisma.news.delete({
            where: {
              id: args.id,
            },
          });
        }
      ),
    });

    t.field("saveNewsAttributes", {
      type: "News",
      args: {
        id: nonNull(intArg()),
        attributes: nonNull(list("NewsAttributeInput")),
      },
      resolve: hasRole(["realm:ROLE_NEWS"])(
        async (
          _: any,
          args: {
            id: number;
            attributes: any;
          },
          context: Context
        ) => {
          return context.prisma.news.update({
            where: {
              id: args.id,
            },
            data: {
              attributes: {
                upsert: await Promise.all(
                  args.attributes?.map(
                    async (attr: { name: string; value: any }) => {
                      return {
                        create: {
                          name: attr.name,
                          value: attr.value,
                        },
                        update: {
                          value: attr.value,
                        },
                        where: {
                          idx_unique_news_attribute_news_id_name: {
                            newsId: args.id,
                            name: attr.name,
                          },
                        },
                      };
                    }
                  )
                ),
              },
            },
          });
        }
      ),
    });
  },
});
