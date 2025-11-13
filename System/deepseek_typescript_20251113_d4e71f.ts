import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { useWebhooks } from '../hooks/useWebhooks';
import { Webhook } from '../types';
import { WebhookCard } from '../components/WebhookCard';
import { CreateWebhookModal } from '../components/CreateWebhookModal';
import { TestWebhookModal } from '../components/TestWebhookModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export const WebhookManagerScreen: React.FC = () => {
  const {
    webhooks,
    loading,
    error,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    refreshWebhooks
  } = useWebhooks();

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isTestModalVisible, setIsTestModalVisible] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  const handleDeleteWebhook = (webhook: Webhook) => {
    Alert.alert(
      'Delete Webhook',
      `Are you sure you want to delete "${webhook.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWebhook(webhook.id)
        }
      ]
    );
  };

  const handleTestWebhook = async (webhookId: string, message: string) => {
    try {
      await testWebhook(webhookId, message);
      Alert.alert('Success', 'Webhook test sent successfully!');
      setIsTestModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send test webhook');
    }
  };

  if (loading && webhooks.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refreshWebhooks} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Webhook Manager</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Add Webhook</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={webhooks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshWebhooks}
          />
        }
        renderItem={({ item }) => (
          <WebhookCard
            webhook={item}
            onEdit={() => {
              setSelectedWebhook(item);
              setIsCreateModalVisible(true);
            }}
            onDelete={() => handleDeleteWebhook(item)}
            onTest={() => {
              setSelectedWebhook(item);
              setIsTestModalVisible(true);
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <CreateWebhookModal
        visible={isCreateModalVisible}
        webhook={selectedWebhook}
        onSubmit={async (data) => {
          if (selectedWebhook) {
            await updateWebhook(selectedWebhook.id, data);
          } else {
            await createWebhook(data);
          }
          setIsCreateModalVisible(false);
          setSelectedWebhook(null);
        }}
        onCancel={() => {
          setIsCreateModalVisible(false);
          setSelectedWebhook(null);
        }}
      />

      <TestWebhookModal
        visible={isTestModalVisible}
        webhook={selectedWebhook}
        onSubmit={handleTestWebhook}
        onCancel={() => {
          setIsTestModalVisible(false);
          setSelectedWebhook(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  }
});
