const btclib = require("bitcore-lib");
const bchlib = require("bitcore-lib-cash");
const ltclib = require("litecore-lib");
const bsvlib = require("bsv");


function addressGenerator(coin, network = "regtest") {
  const p2pkhAddresses = p2pkhAddressGenerator(coin, network);
  const p2shAddresses = p2shAddressGenerator(coin, network);
  return [
    {
      type: "p2pkh",
      values: p2pkhAddresses
    },
    {
      type: "p2sh",
      values: p2shAddresses
    }
  ];
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
}