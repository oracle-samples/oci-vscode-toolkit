/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { Job } from 'oci-resourcemanager/lib/model';
import { getResourcePath } from '../../../utils/path-utils';
import * as nls from "vscode-nls";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

 export class JobRunLifecycleStateProperties {
    constructor(private state: string) {
    }

    public get iconColor(): string {
        switch (this.state) {
            case Job.LifecycleState.Failed:
            case Job.LifecycleState.Canceled:
                return 'red';
            case Job.LifecycleState.Succeeded:
                return 'green';
            default:
                return 'neutral';
        }
    }

    public static getIconPath(state: string, themeName: string): string {
        const iconSuffix = new JobRunLifecycleStateProperties(state).iconColor;
        return getResourcePath(`${themeName}/each-stack-${themeName}-${iconSuffix}.svg`);
    }

    public static getTooltip(operation: string, state: string): string {
        switch (operation) {
            case Job.Operation.Plan:
                if(Job.LifecycleState.Succeeded === state){
                    return localize('planSucceededTootip', 'Plan succeeded');
                }
                else if(Job.LifecycleState.Failed === state || Job.LifecycleState.Canceled === state){
                    return localize('planFailedTootip', 'Plan failed or was canceled');
                }
            case Job.Operation.Apply:
                if(Job.LifecycleState.Succeeded === state){
                    return localize('applySucceededTootip', 'Apply succeeded');
                }
                else if(Job.LifecycleState.Failed === state || Job.LifecycleState.Canceled === state){
                    return localize('applyFailedTootip', 'Apply failed or was canceled');
                }
            default:
                return '';
        }
    }

    public static jobIsDone(lifecycleState: string): boolean {
        return lifecycleState === Job.LifecycleState.Failed ||
            lifecycleState === Job.LifecycleState.Succeeded ||
            lifecycleState === Job.LifecycleState.Canceled;
    };
}
