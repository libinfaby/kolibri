import coreStrings from 'kolibri.coreVue.mixins.commonCoreStrings';
import taskStrings from 'kolibri.coreVue.mixins.commonTaskStrings';
import bytesForHumans from 'kolibri.utils.bytesForHumans';
import { taskIsClearable, TaskStatuses } from '../constants';

const SyncTaskStatuses = {
  SESSION_CREATION: 'SESSION_CREATION',
  REMOTE_QUEUING: 'REMOTE_QUEUING',
  PULLING: 'PULLING',
  LOCAL_DEQUEUING: 'LOCAL_DEQUEUING',
  LOCAL_QUEUING: 'LOCAL_QUEUING',
  PUSHING: 'PUSHING',
  REMOTE_DEQUEUING: 'REMOTE_DEQUEUING',
  REMOVING_FACILITY: 'REMOVING_FACILITY',
};

const { getTaskString } = taskStrings.methods;
const { coreString } = coreStrings.methods;

const syncTaskStatusToStepMap = {
  [SyncTaskStatuses.SESSION_CREATION]: 1,
  [SyncTaskStatuses.REMOTE_QUEUING]: 2,
  [SyncTaskStatuses.PULLING]: 3,
  [SyncTaskStatuses.LOCAL_DEQUEUING]: 4,
  [SyncTaskStatuses.LOCAL_QUEUING]: 5,
  [SyncTaskStatuses.PUSHING]: 6,
  [SyncTaskStatuses.REMOTE_DEQUEUING]: 7,
};

const genericStatusToDescriptionMap = {
  [TaskStatuses.PENDING]: getTaskString('taskWaitingStatus'),
  [TaskStatuses.QUEUED]: getTaskString('taskWaitingStatus'),
  [TaskStatuses.COMPLETED]: getTaskString('taskFinishedStatus'),
  [TaskStatuses.CANCELED]: getTaskString('taskCanceledStatus'),
  [TaskStatuses.CANCELING]: getTaskString('taskCancelingStatus'),
  [TaskStatuses.FAILED]: getTaskString('taskFailedStatus'),
};

export const syncStatusToDescriptionMap = {
  ...genericStatusToDescriptionMap,
  [SyncTaskStatuses.SESSION_CREATION]: getTaskString('establishingConnectionStatus'),
  [SyncTaskStatuses.REMOTE_QUEUING]: getTaskString('remotelyPreparingDataStatus'),
  [SyncTaskStatuses.PULLING]: getTaskString('receivingDataStatus'),
  [SyncTaskStatuses.LOCAL_DEQUEUING]: getTaskString('locallyIntegratingDataStatus'),
  [SyncTaskStatuses.LOCAL_QUEUING]: getTaskString('locallyPreparingDataStatus'),
  [SyncTaskStatuses.PUSHING]: getTaskString('sendingDataStatus'),
  [SyncTaskStatuses.REMOTE_DEQUEUING]: getTaskString('remotelyIntegratingDataStatus'),
};

function formatNameWithId(name, id) {
  return coreString('nameWithIdInParens', { name, id: id.slice(0, 4) });
}

// Consolidates logic on how Sync-Facility Tasks should be displayed
export function syncFacilityTaskDisplayInfo(task) {
  let statusMsg;
  let bytesTransferredMsg = '';
  let deviceNameMsg = '';

  const facilityName = formatNameWithId(task.facility_name, task.facility);

  // Device info isn't shown on the Setup Wizard version of panel
  if (task.device_name) {
    deviceNameMsg = coreString('quotedPhrase', {
      phrase: formatNameWithId(task.device_name, task.device_id),
    });
  }
  const syncStep = syncTaskStatusToStepMap[task.sync_state];
  const statusDescription =
    syncStatusToDescriptionMap[task.status] || getTaskString('taskUnknownStatus');

  if (syncStep) {
    statusMsg = getTaskString('syncStepAndDescription', {
      step: syncStep,
      total: 7,
      description: statusDescription,
    });
  } else {
    statusMsg = statusDescription;
  }

  if (task.status === TaskStatuses.COMPLETED) {
    bytesTransferredMsg = getTaskString('syncBytesSentAndReceived', {
      bytesReceived: bytesForHumans(task.bytes_received),
      bytesSent: bytesForHumans(task.bytes_sent),
    });
  }

  const canClear = taskIsClearable(task);

  return {
    headingMsg: getTaskString('syncFacilityTaskLabel', { facilityName }),
    statusMsg,
    startedByMsg: getTaskString('taskStartedByLabel', { username: task.started_by_username }),
    bytesTransferredMsg,
    deviceNameMsg,
    isRunning: Boolean(syncStep) && !canClear,
    canClear,
    canCancel: !canClear,
    canRetry: task.status === TaskStatuses.FAILED,
  };
}

export const removeStatusToDescriptionMap = {
  ...genericStatusToDescriptionMap,
  REMOVING_FACILITY: getTaskString('removingFacilityStatus'),
};

// Consolidates logic on how Remove-Facility Tasks should be displayed
export function removeFacilityTaskDisplayInfo(task) {
  const facilityName = formatNameWithId(task.facility_name, task.facility_id);
  const statusDescription =
    removeStatusToDescriptionMap[task.status] || getTaskString('taskUnknownStatus');

  return {
    headingMsg: getTaskString('removeFacilityTaskLabel', { facilityName }),
    statusMsg: statusDescription,
    startedByMsg: getTaskString('taskStartedByLabel', { username: task.started_by_username }),
    isRunning: task.status === 'REMOVING_FACILITY',
    canClear: taskIsClearable(task),
    canCancel: !taskIsClearable(task) && task.status !== 'REMOVING_FACILITY',
    canRetry: task.status === TaskStatuses.FAILED,
  };
}

export function importFacilityTaskDisplayInfo(task) {
  // Basically takes the sync output and removes things
  const info = syncFacilityTaskDisplayInfo(task);
  // info.bytesTransferredMsg = '';
  // NOTE: We're re-using the "syncFacilityLabel" for import facility tasks
  // TODO: Add a separate label for import tasks and use the commented-out code
  // const facilityName = formatNameWithId(task.facility_name, task.facility);
  // info.headingMsg = getTaskString('syncFacilityTaskLabel', { facilityName });

  if (task.status === TaskStatuses.FAILED) {
    info.deviceNameMsg = getTaskString('importFailedStatus', { facilityName: task.facility_name });
    info.statusMsg = getTaskString('taskFailedStatus');
    info.isRunning = false;
  } else if (task.status === TaskStatuses.COMPLETED) {
    info.deviceNameMsg = getTaskString('importSuccessStatus', { facilityName: task.facility_name });
    info.statusMsg = getTaskString('taskFinishedStatus');
    info.isRunning = false;
  } else {
    info.deviceNameMsg = '';
  }
  info.canRetry = false;
  info.canClear = false;
  return info;
}
