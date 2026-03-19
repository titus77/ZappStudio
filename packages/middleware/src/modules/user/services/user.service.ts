import httpStatus from 'http-status';
import { LOGGER } from '../../../../config/logging';
import { prisma } from '../../../../prisma/prisma-client';
import { PrismaTransaction, Transactional } from '../../../../types';
import ApiError from '../../../utils/apiError';
import * as quotaUtils from '../../quota/utils';

import { PRISMA_ERROR_CODES } from '../../../utils/general';
// import businessCustomMetrics from '../../../metrices/custom/business.custom.metrices';

export const syncUserDetails = async (
  dbUser: {
    id: number;
    email: string;
    teamId: string | null;
    avatar: string | null;
    name: string | null;
  },
  oauthData: {
    avatar?: string | null;
    name?: string | null;
  },
) => {
  // first, check if any of the user's details have changed
  const updateFields: any = {};

  if (dbUser.name !== oauthData.name) {
    updateFields.name = oauthData.name;
  }

  if (dbUser.avatar !== oauthData.avatar) {
    updateFields.avatar = oauthData.avatar;
  }

  // if all the details are up to date, return
  if (Object.keys(updateFields).length === 0) {
    return;
  }

  await prisma.user.update({
    where: {
      id: dbUser.id,
    },
    data: updateFields,
  });
};

export const getUserInfoById = async ({
  userId,
  teamId,
  referralHeaders,
  ctx,
}: Transactional<{
  userId: number;
  teamId: string;
  referralHeaders: {
    tid: string | undefined;
    refId: string | undefined;
  };
}>) => {
  const _tx = ctx?.tx ?? prisma;

  const user = await _tx.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      avatar: true,
      name: true,
      createdAt: true,

      team: {
        select: {
          name: true,
          id: true,
          referredBy: true,
          parentId: true,
        },
      },

      userTeamRole: {
        select: {
          isTeamInitiator: true,
          userSpecificAcl: true,
          sharedTeamRole: {
            select: {
              canManageTeam: true,
              acl: true,
              name: true,
              id: true,

              team: {
                select: {
                  name: true,
                  id: true,
                  parentId: true,
                  referredBy: true,
                },
              },
            },
          },
        },
      },

      // teamMemberships: {
      //   select: {
      //     isTeamInitiator: true,
      //     userSpecificAcl: true,
      //     sharedTeamRole: {
      //       select: {
      //         canManageTeam: true,
      //         acl: true,
      //         name: true,
      //         id: true,

      //         team: {
      //           select: {
      //             name: true,
      //             id: true,
      //             parentId: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
    },
  });

  // @ts-ignore
  user.roles = user.userTeamRole;
  // @ts-ignore
  user.team = user.userTeamRole.find(role => role.sharedTeamRole.team.id === teamId).sharedTeamRole.team;

  // @ts-ignore
  user.userTeamRole = user.userTeamRole.find(role => role.sharedTeamRole.team.id === teamId);
  // set the current team as the user's team

  return user;
};

export const getUserInfoByIdM2M = async ({ userId }: { userId: number }) => {
  const user = await prisma.user
    .findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        avatar: true,
        name: true,
        teamId: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    .catch(err => {
      if (err.code === PRISMA_ERROR_CODES.NON_EXISTENT_RECORD) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
      }

      throw err;
    });

  return user;
};

export const getUserByEmail = async ({ email, ctx }: Transactional<{ email: string }>) => {
  const _tx = ctx?.tx ?? prisma;

  const user = await _tx.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      teamId: true,
      avatar: true,
      name: true,
    },
  });

  return user;
};

export const createUserAndTeam = async ({ userInfo, ctx }: Transactional<{ userInfo: { email: string; name?: string; avatar?: string } }>) => {
  // create a new user and team

  const operations = async (tx: PrismaTransaction) => {
    let fullAccessPlan = await tx.plan.findFirst({
      where: {
        isDefaultPlan: true,
      },
      select: {
        id: true,
      },
    });

    if (!fullAccessPlan) {
      LOGGER.info(`Full Access PLAN DOESN'T EXIST. CREATING...`);
      fullAccessPlan = await tx.plan.create({
        data: {
          name: 'Full Access',
          price: 1,
          paid: true,
          isDefaultPlan: true,
          stripeId: 'na',
          priceId: 'na',
          properties: quotaUtils.buildDefaultPlanProps(),
        },
        select: {
          id: true,
        },
      });
    }

    const team = await tx.team.create({
      data: {
        name: userInfo.name ? `${userInfo.name}'s Team` : 'My Team',

        subscription: {
          create: {
            startDate: new Date(),
            stripeId: '',
            status: 'ACTIVE',
            plan: {
              connect: {
                id: fullAccessPlan.id,
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    const userRecord = await tx.user.create({
      data: {
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.avatar,
        team: {
          connect: {
            id: team.id,
          },
        },
      },

      select: {
        id: true,
        email: true,
        teamId: true,
        avatar: true,
        name: true,
      },
    });

    await tx.userTeamRole.create({
      data: {
        isTeamInitiator: true,
        user: {
          connect: {
            id: userRecord.id,
          },
        },

        sharedTeamRole: {
          create: {
            name: 'Super Admin',
            isOwnerRole: true,
            canManageTeam: true,
            team: {
              connect: {
                id: team.id,
              },
            },
          },
        },
      },

      select: undefined,
    });

    return userRecord;
  };

  const user = await (ctx?.tx ? operations(ctx.tx) : prisma.$transaction(operations, { timeout: 10_000 }));

  // businessCustomMetrics.userSignupCounter.inc();

  return user;
};

export const findOrCreateUser = async ({ email, name, avatar }: { email: string; name?: string | null; avatar?: string | null }) => {
  let isNewUser = false;

  const user = await prisma.$transaction(
    async tx => {
      // const existingUser = await getUserByEmail({ email, ctx: { tx } });
      const existingUser = await tx.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
          email: true,
          teamId: true,
          avatar: true,
          name: true,
        },
      });
      if (existingUser) {
        await syncUserDetails(existingUser, { name, avatar });
        return existingUser;
      }

      isNewUser = true;
      LOGGER.info(`USER ${email} DOESN'T EXIST. CREATING...`);
      const newRecord = await createUserAndTeam({
        userInfo: {
          email,
          name: name ?? undefined,
          avatar: avatar ?? undefined,
        },
        ctx: { tx },
      });

      return newRecord;
    },
    {
      timeout: 100_000, // take as much time as you need (CRITICAL TASK)
    },
  );

  // if (isNewUser) {
  //   // send welcome email
  //   const nameStr = name;
  // }

  return user;
};

/**
 * Find or create a user with tenant-aware team provisioning.
 * When tenantId is provided (from ZappImmo JWT), the user is placed
 * in the team mapped to that tenant. If no team exists for the tenant,
 * one is created. If the user already exists but is in a different team,
 * they are moved to the tenant's team.
 */
export const findOrCreateUserWithTenant = async ({
  email,
  name,
  avatar,
  tenantId,
}: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  tenantId?: string | null;
}) => {
  // If no tenantId, fall back to standard flow
  if (!tenantId) {
    return findOrCreateUser({ email, name, avatar });
  }

  const user = await prisma.$transaction(
    async (tx) => {
      // 1. Find or create team for this tenant
      let team = await tx.team.findUnique({
        where: { tenantId },
        select: { id: true, name: true },
      });

      if (!team) {
        LOGGER.info(`TENANT ${tenantId} DOESN'T HAVE A TEAM. CREATING...`);

        let defaultPlan = await tx.plan.findFirst({
          where: { isDefaultPlan: true },
          select: { id: true },
        });

        if (!defaultPlan) {
          defaultPlan = await tx.plan.create({
            data: {
              name: 'Full Access',
              price: 1,
              paid: true,
              isDefaultPlan: true,
              stripeId: 'na',
              priceId: 'na',
              properties: quotaUtils.buildDefaultPlanProps(),
            },
            select: { id: true },
          });
        }

        team = await tx.team.create({
          data: {
            name: name ? `${name}'s Team` : 'ZappImmo Studio',
            tenantId,
            subscription: {
              create: {
                startDate: new Date(),
                stripeId: '',
                status: 'ACTIVE',
                plan: { connect: { id: defaultPlan.id } },
              },
            },
          },
          select: { id: true, name: true },
        });
      }

      // 2. Find or create user
      const existingUser = await tx.user.findUnique({
        where: { email },
        select: { id: true, email: true, teamId: true, avatar: true, name: true },
      });

      if (existingUser) {
        await syncUserDetails(existingUser, { name, avatar });

        // Move user to tenant's team if they're in a different one
        if (existingUser.teamId !== team.id) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { teamId: team.id },
          });
          existingUser.teamId = team.id;
        }

        // Ensure user has a role in this team
        const hasRole = await tx.userTeamRole.findFirst({
          where: {
            userId: existingUser.id,
            sharedTeamRole: { teamId: team.id },
          },
        });

        if (!hasRole) {
          const teamMemberCount = await tx.user.count({
            where: { teamId: team.id },
          });
          const isFirstMember = teamMemberCount <= 1;

          await tx.userTeamRole.create({
            data: {
              isTeamInitiator: isFirstMember,
              user: { connect: { id: existingUser.id } },
              sharedTeamRole: {
                create: {
                  name: isFirstMember ? 'Super Admin' : 'Editor',
                  isOwnerRole: isFirstMember,
                  canManageTeam: isFirstMember,
                  team: { connect: { id: team.id } },
                },
              },
            },
          });
        }

        return existingUser;
      }

      // 3. Create new user in tenant's team
      LOGGER.info(`USER ${email} DOESN'T EXIST. CREATING IN TENANT ${tenantId}...`);

      const teamMemberCount = await tx.user.count({
        where: { teamId: team.id },
      });
      const isFirstMember = teamMemberCount === 0;

      const userRecord = await tx.user.create({
        data: {
          email,
          name: name ?? undefined,
          avatar: avatar ?? undefined,
          team: { connect: { id: team.id } },
        },
        select: { id: true, email: true, teamId: true, avatar: true, name: true },
      });

      await tx.userTeamRole.create({
        data: {
          isTeamInitiator: isFirstMember,
          user: { connect: { id: userRecord.id } },
          sharedTeamRole: {
            create: {
              name: isFirstMember ? 'Super Admin' : 'Editor',
              isOwnerRole: isFirstMember,
              canManageTeam: isFirstMember,
              team: { connect: { id: team.id } },
            },
          },
        },
      });

      return userRecord;
    },
    { timeout: 100_000 },
  );

  return user;
};
