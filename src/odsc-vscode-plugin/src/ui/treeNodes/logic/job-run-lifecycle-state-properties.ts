/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { JobRunLifecycleState as State } from 'oci-datascience/lib/model';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export class JobRunLifecycleStateProperties {
    constructor(private state: string) {
    }

    public get canCancel(): string {
        const canCancelFlag = [State.Accepted, State.InProgress, State.NeedsAttention].includes(<State>this.state);
        return canCancelFlag ? "CanCancel" : "";
    }

    public get iconColor(): string {
        switch (this.state) {
            case State.Failed:
            case State.Canceled:
                return 'red';
            case State.Succeeded:
                return 'green';
            default:
                return 'neutral';
        }
    }

    public get toolTip(): string {
        switch (this.state) {
            case State.Accepted:
                return localize("acceptedState","Accepted");
            case State.InProgress:
                return localize("inProgressState","In progress");
            case State.Failed:
                return localize("failedState","Failed");
            case State.Succeeded:
                return localize("succeededState","Succeeded");
            case State.Canceling:
                return localize("cancelingState","Canceling");
            case State.Canceled:
                return localize("canceledState","Canceled");
            case State.Deleted:
                return localize("deletedState","Deleted");
            case State.NeedsAttention:
                return localize("needsAttentionState","Needs attention");
            default:
                return '';
        }
    }  
}

