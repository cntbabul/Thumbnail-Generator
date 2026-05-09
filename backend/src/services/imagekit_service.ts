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
  youtube: string;
  shorts: string;
  square: string;
}

export const getVariants = (baseUrl: string | null | undefined): ImageVariants | null => {
  if (!baseUrl) return null;
  return {
    youtube: `${baseUrl}?tr=w-1280,h-720,c-maintain_ratio,fo-auto`,
    shorts: `${baseUrl}?tr=w-1080,h-1920,c-maintain_ratio,fo-auto`,
    square: `${baseUrl}?tr=w-1080,h-1080,c-maintain_ratio,fo-auto`,
  };
};
