// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  model,
  property,
  Entity,
  DefaultCrudRepository,
  juggler,
  hasMany,
  HasManyRepositoryFactory,
  createHasManyRepositoryFactory,
} from '../..';
import {expect} from '@loopback/testlab';

describe('HasMany relation', () => {
  // Given a Customer and Order models - see definitions at the bottom

  let existingCustomerId: number;
  let ds: juggler.DataSource;
  let customerRepo: CustomerRepository;
  let orderRepo: OrderRepository;
  let fn: HasManyRepositoryFactory<Customer, Order>;

  before(givenDataSource);
  before(givenOrderRepository);
  // before(givenFactoryFn);
  before(givenCustomerRepository);
  beforeEach(async () => {
    existingCustomerId = (await givenPersistedCustomerInstance()).id;
  });
  afterEach(async () => {
    await orderRepo.deleteAll();
  });

  it('can create an instance of the related model', async () => {
    async function createCustomerOrders(
      customerId: number,
      orderData: Partial<Order>,
    ): Promise<Order> {
      return await customerRepo.orders({id: customerId}).create(orderData);
    }
    const order = await createCustomerOrders(existingCustomerId, {
      description: 'order 1',
    });
    expect(order.toObject()).to.containDeep({
      customerId: existingCustomerId,
      description: 'order 1',
    });

    const persisted = await orderRepo.findById(order.id);
    expect(persisted.toObject()).to.deepEqual(order.toObject());
  });

  it('can find instances of the related model', async () => {
    async function createCustomerOrders(
      customerId: number,
      orderData: Partial<Order>,
    ): Promise<Order> {
      return await customerRepo.orders({id: customerId}).create(orderData);
    }
    async function findCustomerOrders(customerId: number) {
      return await customerRepo.orders({id: customerId}).find();
    }

    const order = await createCustomerOrders(existingCustomerId, {
      description: 'order 1',
    });
    const notMyOrder = await createCustomerOrders(existingCustomerId + 1, {
      description: 'order 2',
    });
    const orders = await findCustomerOrders(existingCustomerId);

    expect(orders).to.containEql(order);
    expect(orders).to.not.containEql(notMyOrder);

    const persisted = await orderRepo.find({
      where: {customerId: existingCustomerId},
    });
    expect(persisted).to.deepEqual(orders);
  });

  //--- HELPERS ---//

  @model()
  class Order extends Entity {
    @property({
      type: 'number',
      id: true,
    })
    id: number;

    @property({
      type: 'string',
      required: true,
    })
    description: string;

    @property({
      type: 'number',
      required: true,
    })
    customerId: number;
  }

  @model()
  class Customer extends Entity {
    @property({
      type: 'number',
      id: true,
    })
    id: number;

    @property({
      type: 'string',
    })
    name: string;

    @hasMany({keyTo: 'customerId'})
    @property.array(Order)
    orders: Order[];
  }

  class OrderRepository extends DefaultCrudRepository<
    Order,
    typeof Order.prototype.id
  > {
    constructor(db: juggler.DataSource) {
      super(Order, db);
    }
  }

  class CustomerRepository extends DefaultCrudRepository<
    Customer,
    typeof Customer.prototype.id
  > {
    public orders: HasManyRepositoryFactory<Customer, Order>;

    constructor(
      protected db: juggler.DataSource,
      orderRepository: DefaultCrudRepository<Order, typeof Order.prototype.id>,
    ) {
      super(Customer, db);
      this.orders = createHasManyRepositoryFactory(Customer, orderRepository);
    }
  }

  function givenDataSource() {
    ds = new juggler.DataSource({connector: 'memory'});
  }

  function givenOrderRepository() {
    orderRepo = new OrderRepository(ds);
  }

  // function givenFactoryFn() {
  //   fn = createHasManyRepositoryFactory(Customer, orderRepo);
  // }

  function givenCustomerRepository() {
    customerRepo = new CustomerRepository(ds, orderRepo);
  }

  async function givenPersistedCustomerInstance() {
    return customerRepo.create({name: 'a customer'});
  }
});