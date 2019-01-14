const chokidar = require('chokidar');

module.exports = async function watch(App, root, args) {
  const watcher = chokidar.watch(root);
  let app;

  await start();

  watcher
    .on('raw', async (_, path) => {
      if(require.cache[path]) delete require.cache[path];
      start();
    });

  async function start() {
    if(app) {
      try {
        await app.destroy();
      } catch(error) {
        console.log('Failed to destroy app', error.stack);
      }
      app = null;
    }

    app = new App(root, args);
    try {
      await app.start();
    } catch(error) {
      console.log(`Failed to start app`, error.stack);
    }
  }

  const { repl=true } = args;
  if(repl) startRELP();

  function startRELP() {
    require('repl')
      .start({
        prompt: '> ',
        async eval(command, context, filename, callback) {
          try {
            const modelKeys = app ? Object.keys(app.models) : [];
            const actionKeys = app ? Object.keys(app.actions) : [];
            const evalSrc = `
              (async () => {
                const spry = app;
                const { models, actions, knex, options } = spry || {};
                ${modelKeys.length ? `const { ${modelKeys.join(', ')} } = models || {};` : ''}
                ${actionKeys.length ? `const { ${actionKeys.join(', ')} } = actions || {};` : ''}
                return ${command};
              })();
            `;
            callback(null, await eval(evalSrc));
          } catch(error) {
            callback(error);
          }
        }
      })
      .on('exit', async () => {
        await app && app.destroy();
        process.exit(1);
      });
  }
}
