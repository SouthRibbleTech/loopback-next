// Copyright IBM Corp. 2019. All Rights Reserved.
// Node module: @loopback/repository-tests
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Entity,
  IsolationLevel,
  model,
  property,
  Transaction,
  TransactionalEntityRepository,
} from '@loopback/repository';
import {} from '@loopback/repository/src';
import {expect, skipIf, toJSON} from '@loopback/testlab';
import {Suite} from 'mocha';
import {withCrudCtx} from '../helpers.repository-tests';
import {
  CrudFeatures,
  CrudTestContext,
  DataSourceOptions,
  TransactionalRepositoryCtor,
} from '../types.repository-tests';

// Core scenarios for testing CRUD functionalities of Transactional connectors
// Please keep this file short, put any advanced scenarios to other files
export function transactionSuite(
  dataSourceOptions: DataSourceOptions,
  repositoryClass: TransactionalRepositoryCtor,
  connectorFeatures: CrudFeatures,
) {
  skipIf<[(this: Suite) => void], void>(
    !connectorFeatures.supportsTransactions,
    describe,
    `transactions`,
    () => {
      @model()
      class Product extends Entity {
        @property({
          type: connectorFeatures.idType,
          id: true,
          generated: true,
          description: 'The unique identifier for a product',
        })
        id: number | string;

        @property({type: 'string', required: true})
        name: string;

        constructor(data?: Partial<Product>) {
          super(data);
        }
      }

      describe('create-retrieve with transactions', () => {
        let repo: TransactionalEntityRepository<
          Product,
          typeof Product.prototype.id
        >;
        let tx: Transaction | undefined;
        before(
          withCrudCtx(async function setupRepository(ctx: CrudTestContext) {
            repo = new repositoryClass(Product, ctx.dataSource);
            await ctx.dataSource.automigrate(Product.name);
          }),
        );
        beforeEach(() => {
          tx = undefined;
        });
        afterEach(async () => {
          // FIXME: replace tx.connection with tx.isActive when it become
          // available
          // see https://github.com/strongloop/loopback-next/issues/3471
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (tx !== undefined && (tx as any).connection) {
            await tx.rollback();
          }
        });

        it('retrieves model instance once transaction is committed', async () => {
          tx = await repo.beginTransaction({
            isolationLevel: IsolationLevel.READ_COMMITTED,
          });
          const created = await repo.create(
            {name: 'Pencil'},
            {transaction: tx},
          );
          expect(created.toObject()).to.have.properties('id', 'name');
          expect(created.id).to.be.ok();

          await tx.commit();
          const foundOutsideTransaction = await repo.findById(created.id, {});
          expect(toJSON(created)).to.deepEqual(toJSON(foundOutsideTransaction));
        });

        it('can rollback transaction', async () => {
          tx = await repo.beginTransaction({
            isolationLevel: IsolationLevel.READ_COMMITTED,
          });

          const created = await repo.create(
            {name: 'Pencil'},
            {transaction: tx},
          );
          expect(created.toObject()).to.have.properties('id', 'name');
          expect(created.id).to.be.ok();

          const foundInsideTransaction = await repo.findById(
            created.id,
            {},
            {
              transaction: tx,
            },
          );
          expect(toJSON(created)).to.deepEqual(toJSON(foundInsideTransaction));
          await tx.rollback();
          await expect(repo.findById(created.id, {})).to.be.rejectedWith({
            code: 'ENTITY_NOT_FOUND',
          });
        });

        it('ensures transactions are isolated', async () => {
          tx = await repo.beginTransaction({
            isolationLevel: IsolationLevel.READ_COMMITTED,
          });
          const created = await repo.create(
            {name: 'Pencil'},
            {transaction: tx},
          );
          expect(created.toObject()).to.have.properties('id', 'name');
          expect(created.id).to.be.ok();

          const foundInsideTransaction = await repo.findById(
            created.id,
            {},
            {
              transaction: tx,
            },
          );
          expect(toJSON(created)).to.deepEqual(toJSON(foundInsideTransaction));
          await expect(repo.findById(created.id, {})).to.be.rejectedWith({
            code: 'ENTITY_NOT_FOUND',
          });
        });
      });
    },
  );
}
