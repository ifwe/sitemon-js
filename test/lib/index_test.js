/*jshint expr: true*/
var Sitemon = require(LIB_DIR);
var dgram = require('dgram');
var Promise = require('bluebird');

describe('Sitemon', function() {
    beforeEach(function() {
        this.client = {
            send: function() {
                throw new Error("UDP client.send was not stubbed!");
            }
        };

        sinon.stub(dgram, 'createSocket')
        .returns(this.client);
    });

    afterEach(function() {
        dgram.createSocket.restore();
    });

    it('exists', function() {
        Sitemon.should.exist;
    });

    describe('single host', function() {
        beforeEach(function() {
            this.sitemon = new Sitemon('test', '1.2.3.4:5678');
            sinon.stub(this.client, 'send').callsArgWith(5, null); // no error
        });

        it('sends data as formatted buffer', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[0].should.be.an.instanceOf(Buffer);
                this.client.send.lastCall.args[0].toString().should.equal('table=test\nk.foo=test_foo\nk.bar=test_bar\nv.calls=1');
            }.bind(this));
        });

        it('sends with offset 0', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[1].should.equal(0);
            }.bind(this));
        });

        it('sends with length', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[2].should.equal(50); // based on formatted message
            }.bind(this));
        });

        it('sends udp packet to target port', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[3].should.equal(5678);
            }.bind(this));
        });

        it('sends udp packet to target host', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[4].should.equal('1.2.3.4');
            }.bind(this));
        });

        it('rejects promise if unable to send udp packet', function() {
            this.client.send.callsArgWith(5, 'some error');
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                return Promise.reject("Unexpected resolve");
            }).catch(function(error) {
                error.should.equal('some error');
            });
        });
    });

    describe('multiple hosts', function() {
        beforeEach(function() {
            this.sitemon = new Sitemon('test', ['1.2.3.4:5678', '2.3.4.5:6789', '3.4.5.6:7890']);
            sinon.stub(this.client, 'send').callsArgWith(5, null); // no error
        });

        it('sends data as formatted buffer', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[0].should.be.an.instanceOf(Buffer);
                this.client.send.lastCall.args[0].toString().should.equal('table=test\nk.foo=test_foo\nk.bar=test_bar\nv.calls=1');
            }.bind(this));
        });

        it('sends with offset 0', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[1].should.equal(0);
            }.bind(this));
        });

        it('sends with length', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[2].should.equal(50); // based on formatted message
            }.bind(this));
        });

        it('sends first udp packet to first host/port pair', function() {
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.lastCall.args[3].should.equal(5678);
                this.client.send.lastCall.args[4].should.equal('1.2.3.4');
            }.bind(this));
        });

        it('sends each udp packet to a host/port pair in a round-robin fashion', function() {
            return Promise.all([
                this.sitemon.send({foo: 'test_foo'}, {calls: 1}),
                this.sitemon.send({foo: 'test_foo'}, {calls: 1}),
                this.sitemon.send({foo: 'test_foo'}, {calls: 1}),
                this.sitemon.send({foo: 'test_foo'}, {calls: 1}),
                this.sitemon.send({foo: 'test_foo'}, {calls: 1})
            ]).then(function() {
                this.client.send.called.should.be.true;
                this.client.send.getCall(0).args[3].should.equal(5678);
                this.client.send.getCall(0).args[4].should.equal('1.2.3.4');

                this.client.send.getCall(1).args[3].should.equal(6789);
                this.client.send.getCall(1).args[4].should.equal('2.3.4.5');

                this.client.send.getCall(2).args[3].should.equal(7890);
                this.client.send.getCall(2).args[4].should.equal('3.4.5.6');

                this.client.send.getCall(3).args[3].should.equal(5678);
                this.client.send.getCall(3).args[4].should.equal('1.2.3.4');

                this.client.send.getCall(4).args[3].should.equal(6789);
                this.client.send.getCall(4).args[4].should.equal('2.3.4.5');
            }.bind(this));
        });

        it('rejects promise if unable to send udp packet', function() {
            this.client.send.callsArgWith(5, 'some error');
            return this.sitemon.send({
                foo: 'test_foo',
                bar: 'test_bar'
            }, {calls: 1}).then(function() {
                return Promise.reject("Unexpected resolve");
            }).catch(function(error) {
                error.should.equal('some error');
            });
        });
    });
});
