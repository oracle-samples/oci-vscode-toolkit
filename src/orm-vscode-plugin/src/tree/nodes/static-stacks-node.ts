/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { OCIStackNodeItem, StacksItem } from '../../commands/resources';
import { OCIStackNode } from './oci-stack-node';
import * as resourcemanager from "../../api/orm-client";
import { StaticNode } from './static-node';
import { ext } from '../../extensionVars';
import * as nodeBuilder from "./builders/node-builder";
import { getStack, listJobs } from '../../api/orm-client';
import { GitConfigSource } from 'oci-resourcemanager/lib/model/git-config-source';
import { JobSummary } from 'oci-resourcemanager/lib/model/job-summary';
import { JobRunLifecycleStateProperties } from './logic/job-run-lifecycle-state-properties';

export class StacksNode extends StaticNode {
  constructor(compartmentId: string) {
    super(StacksItem, 'each-stack', compartmentId);
  }

  fetchLatestJobForStack(compartmentId: string, stackId: string): Promise<JobSummary|undefined> {
    return listJobs(compartmentId, stackId)
    .then((results) =>{
        if(results.length !== 0){
            return results[0];
        }
    });
  }
  
  getChildren(_element: any): Thenable<OCIStackNode[]> {
    return nodeBuilder.makeSubnodes(
      () => resourcemanager.listStacks({profile: ext.api.getCurrentProfile().getProfileName(), compartmentId: this.compartmentId}),
      OCIStackNode
    ).then(async stacks => {
      let getStackPromises = [];
      let fetchLatestJobPromises = [];
      for (const stack of stacks) {
        getStackPromises.push(getStack(stack.id!));
        fetchLatestJobPromises.push(this.fetchLatestJobForStack(stack.resource.compartmentId!, stack.resource.id!));
      }

      let responses = await Promise.all(getStackPromises);
      let jobStateResponse = await Promise.all(fetchLatestJobPromises);
      for ( let i = 0; i < responses.length; i++) {
        stacks[i].context = `${OCIStackNodeItem.context}_${responses[i].stack.configSource?.configSourceType === GitConfigSource.configSourceType ? GitConfigSource.configSourceType : "NOT_GIT_BASED"}`;
        stacks[i].tooltip = `${JobRunLifecycleStateProperties.getTooltip(jobStateResponse[i]?.operation!, jobStateResponse[i]?.lifecycleState!)}. To save later updates, right-click the stack and choose 'Save changes'.`;
        stacks[i].darkIcon = JobRunLifecycleStateProperties.getIconPath(jobStateResponse[i]?.lifecycleState!, 'dark');
        stacks[i].lightIcon = JobRunLifecycleStateProperties.getIconPath(jobStateResponse[i]?.lifecycleState!, 'light');
      }
      return stacks;
  });
  }
}
