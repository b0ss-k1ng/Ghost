const sinon = require('sinon');
const should = require('should');
const fs = require('fs-extra');
const path = require('path');
const configUtils = require('../../../utils/configUtils');
const ensureSettings = require('../../../../core/server/services/route-settings/ensure-settings');

describe('UNIT > Settings Service ensure settings:', function () {
    beforeEach(function () {
        configUtils.set('paths:contentPath', path.join(__dirname, '../../../utils/fixtures/'));
        sinon.stub(fs, 'readFile');
        sinon.stub(fs, 'copy');
    });

    afterEach(function () {
        sinon.restore();
        configUtils.restore();
    });

    describe('Ensure settings files', function () {
        it('returns yaml file from settings folder if it exists', function () {
            fs.readFile.withArgs(path.join(__dirname, '../../../utils/fixtures/settings/goodroutes.yaml'), 'utf8').resolves('content');

            return ensureSettings('goodroutes.yaml').then(() => {
                fs.readFile.callCount.should.be.eql(1);
                fs.copy.called.should.be.false();
            });
        });

        it('copies default settings file if no file found', function () {
            const expectedDefaultSettingsPath = path.join(__dirname, '../../../../core/server/services/route-settings/default-routes.yaml');
            const expectedContentPath = path.join(__dirname, '../../../utils/fixtures/settings/routes.yaml');
            const fsError = new Error('not found');
            fsError.code = 'ENOENT';

            fs.readFile.withArgs(path.join(__dirname, '../../../utils/fixtures/settings/routes.yaml'), 'utf8').rejects(fsError);
            fs.copy.withArgs(expectedDefaultSettingsPath, expectedContentPath).resolves();

            return ensureSettings('routes.yaml').then(() => {
                fs.readFile.calledOnce.should.be.true();
                fs.copy.calledOnce.should.be.true();
            });
        });

        it('rejects, if error is not a not found error', function () {
            const expectedContentPath = path.join(__dirname, '../../../utils/fixtures/settings/');
            const fsError = new Error('no permission');
            fsError.code = 'EPERM';

            fs.readFile.withArgs(path.join(__dirname, '../../../utils/fixtures/settings/routes.yaml'), 'utf8').rejects(fsError);

            return ensureSettings('routes.yaml')
                .then(() => {
                    throw new Error('Expected test to fail');
                })
                .catch((error) => {
                    should.exist(error);
                    error.message.should.be.eql(`Error trying to access settings files in ${expectedContentPath}.`);
                    fs.readFile.calledOnce.should.be.true();
                    fs.copy.called.should.be.false();
                });
        });
    });
});
