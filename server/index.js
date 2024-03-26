const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");
const { utf8ToBytes } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "028fa9c879c52420a89b29bd485a7dc5de1b9be879dc01775f4e060fa1b328a10b": 100,
  "027cba71193cf1181ba6eb38bc17566fc35631c653348592d9a250e41352438755": 50,
  "031b296165808abb67bd0e95d26ef9f9593e34c7d0e195909ffc36c1f5e070906b": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { message, signature, recoveryBit} = req.body;

  const { amount, recipient } = message;
  // TODO: get a signature from the client application
  // recover the public key from the signature

  const sign = (secp.secp256k1.Signature.fromCompact(signature)).addRecoveryBit(recoveryBit);
  const hashMessage = keccak256(utf8ToBytes(JSON.stringify(message)));
  const sender = sign.recoverPublicKey(hashMessage).toHex();

  setInitialBalance(sender);
  setInitialBalance(recipient);

  console.log("Sender", sender);
  console.log("Recipient", recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
