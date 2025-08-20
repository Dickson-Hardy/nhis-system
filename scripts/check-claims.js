const { db } = require('./lib/db/index.ts');
const { claims } = require('./lib/db/schema.ts');

async function checkClaims() {
  try {
    const existingClaims = await db.select().from(claims);
    console.log('Existing claims count:', existingClaims.length);
    console.log('Existing claim IDs:', existingClaims.map(c => c.uniqueClaimId));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkClaims();