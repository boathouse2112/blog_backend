/**
 * Pre-start is where we want to place things that must run BEFORE the express server is started.
 * This is useful for environment variables, command-line arguments, and cron-jobs.
 */

import commandLineArgs from 'command-line-args';
import dayjs from 'dayjs';
import arraySupport from 'dayjs/plugin/arraySupport';
import objectSupport from 'dayjs/plugin/objectSupport';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import dotenv from 'dotenv';
import path from 'path';

(() => {
  // Setup command line options
  const options = commandLineArgs([
    {
      name: 'env',
      alias: 'e',
      defaultValue: 'development',
      type: String,
    },
  ]) as { env: string };

  // Set the env file
  const result2 = dotenv.config({
    path: path.join(__dirname, `env/${options.env}.env`),
  });
  if (result2.error) {
    throw result2.error;
  }

  // Extend dayjs
  dayjs.extend(objectSupport);
  dayjs.extend(arraySupport);
  dayjs.extend(timezone);
  dayjs.extend(utc);
})();
