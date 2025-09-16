import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { dirname } from 'path';

ffmpeg.setFfmpegPath(ffmpegPath);

async function processVideoForReels(inputPath, outputPath) {
  const outputDir = dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      if (!videoStream) return reject(new Error('No video stream found'));

      const originalWidth = videoStream.width;
      const originalHeight = videoStream.height;
      const aspectRatio = originalWidth / originalHeight;

      const targetWidth = 1080;
      const targetHeight = 1920;

      let filterComplex = '';
      const needsResize = originalWidth > targetWidth || originalHeight > targetHeight;

      if (needsResize) {
        if (aspectRatio > (9 / 16)) {
          // Horizontal video - add black padding with sharpness improvement
          filterComplex = `[0:v]scale=-1:${targetHeight}:flags=lanczos,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black`;
        } else {
          // Vertical video - use best resize algorithm
          filterComplex = `[0:v]scale=${targetWidth}:${targetHeight}:flags=lanczos:force_original_aspect_ratio=decrease`;
        }
      } else {
        // No dimension changes with quality improvement
        filterComplex = `[0:v]scale=${originalWidth}:${originalHeight}:flags=lanczos`;
      }

      // Simplified output options
      const outputOptions = [
        '-c:v', 'libx264',
        '-crf', '24',
        '-preset', 'veryslow',
        '-pix_fmt', 'yuv420p',
       '-movflags', '+faststart', 
        '-profile:v', 'baseline',
        '-g', '60',
        '-b:v', '2000k',
        '-f', 'mp4',
        '-tune', 'fastdecode',
        '-c:a', 'aac',
        '-b:a', '96k',
        '-ac', '2',
        '-ar', '48000'
      ];

      const command = ffmpeg(inputPath)
        .videoFilters(filterComplex)
        .outputOptions(outputOptions);

      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      if (audioStream) {
        command
          .audioCodec('aac')
          .audioBitrate('128k')
          .audioChannels(2)
          .audioFrequency(48000);
      } else {
        command.noAudio();
      }

      command
        .on('start', (cmd) => console.log('Processing video: ' + cmd))
        .on('progress', (progress) => console.log(`Progress: ${Math.floor(progress.percent)}%`))
        .on('end', () => {
          console.log('✅ Video processed successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('❌ Video processing error:', {
            message: err.message,
            stack: err.stack,
            stderr: err.stderr
          });
          reject(err);
        })
        .save(outputPath);
    });
  });
}

export { processVideoForReels };
