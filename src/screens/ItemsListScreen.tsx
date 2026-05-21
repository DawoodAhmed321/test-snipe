import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { storage, LAST_VIEWED_ITEM_KEY } from '../lib/storage';
import { Item, AppStackParamList, LoadingState } from '../types';

type Nav = NativeStackNavigationProp<AppStackParamList, 'ItemsList'>;

const PAGE_SIZE = 20;

export default function ItemsListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthStore();

  const [items, setItems] = useState<Item[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const isFetchingRef = useRef(false);

  const lastViewedId = storage.getString(LAST_VIEWED_ITEM_KEY) ?? null;

  const fetchPage = useCallback(async (page: number, isRefresh: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error: fetchError } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    isFetchingRef.current = false;

    if (fetchError) {
      setError(fetchError.message);
      setLoadingState('error');
      return;
    }

    const rows = (data as Item[]) ?? [];
    setHasMore(rows.length === PAGE_SIZE);

    if (isRefresh) {
      setItems(rows);
    } else {
      setItems(prev => [...prev, ...rows]);
    }
    setLoadingState('idle');
    setError(null);
  }, []);

  // Initial load
  useEffect(() => {
    setLoadingState('loading');
    pageRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  const handleRefresh = useCallback(async () => {
    setLoadingState('refreshing');
    setHasMore(true);
    pageRef.current = 0;
    await fetchPage(0, true);
  }, [fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (
      !hasMore ||
      loadingState === 'loadingMore' ||
      loadingState === 'loading'
    )
      return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setLoadingState('loadingMore');
    fetchPage(nextPage, false);
  }, [hasMore, loadingState, fetchPage]);

  const handleItemPress = useCallback(
    (itemId: string) => {
      navigation.navigate('ItemDetail', { itemId });
    },
    [navigation],
  );

  // ── Render states ──────────────────────────────────────────────────────────

  if (loadingState === 'loading') {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-500 mt-4 text-sm">Loading items…</Text>
      </View>
    );
  }

  if (loadingState === 'error' && items.length === 0) {
    return (
      <View className="flex-1 bg-gray-950 items-center justify-center px-6">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-white text-xl font-semibold mb-2">
          Something went wrong
        </Text>
        <Text className="text-gray-400 text-sm text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-indigo-600 px-6 py-3 rounded-xl"
          onPress={handleRefresh}
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      className="bg-gray-800 mx-4 mb-3 rounded-2xl p-4 active:opacity-70"
      onPress={() => handleItemPress(item.id)}
    >
      <Image
        source={{
          uri: item.image_url ?? undefined,
        }}
        className="w-full h-40 rounded-xl mb-4 bg-gray-700"
        resizeMode="cover"
      />
      <Text className="text-white font-semibold text-base" numberOfLines={1}>
        {item.name}
      </Text>
      {item.description ? (
        <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text className="text-gray-600 text-xs mt-2">
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (loadingState !== 'loadingMore') return null;
    return (
      <View className="py-6 items-center">
        <ActivityIndicator color="#6366f1" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-5xl mb-4">📭</Text>
      <Text className="text-white text-lg font-semibold">No items yet</Text>
      <Text className="text-gray-500 text-sm mt-2">Pull down to refresh</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-950" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#030712" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <Text className="text-white text-2xl font-bold">Items</Text>
        <TouchableOpacity
          onPress={signOut}
          className="bg-gray-800 px-3 py-1.5 rounded-lg"
        >
          <Text className="text-gray-300 text-sm">Sign out</Text>
        </TouchableOpacity>
      </View>

      {/* "Continue where you left off" banner */}
      {lastViewedId ? (
        <TouchableOpacity
          className="mx-4 mb-4 bg-indigo-900/60 border border-indigo-700 rounded-xl px-4 py-3 flex-row items-center"
          onPress={() => handleItemPress(lastViewedId)}
        >
          <Text className="text-indigo-300 text-sm flex-1">
            ↩ Continue where you left off
          </Text>
          <Text className="text-indigo-400 text-xs">View →</Text>
        </TouchableOpacity>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        initialNumToRender={10}
        removeClippedSubviews
        windowSize={5}
        maxToRenderPerBatch={10}
        refreshControl={
          <RefreshControl
            refreshing={loadingState === 'refreshing'}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        contentContainerStyle={
          items.length === 0
            ? { flex: 1 }
            : { paddingBottom: insets.bottom + 20 }
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
