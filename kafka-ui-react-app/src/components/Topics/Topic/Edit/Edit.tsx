import React from 'react';
import {
  TopicFormDataRaw,
  TopicConfigByName,
  TopicFormData,
} from 'redux/interfaces';
import { useForm, FormProvider } from 'react-hook-form';
import TopicForm from 'components/Topics/shared/Form/TopicForm';
import { RouteParamsClusterTopic } from 'lib/paths';
import { useNavigate } from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import { topicFormValidationSchema } from 'lib/yupExtended';
import PageHeading from 'components/common/PageHeading/PageHeading';
import useAppParams from 'lib/hooks/useAppParams';
import topicParamsTransformer from 'components/Topics/Topic/Edit/topicParamsTransformer';
import { MILLISECONDS_IN_WEEK } from 'lib/constants';
import {
  useTopicConfig,
  useTopicDetails,
  useUpdateTopic,
} from 'lib/hooks/api/topics';
import DangerZone from 'components/Topics/Topic/Edit/DangerZone/DangerZone';

export const TOPIC_EDIT_FORM_DEFAULT_PROPS = {
  partitions: 1,
  replicationFactor: 1,
  minInSyncReplicas: 1,
  cleanupPolicy: 'delete',
  retentionBytes: -1,
  retentionMs: MILLISECONDS_IN_WEEK,
  maxMessageBytes: 1000012,
  customParams: [],
};

const Edit: React.FC = () => {
  const { clusterName, topicName } = useAppParams<RouteParamsClusterTopic>();
  const { data: topic } = useTopicDetails({ clusterName, topicName });
  const { data: topicConfig } = useTopicConfig({ clusterName, topicName });
  const updateTopic = useUpdateTopic({ clusterName, topicName });

  const defaultValues = topicParamsTransformer(topic, topicConfig);

  const methods = useForm<TopicFormData>({
    defaultValues,
    resolver: yupResolver(topicFormValidationSchema),
    mode: 'onChange',
  });

  const navigate = useNavigate();

  const config: TopicConfigByName = {
    byName: {},
  };

  topicConfig?.forEach((param) => {
    config.byName[param.name] = param;
  });

  const onSubmit = async (data: TopicFormDataRaw) => {
    await updateTopic.mutateAsync(data);
    navigate('../');
  };

  return (
    <>
      <PageHeading text={`Edit ${topicName}`} />
      <FormProvider {...methods}>
        <TopicForm
          topicName={topicName}
          retentionBytes={defaultValues.retentionBytes}
          inSyncReplicas={Number(defaultValues.minInSyncReplicas)}
          isSubmitting={updateTopic.isLoading}
          cleanUpPolicy={topic?.cleanUpPolicy}
          isEditing
          onSubmit={methods.handleSubmit(onSubmit)}
        />
      </FormProvider>
      {topic && (
        <DangerZone
          defaultPartitions={defaultValues.partitions}
          defaultReplicationFactor={
            defaultValues.replicationFactor ||
            TOPIC_EDIT_FORM_DEFAULT_PROPS.replicationFactor
          }
        />
      )}
    </>
  );
};

export default Edit;
