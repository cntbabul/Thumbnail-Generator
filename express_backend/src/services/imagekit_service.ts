import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const ik = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
});

export const uploadFile = async (fileBuffer: Buffer | string, fileName: string, folder: string = 'headshots'): Promise<string> => {
  try {
    const upload = await ik.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: folder,
    });
    return upload.url;
  } catch (error) {
    console.error('Error uploading to ImageKit:', error);
    throw error;
  }
};

export interface ImageVariants {
  thumbnail: string;
  medium: string;
  large: string;
}

export const getVariants = (url: string | null | undefined): ImageVariants | null => {
  if (!url) return null;
  return {
    thumbnail: `${url}?tr=w-300,h-200`,
    medium: `${url}?tr=w-600,h-400`,
    large: `${url}?tr=w-1200,h-800`,
  };
};
