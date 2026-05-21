import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { supabase } from '../lib/supabase';
import { storage, LAST_VIEWED_ITEM_KEY } from '../lib/storage';
import { Item, ToggleFavoriteResponse, AppStackParamList } from '../types';

type RouteProps = RouteProp<AppStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { itemId } = route.params;

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Persist last-viewed item on mount
  useEffect(() => {
    storage.set(LAST_VIEWED_ITEM_KEY, itemId);
  }, [itemId]);

  // Fetch item + current favorite status
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const [itemRes, favRes] = await Promise.all([
        supabase.from('items').select('*').eq('id', itemId).single(),
        supabase
          .from('favorites')
          .select('id')
          .eq('item_id', itemId)
          .maybeSingle(),
      ]);

      if (cancelled) return;

      // Log to help diagnose RLS / policy issues during development
      if (favRes.error) {
        console.warn('[favorites fetch error]', favRes.error.message);
      } else {
        console.log('[favorites fetch]', favRes.data ? 'favorited' : 'not favorited');
      }

      if (itemRes.error) {
        setError(itemRes.error.message);
      } else {
        setItem(itemRes.data as Item);
        setIsFavorited(!!favRes.data);
      }
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const handleToggleFavorite = useCallback(async () => {
    if (favoriteLoading) return;

    // Optimistic update — flip immediately
    const previousState = isFavorited;
    setIsFavorited(prev => !prev);
    setFavoriteLoading(true);

    try {
      const { data, error: fnError } =
        await supabase.functions.invoke<ToggleFavoriteResponse>(
          'toggle-favorite',
          { body: { item_id: itemId } },
        );

      if (fnError || !data || data.error) {
        // Rollback on any error
        setIsFavorited(previousState);
        Toast.show({
          type: 'error',
          text1: 'Could not update favorite',
          text2: data?.error ?? fnError?.message ?? 'Please try again',
          visibilityTime: 3000,
        });
      } else {
        // Sync with server truth
        setIsFavorited(data.favorited ?? false);
      }
    } catch (e: unknown) {
      setIsFavorited(previousState);
      Toast.show({
        type: 'error',
        text1: 'Network error',
        text2: e instanceof Error ? e.message : 'Please try again',
        visibilityTime: 3000,
      });
    } finally {
      setFavoriteLoading(false);
    }
  }, [favoriteLoading, isFavorited, itemId]);

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-500 mt-4 text-sm">Loading item…</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center px-6">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-white text-xl font-semibold mb-2">
          Item not found
        </Text>
        <Text className="text-gray-400 text-sm text-center mb-6">
          {error ?? 'This item may have been removed.'}
        </Text>
        <TouchableOpacity
          className="bg-indigo-600 px-6 py-3 rounded-xl"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-950" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-gray-800 w-10 h-10 rounded-full items-center justify-center"
        >
          <Text className="text-white text-lg">←</Text>
        </TouchableOpacity>

        {/* Favorite toggle */}
        <TouchableOpacity
          onPress={handleToggleFavorite}
          disabled={favoriteLoading}
          className={`px-4 py-2 rounded-xl flex-row items-center gap-2 ${
            isFavorited
              ? 'bg-yellow-500/20 border border-yellow-500'
              : 'bg-gray-800'
          }`}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color="#eab308" />
          ) : (
            <Text className="text-lg">{isFavorited ? '★' : '☆'}</Text>
          )}
          <Text
            className={`text-sm font-medium ${
              isFavorited ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            {isFavorited ? 'Favorited' : 'Favorite'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item name */}
        <Text className="text-white text-3xl font-bold mb-3">{item.name}</Text>

        <View>
          {/* Image */}
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              className="w-full h-64 rounded-2xl mb-6 bg-gray-700"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-64 rounded-2xl mb-6 bg-gray-800 items-center justify-center">
              <Text className="text-gray-600 text-sm">No image available</Text>
            </View>
          )}
        </View>

        {/* Meta */}
        <Text className="text-gray-500 text-xs mb-6">
          Added{' '}
          {new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Description */}
        {item.description ? (
          <View className="bg-gray-800 rounded-2xl p-4">
            <Text className="text-gray-300 text-base leading-6">
              {item.description}
            </Text>
          </View>
        ) : (
          <View className="bg-gray-800 rounded-2xl p-4">
            <Text className="text-gray-600 text-sm italic">
              No description available
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
