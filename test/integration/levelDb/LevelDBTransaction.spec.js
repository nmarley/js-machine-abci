const level = require('level-rocksdb');
const Transactions = require('level-transactions');

const LevelDBTransaction = require('../../../lib/levelDb/LevelDBTransaction');

const LevelDBTransactionIsNotStartedError = require('../../../lib/levelDb/errors/LevelDBTransactionIsNotStartedError');
const LevelDBTransactionIsAlreadyStartedError = require('../../../lib/levelDb/errors/LevelDBTransactionIsAlreadyStartedError');

describe('LevelDBTransaction', () => {
  let db;
  let levelDBTransaction;

  beforeEach(() => {
    db = level('./db/transaction-test', { valueEncoding: 'binary' });

    levelDBTransaction = new LevelDBTransaction(db);
  });

  afterEach(async () => {
    await db.clear();
    await db.close();
  });

  it('should start transaction', () => {
    levelDBTransaction.startTransaction();

    expect(levelDBTransaction.db).to.be.instanceOf(Transactions);
  });

  it('should commit transaction', async function it() {
    const commit = this.sinon.stub();
    levelDBTransaction.db = {
      commit,
    };

    const result = await levelDBTransaction.commit();

    expect(result).to.be.instanceOf(Object);
    expect(commit).to.be.calledOnce();
  });

  it('should fail if transaction was started twice', async () => {
    levelDBTransaction.startTransaction();

    try {
      levelDBTransaction.startTransaction();

      expect.fail('Should throw an LevelDBTransactionIsAlreadyStartedError error');
    } catch (e) {
      expect(e).to.be.instanceOf(LevelDBTransactionIsAlreadyStartedError);
    }
  });

  it('should fail on commit if transaction is not started', async () => {
    try {
      await levelDBTransaction.commit();

      expect.fail('Should throw an LevelDBTransactionIsNotStartedError error');
    } catch (e) {
      expect(e).to.be.instanceOf(LevelDBTransactionIsNotStartedError);
    }
  });
});
