/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 import { expect } from 'chai';
 import { JobRunLifecycleStateProperties } from '../../tree/nodes/logic/job-run-lifecycle-state-properties';
 import { Job } from 'oci-resourcemanager/lib/model';

describe('Picking job run icon based on the status', () => {
    it('defaults to: neutral', () => {
        const icon = new JobRunLifecycleStateProperties('unknown').iconColor;
        expect(icon).to.equal('neutral');
    });

    it(`${Job.LifecycleState.Failed} state -> red icon`, () => {
        const icon = new JobRunLifecycleStateProperties(Job.LifecycleState.Failed).iconColor;
        expect(icon).to.equal('red');
    });

    it(`${Job.LifecycleState.Canceled} state -> red icon`, () => {
        const icon = new JobRunLifecycleStateProperties(Job.LifecycleState.Canceled).iconColor;
        expect(icon).to.equal('red');
    });

    it(`${Job.LifecycleState.Succeeded} state -> green icon`, () => {
        const icon = new JobRunLifecycleStateProperties(Job.LifecycleState.Succeeded).iconColor;
        expect(icon).to.equal('green');
    });
});

describe('Confirm if job is complete or not on the status', () => {
    it('state: canceled -> done', () => {
        const status = JobRunLifecycleStateProperties.jobIsDone(Job.LifecycleState.Canceled);
        expect(status).to.equal(true);
    });

    it('state: succeeded -> done', () => {
        const status = JobRunLifecycleStateProperties.jobIsDone(Job.LifecycleState.Succeeded);
        expect(status).to.equal(true);
    });
    
    it('state: accpeted -> in progess', () => {
        const status = JobRunLifecycleStateProperties.jobIsDone(Job.LifecycleState.Accepted);
        expect(status).to.equal(false);
    });

    it('state: failed -> done', () => {
        const status = JobRunLifecycleStateProperties.jobIsDone(Job.LifecycleState.Failed);
        expect(status).to.equal(true);
    });

    it('state: cancelling -> in progess', () => {
        const status = JobRunLifecycleStateProperties.jobIsDone(Job.LifecycleState.Canceling);
        expect(status).to.equal(false);
    });
});

describe('Picking tooltip based on the operation & status', () => {
    it('operation: plan & state: canceled -> Plan failed or was canceled', () => {
        const status = JobRunLifecycleStateProperties.getTooltip(Job.Operation.Plan, Job.LifecycleState.Canceled)
        expect(status).to.equal('Plan failed or was canceled');
    });

    it('operation: plan & state: suceeded -> Plan succeeded', () => {
        const status = JobRunLifecycleStateProperties.getTooltip(Job.Operation.Plan, Job.LifecycleState.Succeeded)
        expect(status).to.equal('Plan succeeded');
    });

    it('operation: plan & state: failed -> Plan failed or was canceled', () => {
        const status = JobRunLifecycleStateProperties.getTooltip(Job.Operation.Plan, Job.LifecycleState.Failed)
        expect(status).to.equal('Plan failed or was canceled');
    });

    it('operation: apply & state: canceled -> Apply failed or was canceled', () => {
        const status = JobRunLifecycleStateProperties.getTooltip(Job.Operation.Apply, Job.LifecycleState.Canceled)
        expect(status).to.equal('Apply failed or was canceled');
    });

    it('operation: apply & state: suceeded -> Apply succeeded', () => {
        const status = JobRunLifecycleStateProperties.getTooltip(Job.Operation.Apply, Job.LifecycleState.Succeeded)
        expect(status).to.equal('Apply succeeded');
    });

    it('operation: apply & state: failed -> Apply failed or was canceled', () => {
        const status = JobRunLifecycleStateProperties.getTooltip(Job.Operation.Apply, Job.LifecycleState.Failed)
        expect(status).to.equal('Apply failed or was canceled');
    });
});
