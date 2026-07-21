import { SwimClient } from '../src/index.js';

interface DemoOptions {
  locations: string[];
  dispcnt: number;
}

const defaultOptions: DemoOptions = {
  locations: ['RJTT', 'RJCC'],
  dispcnt: 5,
};

function parseDemoOptions(args: string[]): DemoOptions {
  const locations: string[] = [];
  let dispcnt = defaultOptions.dispcnt;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]?.trim();
    if (!arg) continue;

    if (arg === '-a' || arg === '--airport') {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error(`${arg} requires an airport code.`);
      }
      locations.push(...parseLocations(value));
      index += 1;
      continue;
    }

    if (arg.startsWith('--airport=')) {
      locations.push(...parseLocations(arg.slice('--airport='.length)));
      continue;
    }

    if (arg === '-c' || arg === '--count' || arg === 'count') {
      const value = args[index + 1]?.trim();
      if (!value) {
        throw new Error(`${arg} requires a positive integer count.`);
      }
      dispcnt = parseCount(value);
      index += 1;
      continue;
    }

    if (arg.startsWith('--count=')) {
      dispcnt = parseCount(arg.slice('--count='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    locations: locations.length > 0 ? locations : defaultOptions.locations,
    dispcnt,
  };
}

function parseLocations(value: string): string[] {
  const locations = value
    .split(',')
    .map((location) => location.trim().toUpperCase())
    .filter(Boolean);

  if (locations.length === 0) {
    throw new Error('Airport option requires at least one airport code.');
  }

  return locations;
}

function parseCount(value: string): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`Count must be a positive integer: ${value}`);
  }
  return count;
}

// Simple demo script to showcase the SWIM client usage
async function run() {
  console.log('=== Japan SWIM METAR Client Demo ===');

  const { locations, dispcnt } = parseDemoOptions(process.argv.slice(2));
  const id = process.env.SWIM_ID;
  const password = process.env.SWIM_PASSWORD;
  const metarServiceCode = process.env.SWIM_METAR_SERVICE_CODE;

  if (!id || !password || !metarServiceCode) {
    console.log('\n[Tip] To run this demo against the live SWIM API:');
    console.log('export SWIM_ID="your-email@example.com"');
    console.log('export SWIM_PASSWORD="your-password"');
    console.log('export SWIM_METAR_SERVICE_CODE="your-metar-service-code"');
    console.log('npm run demo -- -a RJTT -a RJCC -c 5');
    console.log('npm run demo -- --airport RJTT,RJCC --count 5\n');
    console.log('Proceeding with placeholder credentials (this will fail on the live service but demonstrates API flow)...');
  }

  // Instantiate client (uses default MLIT base URLs)
  const client = new SwimClient({ metarServiceCode });

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

    console.log(`\nFetching ${dispcnt} METAR record(s) for airport location(s): ${locations.join(', ')}...`);
    const metarData = await client.getMetar({
      location: locations,
      dispcnt,
    });

    console.log('METAR response successfully received:');
    console.log(JSON.stringify(metarData, null, 2));

  } catch (error: any) {
    console.error('\nError during execution:');
    console.error(error.message || error);
  }
}

run();
