const DataProvider = require('../../../lib/dpp/DataProvider');

describe('DataProvider', () => {
  let contract;
  let contractId;
  let dataProvider;
  let contractCacheMock;
  let driveApiClientMock;

  beforeEach(function beforeEach() {
    contractId = '123';
    contract = {};

    contractCacheMock = {
      set: this.sinon.stub(),
      get: this.sinon.stub(),
    };

    driveApiClientMock = {
      request: this.sinon.stub(),
    };

    dataProvider = new DataProvider(driveApiClientMock, contractCacheMock);
  });

  describe('#fetchDataContract', () => {
    it('should fetch contract from cache', async () => {
      contractCacheMock.get.returns(contract);

      const actualContract = await dataProvider.fetchDataContract(contractId);

      expect(actualContract).to.equal(contract);

      expect(contractCacheMock.get).to.be.calledOnceWith(contractId);
      expect(driveApiClientMock.request).to.not.be.called();
    });

    it('should fetch contract from drive if it is not present in cache', async () => {
      driveApiClientMock.request.resolves({ result: contract });

      const actualContract = await dataProvider.fetchDataContract(contractId);

      expect(actualContract.toJSON()).to.deep.equal({
        $schema: 'https://schema.dash.org/dpp-0-4-0/meta/data-contract',
        version: 1,
        contractId: undefined,
        documents: undefined,
      });

      expect(contractCacheMock.get).to.be.calledOnceWithExactly(contractId);
      expect(driveApiClientMock.request).to.be.calledOnceWithExactly('fetchContract', { contractId });
      expect(contractCacheMock.set).to.be.calledOnceWithExactly(contractId, actualContract);
    });

    it('should throw an error if received an error from Drive with invalid code', async () => {
      const error = {
        code: 42,
        message: 'not the message you are looking for',
      };

      driveApiClientMock.request.resolves({
        error,
      });

      try {
        await dataProvider.fetchDataContract(contractId);

        expect.fail('Error was not thrown');
      } catch (e) {
        expect(e.message).to.equal(`Can\'t fetch contract: ${error.message}`);
      }
    });

    it('should return null if Drive returned invalid argument error', async () => {
      const error = {
        code: -32602, // invalid argument error
      };

      driveApiClientMock.request.resolves({
        error,
      });

      const result = await dataProvider.fetchDataContract(contractId);

      expect(result).to.be.null();
    });
  });
});
