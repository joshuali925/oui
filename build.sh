#!/usr/bin/env bash
# shellcheck disable=
set -eo pipefail

yarn build &

pwd=$PWD

pushd "$HOME/projects/os-3.0/osd"
trap cleanup TERM INT EXIT
cleanup() {
  cd "$pwd"
  exit $?
}

rm node_modules/@elastic/eui -rf && mv node_modules/ ../node_modules && yarn osd clean && mv ../node_modules node_modules
wait

yarn osd bootstrap && scripts/use_node -e "require('./src/setup_node_env'); require('./src/cli/cluster/run_osd_optimizer').runOsdOptimizer({ cache: false }, require('./src/legacy/server/config').Config.withDefaultSchema()).subscribe();"

os run --data_source.enabled=true --uiSettings.overrides['query:enhancements:enabled']=true --workspace.enabled=true --uiSettings.overrides['home:useNewHomePage']=true --explore.enabled=true --data.savedQueriesNewUI.enabled=true --server.port=5665
