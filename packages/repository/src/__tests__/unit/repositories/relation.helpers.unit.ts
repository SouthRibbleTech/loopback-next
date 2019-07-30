import {DefaultCrudRepository, juggler} from '../../..';
import {model, property} from '../../../decorators';
import {Entity} from '../../../model';

describe('findByForeignKeys', () => {
  let productRepo: ProductRepository;

  before(() => {
    productRepo = new ProductRepository(testdb);
  });

  it('returns an empty array');
  it('pass one id and returns an more than one in the array');
  it('passing many ids returns many in the arrya');
  it('throws error if scope is passed in');

  it('', async () => {
    await productRepo.create({id: 1, categoryId: 2});
    await productRepo.create({id: 2, categoryId: 2});
    // console.log(await findByForeignKeys(productRepo, 'categoryId', [3]));
  });

  /**************** HELPERS *****************/

  @model()
  class Product extends Entity {
    @property({id: true})
    id: number;
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
