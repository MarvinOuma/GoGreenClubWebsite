import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig';

export async function callFunction(name, data) {
  const result = await httpsCallable(functions, name)(data);
  return result.data;
}
