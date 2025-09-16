import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directoryPath = './uploads';

const reSizeImages = async (req, res) => {
  try {
    const files = await fs.promises.readdir(directoryPath);
    const errors = [];

    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      if (!/\.(jpe?g|png)$/i.test(file)) {
        console.log(`ℹ️ تم تجاهل الملف (ليس صورة مناسبة): ${file}`);
        continue;
      }

      try {
        await sharp(filePath)
          .resize(800, 800, {
            fit: 'cover',
            position: 'center',
          })
          .toFile(filePath + '.tmp');

        await fs.promises.rename(filePath + '.tmp', filePath);
        console.log(`✔ تمت معالجة الصورة: ${file}`);
      } catch (err) {
        console.error(`✘ خطأ في معالجة الصورة ${file}:`, err);
        errors.push({ file, error: err.message });
      }
    }

    if (errors.length > 0) {
      return errors
    } else {
      return true
    }
  } catch (err) {
    return err
  }
};

export default reSizeImages;
