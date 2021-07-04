import { arg, booleanArg, intArg, nonNull, objectType, stringArg } from "nexus";
import { auth } from "keycloak-connect-graphql";
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
        data: nonNull(arg({ type: "MemberInput" })),
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
                // @ts-ignore
                currentRecord?.ownerUserId === context.kauth.accessToken.content.email.id ||
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
                  args.data.attributes.map(
                    async (attr: { key: string; value: any }) => {
                      const encrypted = await encrypt(
                        JSON.stringify(attr.value)
                      );
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
                    }
                  )
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
  },
});
