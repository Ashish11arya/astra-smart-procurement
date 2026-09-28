import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting ASTRA initial production bootstrap seed...');

  const adminMobile = process.env.BOOTSTRAP_ADMIN_MOBILE;
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME || 'System Administrator';

  if (!adminMobile) {
    console.error(
      '❌ BOOTSTRAP_ADMIN_MOBILE environment variable is missing.',
    );
    console.error(
      '   The bootstrap seed requires this to safely create the initial GOVERNMENT_ADMIN.',
    );
    console.error('   Aborting seed process.');
    process.exit(1);
  }

  const stateName = process.env.BOOTSTRAP_STATE_NAME || 'Bihar';
  const stateCode = process.env.BOOTSTRAP_STATE_CODE || 'BR';

  const districtName = process.env.BOOTSTRAP_DISTRICT_NAME || 'Muzaffarpur';
  const districtCode = process.env.BOOTSTRAP_DISTRICT_CODE || 'MUZ';

  // 1. Upsert State
  const state = await prisma.state.upsert({
    where: { code: stateCode },
    update: { name: stateName, isActive: true },
    create: {
      name: stateName,
      code: stateCode,
      isActive: true,
    },
  });
  console.log(`✅ State ensured: ${state.name} (${state.code})`);

  // 2. Upsert District
  const district = await prisma.district.upsert({
    where: { code: districtCode },
    update: { name: districtName, stateId: state.id, isActive: true },
    create: {
      name: districtName,
      code: districtCode,
      stateId: state.id,
      isActive: true,
    },
  });
  console.log(`✅ District ensured: ${district.name} (${district.code})`);

  let adminUser = await prisma.user.findUnique({
    where: { mobile: adminMobile },
  });

  if (adminUser) {
    if (adminUser.role === UserRole.GOVERNMENT_ADMIN) {
      console.log(`✅ Initial Government Admin already exists: ${adminUser.mobile}`);
    } else {
      console.error(
        `❌ User with mobile ${adminMobile} already exists with role ${adminUser.role}.`,
      );
      console.error(
        '   Aborting to prevent accidental promotion of an existing non-admin user.',
      );
      process.exit(1);
    }
  } else {
    adminUser = await prisma.user.create({
      data: {
        mobile: adminMobile,
        role: UserRole.GOVERNMENT_ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Initial Government Admin created: ${adminUser.mobile} (${adminUser.role})`);
  }

  console.log('🎉 Bootstrap seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during bootstrap seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
