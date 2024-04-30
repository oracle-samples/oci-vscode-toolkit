/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { expect }                         from 'chai';
import { JobRunLifecycleStateProperties } from '../job-run-lifecycle-state-properties';
import { JobRunLifecycleState as State }  from 'oci-datascience/lib/model';

describe('Picking job run icon based on the status', () => {
    it('defaults to: neutral', () => {
        const icon = new JobRunLifecycleStateProperties('made up state').iconColor;
        expect(icon).to.equal('neutral');
    });

    it(`${State.Failed} state -> red icon`, () => {
        const icon = new JobRunLifecycleStateProperties(State.Failed).iconColor;
        expect(icon).to.equal('red');
    });

    it(`${State.Canceled} state -> red icon`, () => {
        const icon = new JobRunLifecycleStateProperties(State.Canceled).iconColor;
        expect(icon).to.equal('red');
    });

    it(`${State.Succeeded} state -> green icon`, () => {
        const icon = new JobRunLifecycleStateProperties(State.Succeeded).iconColor;
        expect(icon).to.equal('green');
    });
});

describe('Computing job run cancel state', () => {
    it(`${State.Accepted} state can be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.Accepted);
        expect(state.canCancel).to.equal("CanCancel");
    });

    it(`${State.InProgress} state can be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.InProgress);
        expect(state.canCancel).to.equal("CanCancel");
    });

    it(`${State.NeedsAttention} state can be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.NeedsAttention);
        expect(state.canCancel).to.equal("CanCancel");
    });

    it(`${State.Failed} state cannot be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.Failed);
        expect(state.canCancel).to.be.empty;
    });

    it(`${State.Canceled} state cannot be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.Canceled);
        expect(state.canCancel).to.be.empty;
    });

    it(`${State.Canceling} state cannot be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.Canceling);
        expect(state.canCancel).to.be.empty;
    });

    it(`${State.Succeeded} state cannot be canceled`, () => {
        const state = new JobRunLifecycleStateProperties(State.Succeeded);
        expect(state.canCancel).to.be.empty;
    });
});
