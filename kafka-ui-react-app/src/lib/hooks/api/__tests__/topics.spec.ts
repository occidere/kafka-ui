import { act, renderHook, waitFor } from '@testing-library/react';
import { renderQueryHook, TestQueryClientProvider } from 'lib/testHelpers';
import * as hooks from 'lib/hooks/api/topics';
import fetchMock from 'fetch-mock';
import { UseQueryResult } from '@tanstack/react-query';
import { externalTopicPayload, topicConfigPayload } from 'lib/fixtures/topics';
import { TopicFormData, TopicFormDataRaw } from 'redux/interfaces';
import { CreateTopicMessage } from 'generated-sources';

const clusterName = 'test-cluster';
const topicName = 'test-topic';

const expectQueryWorks = async (
  mock: fetchMock.FetchMockStatic,
  result: { current: UseQueryResult<unknown, unknown> }
) => {
  await waitFor(() => expect(result.current.isFetched).toBeTruthy());
  expect(mock.calls()).toHaveLength(1);
  expect(result.current.data).toBeDefined();
};

const topicsPath = `/api/clusters/${clusterName}/topics`;
const topicPath = `${topicsPath}/${topicName}`;

const topicParams = { clusterName, topicName };

describe('Topics hooks', () => {
  beforeEach(() => fetchMock.restore());
  it('handles useTopics', async () => {
    const mock = fetchMock.getOnce(topicsPath, []);
    const { result } = renderQueryHook(() => hooks.useTopics({ clusterName }));
    await expectQueryWorks(mock, result);
  });
  it('handles useTopicDetails', async () => {
    const mock = fetchMock.getOnce(topicPath, externalTopicPayload);
    const { result } = renderQueryHook(() =>
      hooks.useTopicDetails(topicParams)
    );
    await expectQueryWorks(mock, result);
  });
  it('handles useTopicConfig', async () => {
    const mock = fetchMock.getOnce(`${topicPath}/config`, topicConfigPayload);
    const { result } = renderQueryHook(() => hooks.useTopicConfig(topicParams));
    await expectQueryWorks(mock, result);
  });
  it('handles useTopicConsumerGroups', async () => {
    const mock = fetchMock.getOnce(`${topicPath}/consumer-groups`, []);
    const { result } = renderQueryHook(() =>
      hooks.useTopicConsumerGroups(topicParams)
    );
    await expectQueryWorks(mock, result);
  });
  it('handles useTopicMessageSchema', async () => {
    const mock = fetchMock.getOnce(`${topicPath}/messages/schema`, {});
    const { result } = renderQueryHook(() =>
      hooks.useTopicMessageSchema(topicParams)
    );
    await expectQueryWorks(mock, result);
  });

  describe('mutatations', () => {
    it('useCreateTopic', async () => {
      const mock = fetchMock.postOnce(topicsPath, {});
      const { result } = renderHook(() => hooks.useCreateTopic(clusterName), {
        wrapper: TestQueryClientProvider,
      });
      const formData: TopicFormData = {
        name: 'Topic Name',
        partitions: 0,
        replicationFactor: 0,
        minInSyncReplicas: 0,
        cleanupPolicy: '',
        retentionMs: 0,
        retentionBytes: 0,
        maxMessageBytes: 0,
        customParams: [],
      };
      await act(() => {
        result.current.mutateAsync(formData);
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });

    it('useUpdateTopic', async () => {
      const mock = fetchMock.patchOnce(topicPath, {});
      const { result } = renderHook(() => hooks.useUpdateTopic(topicParams), {
        wrapper: TestQueryClientProvider,
      });
      const formData: TopicFormDataRaw = {
        name: 'Topic Name',
        partitions: 0,
        replicationFactor: 0,
        minInSyncReplicas: 0,
        cleanupPolicy: '',
        retentionMs: 0,
        retentionBytes: 0,
        maxMessageBytes: 0,
        customParams: {
          byIndex: {},
          allIndexes: [],
        },
      };
      await act(() => {
        result.current.mutateAsync(formData);
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });

    it('useIncreaseTopicPartitionsCount', async () => {
      const mock = fetchMock.patchOnce(`${topicPath}/partitions`, {});
      const { result } = renderHook(
        () => hooks.useIncreaseTopicPartitionsCount(topicParams),
        { wrapper: TestQueryClientProvider }
      );
      await act(() => {
        result.current.mutateAsync(3);
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });

    it('useUpdateTopicReplicationFactor', async () => {
      const mock = fetchMock.patchOnce(`${topicPath}/replications`, {});
      const { result } = renderHook(
        () => hooks.useUpdateTopicReplicationFactor(topicParams),
        { wrapper: TestQueryClientProvider }
      );
      await act(() => {
        result.current.mutateAsync(3);
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });

    it('useDeleteTopic', async () => {
      const mock = fetchMock.deleteOnce(topicPath, {});
      const { result } = renderHook(() => hooks.useDeleteTopic(clusterName), {
        wrapper: TestQueryClientProvider,
      });
      await act(() => {
        result.current.mutateAsync(topicName);
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });

    it('useRecreateTopic', async () => {
      const mock = fetchMock.postOnce(topicPath, {});
      const { result } = renderHook(() => hooks.useRecreateTopic(topicParams), {
        wrapper: TestQueryClientProvider,
      });
      await act(() => {
        result.current.mutateAsync();
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });

    it('useSendMessage', async () => {
      const mock = fetchMock.postOnce(`${topicPath}/messages`, {});
      const { result } = renderHook(() => hooks.useSendMessage(topicParams), {
        wrapper: TestQueryClientProvider,
      });
      const message: CreateTopicMessage = {
        partition: 0,
        content: 'Hello World',
      };
      await act(() => {
        result.current.mutateAsync(message);
      });
      await waitFor(() => expect(result.current.isSuccess).toBeTruthy());
      expect(mock.calls()).toHaveLength(1);
    });
  });
});
