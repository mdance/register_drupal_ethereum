// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import registerdrupal_artifacts from '../../build/contracts/RegisterDrupal.json'

var RegisterDrupal = contract(registerdrupal_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the RegisterDrupal abstraction for Use.
    RegisterDrupal.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      RegisterDrupal.deployed().then(function(instance) {
        document.getElementById('contract-address').innerHTML = instance.address;
        self.generateHash();

        return instance.AccountCreatedEvent();
      }).then(function(event) {
        console.log(event);

        event.watch(
          function(error, result) {
            console.log(result, 'accountCreatedEvent triggered.');

            // result will contain various information
            // including the argumets given to the Deposit
            // call.
            if (!error) {
              console.log(result);
            }
            else {
              console.log(error);
            }
          }
        );
      }).catch(function(e) {
        console.log(e);
        self.setStatus("An error occurred, see console.");
      });

    });
  },
  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },
  makeId: function() {
    var text = "";
    var possible = "ABCDEF0123456789";

    for( var i=0; i < 32; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  },
  generateHash: function() {
    var element, value;

    element = document.getElementById('hash');

    if (element) {
      value = this.makeId();

      element.value = value;
    }
  },
  registerAccount: function() {
    var self = this;

    var hash = document.getElementById("hash").value;

    this.setStatus("Registering Account... (please wait)");

    var meta;
    RegisterDrupal.deployed().then(function(instance) {
      meta = instance;
      return meta.newUser(hash, {from: account});
    }).then(function(event) {
      console.log(event);
      console.log(meta);
      self.setStatus("Account has been registered");
    }).catch(function(e) {
      console.log(event);
      console.log(meta);
      console.log(e);
      self.setStatus("Error registering account; see log.");
    });
  },
  validateAccount: function(hash) {
    if (typeof hash == 'undefined') {
      hash = document.getElementById('hash').value;
    }

    this.setStatus("Validating Account: " + hash + "... (please wait)");

    var meta;
    RegisterDrupal.deployed().then(function(instance) {
      meta = instance;
      return meta.validateUserByHash(hash, {from: account});
    }).then(function(address) {
      self.setStatus("The following account is validated: " + address);
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error validating account; see log.");
    });
  }
};

window.addEventListener(
  'load', 
  function() {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 RegisterDrupal, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
      // Use Mist/MetaMask's provider
      window.web3 = new Web3(web3.currentProvider);
    } else {
      console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    }

    App.start();
  }
);