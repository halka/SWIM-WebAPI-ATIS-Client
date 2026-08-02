import { SwimClient } from '../src/index.js';

interface DemoOptions {
  locations: string[];
  dispcnt: number;
}

function parseOptions(args: string[]): DemoOptions {
  const locations: string[] = [];
  let dispcnt: number | undefined;

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

  if (locations.length === 0) {
    throw new Error('At least one ICAO aerodrome code is required.');
  }
  if (dispcnt === undefined) {
    throw new Error('A display count is required. Use --count with an integer from 1 through 50.');
  }

  return { locations, dispcnt };
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
  console.log(`Usage: npm run demo -- --airport CODE --count NUMBER

Options:
  -a, --airport CODE   ICAO aerodrome code; repeat or comma-separate values
  -c, --count NUMBER   Number of ATIS records per aerodrome (required, 1-50)
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

  const response = await client.getAtis({
    location: options.locations,
    dispcnt: options.dispcnt,
  });

  console.log(JSON.stringify(response, null, 2));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
