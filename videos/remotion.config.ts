import {Config} from '@remotion/cli/config';

// Point public dir to local folder to avoid copying the entire project root
Config.setPublicDir('./public');

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
