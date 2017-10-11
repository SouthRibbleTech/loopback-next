// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect, ShotRequest} from '@loopback/testlab';
import {Application, ProviderMap, CoreBindings} from '@loopback/core';
import {inject, Provider, BoundValue, Context} from '@loopback/context';

import {
  RestComponent,
  RestServer,
  RestBindings,
  RestComponentConfig,
  ServerRequest,
  HttpHandler,
} from '../..';

const SequenceActions = RestBindings.SequenceActions;
describe('RestComponent', () => {
  describe('Providers', () => {
    describe('Default implementations are bound', () => {
      const app = new Application({
        components: [RestComponent],
      });

      // Stub constructor requirements for some providers.
      app.bind(RestBindings.Http.CONTEXT).to(new Context());
      app.bind(RestBindings.HANDLER).to(new HttpHandler(app));

      // Mocha can't dynamically generate the tests if we use app.get(...)
      const comp = app.getSync('components.RestComponent');
      for (const key in comp.providers) {
        it(key, async () => {
          const result = await app.get(key);
          const expected: Provider<BoundValue> = new comp.providers[key]();
          expect(result).to.deepEqual(expected.value());
        });
      }
    });
    describe('LOG_ERROR', () => {
      it('matches expected argument signature', async () => {
        const app = new Application({
          components: [RestComponent],
        });
        const server = await app.getServer(RestServer);
        const logError = await server.get(SequenceActions.LOG_ERROR);
        expect(logError.length).to.equal(3); // (err, statusCode, request)
      });

      // tslint:disable-next-line:max-line-length
      it('can be customized by extending RestComponent', async () => {
        let lastLog: string = 'logError() was not called';

        class CustomRestComponent extends RestComponent {
          providers: ProviderMap = {
            [RestBindings.SequenceActions.LOG_ERROR]: CustomLogger,
          };
          constructor(
            @inject(CoreBindings.APPLICATION_INSTANCE) application: Application,
            @inject(CoreBindings.APPLICATION_CONFIG)
            config?: RestComponentConfig,
          ) {
            super(application, config);
          }
        }

        class CustomLogger implements Provider<BoundValue> {
          value() {
            return (err: Error, statusCode: number, request: ServerRequest) => {
              lastLog = `${request.url} ${statusCode} ${err.message}`;
            };
          }
        }

        const app = new Application({
          components: [CustomRestComponent],
        });
        const server = await app.getServer(RestServer);
        const logError = await server.get(SequenceActions.LOG_ERROR);
        logError(new Error('test-error'), 400, new ShotRequest({url: '/'}));

        expect(lastLog).to.equal('/ 400 test-error');
      });
    });
  });
});