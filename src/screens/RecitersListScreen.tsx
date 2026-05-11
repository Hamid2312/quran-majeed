import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  SafeAreaView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ReciterProfile } from '../models/Session';
import { getReciters, saveReciter, deleteReciter } from '../services/StorageService';
import EmptyState from '../components/shared/EmptyState';
import { Colors } from '../constants/colors';
import { formatDate } from '../utils/dateHelpers';

export default function RecitersListScreen() {
  const [reciters, setReciters] = useState<ReciterProfile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useFocusEffect(
    useCallback(() => { load(); }, [])
  );

  const load = async () => {
    const r = await getReciters();
    setReciters(r);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Reciter',
      `Delete "${name}"? All session data will remain in the database.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            await deleteReciter(id);
            load();
          },
        },
      ]
    );
  };

  const handleSaveEdit = async (reciter: ReciterProfile) => {
    await saveReciter({ ...reciter, name: editName.trim() || reciter.name });
    setEditingId(null);
    load();
  };

  const renderItem = ({ item }: { item: ReciterProfile }) => (
    <View style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.info}>
        {editingId === item.id ? (
          <TextInput
            style={styles.editInput}
            value={editName}
            onChangeText={setEditName}
            autoFocus
            onSubmitEditing={() => handleSaveEdit(item)}
          />
        ) : (
          <Text style={styles.name}>{item.name}</Text>
        )}
        <Text style={styles.date}>Added {formatDate(item.createdAt)}</Text>
      </View>

      <View style={styles.actions}>
        {editingId === item.id ? (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => handleSaveEdit(item)}
          >
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => { setEditingId(item.id); setEditName(item.name); }}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleDelete(item.id, item.name)}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>👤 Reciters</Text>
      <FlatList
        data={reciters}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="No Reciters"
            subtitle="Add reciters from the Session Setup screen."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    padding: 20,
    paddingBottom: 8,
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  info: { flex: 1 },
  name: { color: Colors.textPrimary, fontWeight: '700', fontSize: 16 },
  date: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  editInput: {
    color: Colors.textPrimary,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    paddingVertical: 2,
  },
  actions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  deleteBtnText: { fontSize: 16 },
  saveBtn: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
