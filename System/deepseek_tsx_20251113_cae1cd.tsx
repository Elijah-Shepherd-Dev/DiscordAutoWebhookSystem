import React, { useState, useEffect } from 'react';
import { WebhookForm } from './WebhookForm';
import { WebhookList } from './WebhookList';
import { WebhookTester } from './WebhookTester';
import { useWebhooks } from '../hooks/useWebhooks';
import { Webhook } from '../types';

export const WebhookManager: React.FC = () => {
  const { webhooks, loading, error, createWebhook, updateWebhook, deleteWebhook, testWebhook } = useWebhooks();
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'test'>('list');

  const handleCreateWebhook = async (data: Partial<Webhook>) => {
    await createWebhook(data);
    setActiveTab('list');
  };

  const handleTestWebhook = async (webhookId: string, message: string) => {
    await testWebhook(webhookId, message);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Webhook Manager
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Webhooks
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'create'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Create New
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'test'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Test Webhook
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <WebhookList
          webhooks={webhooks}
          onEdit={setSelectedWebhook}
          onDelete={deleteWebhook}
          loading={loading}
        />
      )}

      {activeTab === 'create' && (
        <WebhookForm
          onSubmit={handleCreateWebhook}
          onCancel={() => setActiveTab('list')}
        />
      )}

      {activeTab === 'test' && (
        <WebhookTester
          webhooks={webhooks}
          onTest={handleTestWebhook}
        />
      )}
    </div>
  );
};
