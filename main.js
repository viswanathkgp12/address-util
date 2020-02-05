const btclib = require("bitcore-lib");
const bchlib = require("bitcore-lib-cash");
const ltclib = require("litecore-lib");
const bsvlib = require("bsv");

const bitcoin = require("bitcoinjs-lib");

function addressGenerator(coin, network = "regtest") {
  const p2pkhAddresses = p2pkhAddressGenerator(coin, network);
  const p2shAddresses = p2shAddressGenerator(coin, network);

  const result = [
    {
      type: "p2pkh",
      values: p2pkhAddresses
    },
    {
      type: "p2sh",
      values: p2shAddresses
    }
  ];
  if (coin === "btc") {
    result.push(
      {
        type: "p2wpkh",
        values: p2wpkhAddressBTC(network)
      },
      {
        type: "p2wsh",
        values: p2wshAddressBTC(network)
      }
    );
  }
  return result;
}

function p2pkhAddressGenerator(coin, network = "regtest") {
  const bitcore = chooseModule(coin);
  const privateKey = bitcore.PrivateKey();
  const address = privateKey.toAddress(network);
  return getPossibleAddressFormats(coin, address);
}

function p2shAddressGenerator(coin, network = "regtest") {
  const bitcore = chooseModule(coin);
  const privateKeys = [bitcore.PrivateKey(), bitcore.PrivateKey()];
  const publicKeys = privateKeys.map(bitcore.PublicKey);
  const address = new bitcore.Address(publicKeys, 2, network);
  return getPossibleAddressFormats(coin, address);
}

/**
 **********************************************
 * Segwit related
 **********************************************
 */
function p2wpkhAddressBTC(network = "regtest") {
  const btcNetworkObject = segwitNetworkSelection(network);
  const keyPair = bitcoin.ECPair.makeRandom();
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network: btcNetworkObject
  });
  return [address.toString()];
}

function p2wshAddressBTC(network = "regtest") {
  const btcNetworkObject = segwitNetworkSelection(network);
  const pubkeys = [];
  for (let i = 0; i < 3; i++) {
    const keyPair = bitcoin.ECPair.makeRandom();
    pubkeys.push(keyPair.publicKey);
  }
  const { address } = bitcoin.payments.p2wsh({
    redeem: bitcoin.payments.p2ms({ m: 3, pubkeys, network: btcNetworkObject })
  });
  return [address.toString()];
}

function segwitNetworkSelection(network) {
  let btcNetworkObject;
  switch (network) {
    case "livenet":
      btcNetworkObject = bitcoin.networks.bitcoin;
      break;
    case "testnet":
      btcNetworkObject = bitcoin.networks.testnet;
      break;
    case "regtest":
      btcNetworkObject = bitcoin.networks.regtest;
      break;
    default:
      btcNetworkObject = bitcoin.networks.bitcoin;
  }
  return btcNetworkObject;
}
// End Segwit specific

function getPossibleAddressFormats(coin, address) {
  switch (coin) {
    case "btc":
    case "ltc":
    case "bsv":
      return [address.toString()];
    case "bch":
      const cashAddress = address.toString();
      const legacyAddress = address.toLegacyAddress().toString();

      const cashAddressWithoutNetworkPrefix = cashAddress.split(":")[1];

      return [cashAddressWithoutNetworkPrefix, cashAddress, legacyAddress];
    default:
      return [];
  }
}

function chooseModule(coin) {
  switch (coin) {
    case "btc":
      return btclib;
    case "bch":
      return bchlib;
    case "bsv":
      return bsvlib;
    case "ltc":
      return ltclib;
    default:
      return btclib;
  }
}

function validateAddress(address, coin, network) {
  // Special Case
  if (coin === "bsv" && network === "regtest") {
    network = "testnet";
  }
  const bitcore = chooseModule(coin);
  return bitcore.Address.isValid(address, network);
}

module.exports = {
  addressGenerator,
  validateAddress
};