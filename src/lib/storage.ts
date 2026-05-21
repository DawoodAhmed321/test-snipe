import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'app-storage' });

export const LAST_VIEWED_ITEM_KEY = 'last_viewed_item_id';
