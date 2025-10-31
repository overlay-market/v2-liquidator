#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT_DIR = path.resolve(__dirname, '..');
const DOCKER_COMPOSE_PATH = path.join(ROOT_DIR, 'docker-compose.yml');
const COLLECTOR_CONSTANTS_PATH = path.join(
  ROOT_DIR,
  'packages/collector/src/constants.ts',
);
const LIQUIDATION_CONFIG_PATH = path.join(
  ROOT_DIR,
  'packages/liquidation-checker/src/config.ts',
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, defaultValue) {
  const suffix = defaultValue ? ` (${defaultValue})` : '';
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      const trimmed = answer.trim();
      if (!trimmed && defaultValue !== undefined) {
        resolve(defaultValue);
      } else {
        resolve(trimmed);
      }
    });
  });
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureFile(pathToFile) {
  if (!fs.existsSync(pathToFile)) {
    throw new Error(`Could not find file at ${pathToFile}`);
  }
}

function loadFile(pathToFile) {
  ensureFile(pathToFile);
  return fs.readFileSync(pathToFile, 'utf8');
}

function saveFile(pathToFile, content) {
  fs.writeFileSync(pathToFile, content, 'utf8');
}

function computeDefaultCronSchedule(configContent) {
  const cronRegex = /'([0-9]{1,2}) \*\/2 \* \* \* \*'/g;
  let match;
  let maxSecond = 13; // start a bit below the first value seen in the repo
  while ((match = cronRegex.exec(configContent)) !== null) {
    const value = Number(match[1]);
    if (!Number.isNaN(value) && value > maxSecond) {
      maxSecond = value;
    }
  }
  return `${maxSecond + 2} */2 * * * *`;
}

function updateCollectorConstants({ marketName, address, initBlock, factoryAddress }) {
  const content = loadFile(COLLECTOR_CONSTANTS_PATH);
  if (content.includes(`'${marketName}'`)) {
    throw new Error(`Market '${marketName}' already exists in collector constants.`);
  }

  const insertAnchor = '\n    },\n    enabled:';
  const anchorIndex = content.indexOf(insertAnchor);
  if (anchorIndex === -1) {
    throw new Error('Could not find the insertion point in collector constants.');
  }

  const entry =
    `      '${marketName}': {\n` +
    `        address: '${address}',\n` +
    `        init_block: '${initBlock}',\n` +
    `        factory_address: '${factoryAddress}',\n` +
    `      },\n`;

  const updated = content.slice(0, anchorIndex) + entry + content.slice(anchorIndex);
  saveFile(COLLECTOR_CONSTANTS_PATH, updated);
}

function updateLiquidationConfig({
  marketName,
  address,
  cronSchedule,
  workers,
  positionsPerRun,
  factoryAddress,
}) {
  const content = loadFile(LIQUIDATION_CONFIG_PATH);
  if (content.includes(`'${marketName}'`)) {
    throw new Error(`Market '${marketName}' already exists in liquidation config.`);
  }

  const insertAnchor = '\n}\n';
  const anchorIndex = content.lastIndexOf(insertAnchor);
  if (anchorIndex === -1) {
    throw new Error('Could not find the insertion point in liquidation config.');
  }

  const entry =
    `  '${marketName}': {\n` +
    `    workers: ${workers},\n` +
    `    cron_schedule: '${cronSchedule}',\n` +
    `    networks: {\n` +
    `      [Networks.BSC_MAINNET]: {\n` +
    `        address: '${address}',\n` +
    `        positions_per_run: ${positionsPerRun},\n` +
    `        factory_address: '${factoryAddress}',\n` +
    `      },\n` +
    `    },\n` +
    `  },\n`;

  const updated =
    content.slice(0, anchorIndex) + entry + content.slice(anchorIndex);
  saveFile(LIQUIDATION_CONFIG_PATH, updated);
}

function updateDockerCompose({ marketName, serviceName }) {
  const content = loadFile(DOCKER_COMPOSE_PATH);
  if (content.includes(serviceName) || content.includes(`MARKET: ${marketName}`)) {
    throw new Error(`Market '${marketName}' already exists in docker-compose.yml.`);
  }

  const anchor = '\n  executor-1:';
  const anchorIndex = content.indexOf(anchor);
  if (anchorIndex === -1) {
    throw new Error('Could not find executor-1 service in docker-compose.yml.');
  }

  const entry =
    `  ${serviceName}:\n` +
    `    build:\n` +
    `      context: .\n` +
    `      dockerfile: packages/liquidation-checker/Dockerfile\n` +
    `    environment:\n` +
    `      <<: *common-environment\n` +
    `      MARKET: ${marketName}\n` +
    `      NODE_OPTIONS: --max_old_space_size=614\n` +
    `    depends_on:\n` +
    `      - redis-server\n` +
    `    restart: unless-stopped\n` +
    `    deploy:\n` +
    `      resources:\n` +
    `        limits:\n` +
    `          cpus: '0.65'\n` +
    `          memory: 768M\n\n`;

  const updated =
    content.slice(0, anchorIndex) + entry + content.slice(anchorIndex);
  saveFile(DOCKER_COMPOSE_PATH, updated);
}

(async function main() {
  try {
    const marketName = await ask('Market name');
    if (!marketName) {
      throw new Error('Market name is required.');
    }

    const contractAddress = await ask('Market address (0x...)');
    if (!contractAddress) {
      throw new Error('Market address is required.');
    }

    const initBlock = await ask('Init block');
    if (!initBlock) {
      throw new Error('Init block is required.');
    }

    console.log('\nAvailable factories:');
    console.log('  1. Original Factory (0xC35093f76fF3D31Af27A893CDcec585F1899eE54)');
    console.log('  2. Gambling Factory (0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A)');
    const factoryChoice = await ask('Which factory? (1 or 2)', '1');

    let factoryAddress;
    if (factoryChoice === '1') {
      factoryAddress = '0xC35093f76fF3D31Af27A893CDcec585F1899eE54';
    } else if (factoryChoice === '2') {
      factoryAddress = '0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A';
    } else {
      throw new Error('Invalid factory choice. Must be 1 or 2.');
    }

    const configContent = loadFile(LIQUIDATION_CONFIG_PATH);
    const defaultCronSchedule = computeDefaultCronSchedule(configContent);
    const cronSchedule = await ask('Cron schedule', defaultCronSchedule);

    const positionsInput = await ask('Positions per run', '500');
    const positionsPerRun = Number(positionsInput);
    if (Number.isNaN(positionsPerRun) || positionsPerRun <= 0) {
      throw new Error('Positions per run must be a positive number.');
    }

    const workersInput = await ask('Workers', '1');
    const workers = Number(workersInput);
    if (Number.isNaN(workers) || workers <= 0) {
      throw new Error('Workers must be a positive number.');
    }

    const slug = slugify(marketName);
    if (!slug) {
      throw new Error('Could not derive a valid slug from the market name.');
    }
    const serviceName = `liquidation-${slug}`;

    updateCollectorConstants({
      marketName,
      address: contractAddress,
      initBlock,
      factoryAddress,
    });

    updateLiquidationConfig({
      marketName,
      address: contractAddress,
      cronSchedule,
      workers,
      positionsPerRun,
      factoryAddress,
    });

    updateDockerCompose({
      marketName,
      serviceName,
    });

    console.log(`\nSuccessfully added market '${marketName}'.`);
    console.log(`Factory: ${factoryAddress === '0xC35093f76fF3D31Af27A893CDcec585F1899eE54' ? 'Original' : 'Gambling'}`);
    console.log('Remember to review the changes and commit them.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
})();
