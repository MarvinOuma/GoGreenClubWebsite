import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebaseConfig';

export const imageAccept = 'image/jpeg,image/png,image/webp,image/gif';
const maxImageBytes = 5 * 1024 * 1024;

export async function uploadImage(directory, file) {
  if (!imageAccept.split(',').includes(file.type) || file.size < 1 || file.size > maxImageBytes) {
    throw new Error('Choose a JPEG, PNG, WebP, or GIF image up to 5 MB.');
  }
  const path = `${directory}/${crypto.randomUUID()}`;
  const object = ref(storage, path);
  await uploadBytes(object, file, { contentType: file.type });
  try {
    return { path, url: await getDownloadURL(object) };
  } catch (error) {
    await deleteObject(object).catch(() => {});
    throw error;
  }
}

export async function discardUpload(upload) {
  if (upload) await deleteObject(ref(storage, upload.path)).catch(error => {
    console.error('Unable to remove unused upload:', error.code);
  });
}
