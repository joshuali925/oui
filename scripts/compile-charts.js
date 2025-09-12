/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');
const dtsGenerator = require('dts-generator').default;

async function compileChartsBundle() {
  console.log('Building chart theme modules in parallel...');

  const chartPromises = [
    buildChartTheme(
      'oui_charts_theme.js',
      'oui_charts_theme.d.ts',
      '@opensearch-project/oui/dist/oui_charts_theme',
      '@opensearch-project/oui/src/components/common'
    ),
    buildChartTheme(
      'eui_charts_theme.js',
      'eui_charts_theme.d.ts',
      '@elastic/eui/dist/eui_charts_theme',
      '@elastic/eui/src/components/common'
    ),
  ];

  await Promise.all(chartPromises);
  console.log(chalk.green('✔ Finished chart theme module'));
}

async function buildChartTheme(
  outputFilename,
  dtsFilename,
  moduleId,
  importPath
) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'webpack',
      [
        '--entry-reset',
        '--entry',
        path.join(__dirname, '../src/themes/charts/themes.ts'),
        '-o',
        'dist',
        '--config=src/webpack.config.js',
        '--env',
        `filename=${outputFilename}`,
        '--env',
        'library-target=commonjs',
      ],
      {
        stdio: 'pipe',
      }
    );

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Generate .d.ts file after successful webpack build
        dtsGenerator({
          prefix: '',
          out: `dist/${dtsFilename}`,
          baseDir: path.resolve(__dirname, '..', 'src/themes/charts/'),
          files: ['themes.ts'],
          resolveModuleId() {
            return moduleId;
          },
          resolveModuleImport(params) {
            if (params.importedModuleId === '../../components/common') {
              return importPath;
            }
            return null;
          },
        });

        console.log(`Chart theme output for ${outputFilename}:`, output);
        console.log(chalk.green(`✔ Finished building ${outputFilename}`));
        resolve();
      } else {
        console.error(`Chart theme error for ${outputFilename}:`, errorOutput);
        reject(new Error(`${outputFilename} failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start ${outputFilename}: ${err.message}`));
    });
  });
}

compileChartsBundle().catch((error) => {
  console.error('Chart compilation failed:', error);
  process.exit(1);
});
