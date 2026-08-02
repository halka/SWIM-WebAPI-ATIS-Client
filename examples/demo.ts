import { SwimClient } from '../src/index.js';

interface DemoOptions {
  locations: string[];
  dispcnt: number;
}

const defaults: DemoOptions = {
  locations: ['RJTT', 'RJCC'],
  dispcnt: 3,
};

function parseOptions(args: string[]): DemoOptions {
  const locations: string[] = [];
  let dispcnt = defaults.dispcnt;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]?.trim();
    if (!arg) continue;

    if (arg === '-a' || arg === '--airport') {
      const value = args[++index];
      if (!value) throw new Error(`${arg} requires an ICAO airport code.`);
      locations.push(...parseLocations(value));
    } else if (arg.startsWith('--airport=')) {
      locations.push(...parseLocations(arg.slice('--airport='.length)));
    } else if (arg === '-c' || arg === '--count' || arg === 'count') {
      const value = args[++index];
      if (!value) throw new Error(`${arg} requires a count from 1 through 50.`);
      dispcnt = parseCount(value);
    } else if (arg.startsWith('--count=')) {
      dispcnt = parseCount(arg.slice('--count='.length));
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return {
    locations: locations.length > 0 ? locations : defaults.locations,
    dispcnt,
  };
}

function parseLocations(value: string): string[] {
  const locations = value.split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
  if (locations.length === 0) throw new Error('At least one ICAO airport code is required.');
  return locations;
}

function parseCount(value: string): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 50) {
    throw new Error(`Count must be an integer from 1 through 50: ${value}`);
  }
  return count;
}

async function run(): Promise<void> {
  const id = process.env.SWIM_ID;
  const password = process.env.SWIM_PASSWORD;
  if (!id || !password) {
    throw new Error('Set SWIM_ID and SWIM_PASSWORD before running the live demo.');
  }

  const { locations, dispcnt } = parseOptions(process.argv.slice(2));
  const client = new SwimClient();
  await client.login({ id, password });

  const result = await client.getWeather({ location: locations, dispcnt });
  console.log(JSON.stringify(result, null, 2));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
