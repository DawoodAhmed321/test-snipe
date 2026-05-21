export interface Item {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  [key: string]: unknown;
}

export interface Favorite {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
}

export type ToggleFavoriteResponse =
  | { favorited: boolean; error?: never }
  | { error: string; favorited?: never };

export type LoadingState =
  | 'idle'
  | 'loading'
  | 'refreshing'
  | 'loadingMore'
  | 'error';

export type AppStackParamList = {
  ItemsList: undefined;
  ItemDetail: { itemId: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
};
