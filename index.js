#!/usr/bin/env node

const path = require('path');
const { existsSync } = require('fs');
const resolveFrom = require('resolve-from');
const yargsParser = require('yargs-parser');

const commands = ['gen', 'help', 'migrate', 'rollback', 'seed', 'start', 'watch'];
const command = process.argv[2];
const args = yargsParser(process.argv.slice(3));
const root = args.root ? path.resolve(args.root) : process.cwd();
require('dotenv').config({ path: getDotEnvPath(root) });

getCommandScript(command)(loadSpryCore(), root, args, command);

function getCommandScript(command) {
  if(!command) {
    return require('./commands/help');
  } else if(commands.includes(command)) {
    return require(`./commands/${command}`);
  } else {
    console.log(`Command not found "${command}"`);
    return require('./commands/help');
  }
}

function getDotEnvPath(root) {
  const { NODE_ENV } = process.env;
  if(NODE_ENV && NODE_ENV !== 'development') {
    const nodeEnvConfigPath = path.resolve(root, `.env.${NODE_ENV}`);
    if(existsSync(nodeEnvConfigPath)) {
      return nodeEnvConfigPath;
    }
  }
  return path.resolve(root, '.env');
}

function loadSpryCore() {
  return require(resolveFrom(root, '@simplej/spry-core'));
}
