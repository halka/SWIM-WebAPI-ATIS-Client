import { SwimClient } from '../src/index.js';

interface DemoOptions {
  locations: string[];
  dispcnt: number;
}

const DEFAULT_LOCATIONS = ['RJTT', 'RJCC'];
const DEFAULT_DISPLAY_COUNT = 3;

function parseOptions(args: string[]): DemoOptions {
  const locations: string[] = [];
  let dispcnt = DEFAULT_DISPLAY_COUNT;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]?.trim();
    if (!argument) continue;

    if (argument === '-h' || argument === '--help') {
      printUsage();
      process.exit(0);
    }

    if (argument === '-a' || argument === '--airport') {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires an ICAO aerodrome code.`);
      locations.push(...parseLocations(value));
      continue;
    }

    if (argument.startsWith('--airport=')) {
      locations.push(...parseLocations(argument.slice('--airport='.length)));
      continue;
    }

    if (argument === '-c' || argument === '--count') {
      const value = args[++index];
      if (!value) throw new Error(`${argument} requires a count from 1 through 50.`);
      dispcnt = parseCount(value);
      continue;
    }

    if (argument.startsWith('--count=')) {
      dispcnt = parseCount(argument.slice('--count='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    locations: locations.length > 0 ? locations : DEFAULT_LOCATIONS,
    dispcnt,
  };
}

function parseLocations(value: string): string[] {
  const locations = value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

  if (locations.length === 0) {
    throw new Error('At least one ICAO aerodrome code is required.');
  }

  return locations;
}

function parseCount(value: string): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new Error(`Count must be an integer from 1 through 50: ${value}`);
  }
  return count;
}

function printUsage(): void {
  console.log(`Usage: npm run demo -- [options]

Options:
  -a, --airport CODE   ICAO aerodrome code; repeat or comma-separate values
  -c, --count NUMBER   Number of records per aerodrome (1-50, default: 3)
  -h, --help           Show this help

Examples:
  npm run demo -- --airport RJTT --count 3
  npm run demo -- -a RJTT -a RJCC -c 5`);
}

async function run(): Promise<void> {
  const id = process.env.SWIM_ID;
  const password = process.env.SWIM_PASSWORD;
  if (!id || !password) {
    throw new Error('Set SWIM_ID and SWIM_PASSWORD before running the live demo.');
  }

  const options = parseOptions(process.argv.slice(2));
  const client = new SwimClient();
  await client.login({ id, password });

  const response = await client.getWeather({
    location: options.locations,
    dispcnt: options.dispcnt,
  });

  // The response is printed exactly as returned by response.json().
  console.log(JSON.stringify(response, null, 2));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
