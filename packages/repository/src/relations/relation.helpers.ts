// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as _ from 'lodash';
import {Entity, EntityCrudRepository, Filter, Options, Where} from '..';

/**
 * Finds the foreign keys
 * @param targetRepository - The target repository.
 * @param fkName - Name of the foreign key
 * @param fkValues - Array of foreign keys
 * @param scope - The scope of ???
 * @param options - Options for the operations
 */
export async function findByForeignKeys<
  Target extends Entity,
  TargetID,
  TargetRelations extends object,
  ForeignKey
>(
  targetRepository: EntityCrudRepository<Target, TargetID, TargetRelations>,
  fkName: StringKeyOf<Target>,
  fkValues: ForeignKey[],
  scope?: Filter<Target>,
  options?: Options,
): Promise<(Target & TargetRelations)[]> {
  // throw error if scope is defined and non-empty
  if (scope && !_.isEmpty(scope)) {
    throw new Error('scope is not supported');
  }

  const where = ({
    [fkName]: fkValues.length === 1 ? fkValues[0] : {inq: fkValues},
  } as unknown) as Where<Target>;
  const targetFilter = {where};

  return targetRepository.find(targetFilter, options);
}

export type StringKeyOf<T> = Extract<keyof T, string>;
