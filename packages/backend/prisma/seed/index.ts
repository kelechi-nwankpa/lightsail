import { PrismaClient } from '@prisma/client';
import { frameworks } from './frameworks.js';
import { soc2Requirements, type RequirementData } from './requirements/soc2.js';
import { iso27001Requirements } from './requirements/iso27001.js';

const prisma = new PrismaClient();

async function seedFramework(
  frameworkCode: string,
  frameworkName: string,
  frameworkVersion: string,
  frameworkDescription: string,
  requirements: RequirementData[]
) {
  console.log(`\nSeeding ${frameworkName}...`);

  // Upsert framework
  const framework = await prisma.framework.upsert({
    where: { code: frameworkCode },
    update: {
      name: frameworkName,
      version: frameworkVersion,
      description: frameworkDescription,
    },
    create: {
      code: frameworkCode,
      name: frameworkName,
      version: frameworkVersion,
      description: frameworkDescription,
    },
  });

  console.log(`  Framework: ${framework.name} (${framework.id})`);

  // Helper to recursively create requirements
  async function createRequirements(
    reqs: RequirementData[],
    parentId: string | null = null,
    depth = 0
  ): Promise<number> {
    let count = 0;

    for (const req of reqs) {
      const indent = '  '.repeat(depth + 1);

      // Upsert requirement
      const requirement = await prisma.frameworkRequirement.upsert({
        where: {
          frameworkId_code: {
            frameworkId: framework.id,
            code: req.code,
          },
        },
        update: {
          name: req.name,
          description: req.description,
          guidance: req.guidance || null,
          parentId,
        },
        create: {
          frameworkId: framework.id,
          code: req.code,
          name: req.name,
          description: req.description,
          guidance: req.guidance || null,
          parentId,
        },
      });

      console.log(`${indent}${req.code}: ${req.name}`);
      count++;

      // Recursively create children
      if (req.children && req.children.length > 0) {
        count += await createRequirements(req.children, requirement.id, depth + 1);
      }
    }

    return count;
  }

  const totalRequirements = await createRequirements(requirements);
  console.log(`  Total requirements: ${totalRequirements}`);

  return { framework, totalRequirements };
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Seed SOC 2
  const soc2Framework = frameworks.find((f) => f.code === 'SOC2')!;
  await seedFramework(
    soc2Framework.code,
    soc2Framework.name,
    soc2Framework.version,
    soc2Framework.description,
    soc2Requirements
  );

  // Seed ISO 27001
  const iso27001Framework = frameworks.find((f) => f.code === 'ISO27001')!;
  await seedFramework(
    iso27001Framework.code,
    iso27001Framework.name,
    iso27001Framework.version,
    iso27001Framework.description,
    iso27001Requirements
  );

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
