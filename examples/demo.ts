import { SwimClient } from '../src/index.js';

// Simple demo script to showcase the SWIM client usage
async function run() {
  console.log('=== Japan SWIM METAR Client Demo ===');

  const id = process.env.SWIM_ID;
  const password = process.env.SWIM_PASSWORD;

  if (!id || !password) {
    console.log('\n[Tip] To run this demo against the live SWIM API:');
    console.log('export SWIM_ID="your-email@example.com"');
    console.log('export SWIM_PASSWORD="your-password"');
    console.log('npm run demo\n');
    console.log('Proceeding with placeholder credentials (this will fail on the live service but demonstrates API flow)...');
  }

  // Instantiate client (uses default MLIT base URLs)
  const client = new SwimClient();

  const testId = id || 'swim@example.com';
  const testPassword = password || 'dummyPassword123';

  try {
    console.log(`\nAttempting login for user: ${testId}...`);
    // Authenticate and fetch session cookies
    const session = await client.login({
      id: testId,
      password: testPassword,
    });

    console.log('Login Successful!');
    console.log('Session Cookies obtained:');
    console.log(`- MSMSI: ${session.MSMSI}`);
    console.log(`- MSMAI: ${session.MSMAI}`);

    console.log('\nFetching METAR data for Haneda (RJTT) and Hakodate (RJCH) airport locations...');
    const metarData = await client.getMetar({
      location: ['RJTT', 'RJCC'],
      dispcnt: 5, // get latest 2 records per location
    });

    console.log('METAR response successfully received:');
    console.log(JSON.stringify(metarData, null, 2));

  } catch (error: any) {
    console.error('\nError during execution:');
    console.error(error.message || error);
  }
}

run();
