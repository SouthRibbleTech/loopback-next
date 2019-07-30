import {expect} from '@loopback/testlab';
import {DefaultCrudRepository, findByForeignKeys, juggler} from '../../..';
import {model, property} from '../../../decorators';
import {Entity} from '../../../model';

describe('findByForeignKeys', () => {
  let productRepo: ProductRepository;

  before(() => {
    productRepo = new ProductRepository(testdb);
  });

  beforeEach(async () => {
    await productRepo.deleteAll();
  });

  it('returns an empty array when no instances have the foreign key value', async () => {
    await productRepo.create({id: 1, name: 'product', categoryId: 1});
    const products = await findByForeignKeys(productRepo, 'categoryId', [2]);
    expect(products).to.be.empty();
  });

  it('returns all instances that have the foreign key value', async () => {
    const pens = await productRepo.create({name: 'pens', categoryId: 1});
    const pencils = await productRepo.create({name: 'pencils', categoryId: 1});
    const products = await findByForeignKeys(productRepo, 'categoryId', [1]);
    expect(products).to.deepEqual([pens, pencils]);
  });

  it('does not include instances with different foreign key values', async () => {
    const pens = await productRepo.create({name: 'pens', categoryId: 1});
    const pencils = await productRepo.create({name: 'pencils', categoryId: 2});
    const products = await findByForeignKeys(productRepo, 'categoryId', [1]);
    expect(products).to.deepEqual([pens]);
    expect(products).to.not.containDeep(pencils);
  });

  it('returns all instances that have any of multiple foreign key values', async () => {});

  it('throws error if scope is passed in and is non-empty', async () => {});

  /**************** HELPERS *****************/

  @model()
  class Product extends Entity {
    @property({id: true})
    id: number;
    @property()
    name: string;
    @property()
    categoryId: number;
  }

  class ProductRepository extends DefaultCrudRepository<
    Product,
    typeof Product.prototype.id
  > {
    constructor(dataSource: juggler.DataSource) {
      super(Product, dataSource);
    }
  }

  const testdb: juggler.DataSource = new juggler.DataSource({
    name: 'db',
    connector: 'memory',
  });
});
