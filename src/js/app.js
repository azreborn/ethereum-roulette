/* variables */
const BET_AMOUNT =  1000000000000000000; /* 1 cth */
const GAS = 700000;
const GAS_PRICE = 2000000000;
const bets = [];
let contract;
let lastPosition = 0;
let wheelSpinCounter = 0;
let firstBetAfterSpin = true;
let web3Provider = null;
let lastBlockEvent = 0;

const betTypes = [
  'color', 'column', 'dozen',
  'eighteen', 'modulus', 'number'
];

function showWarning(msg) {
  var p = document.getElementById('warning');
  p.innerHTML = msg;
  p.style.display = 'block';
}

function init() {
  const div = document.getElementById('history');
  div.append("History: ");
}

function updateHistory(new_number) {
  if(history.length > 15) {
    history.shift();
  }
  history.pushState(new_number);

  const div = document.getElementById('history');
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }

  const p = document.createElement('p');
  p.innerHTML += "History: "
  for (var i = history.length - 1; i >= 0; i--) {
    
    if(history[i] == 0) {
      p.innerHTML += "<span class=\"greenText\">"+history[i]+"</span>&nbsp;"
    } else if ([2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35].includes(history[i])) {
      p.innerHTML += "<span class=\"blackText\">"+history[i]+"</span>&nbsp;"
    } else {
      p.innerHTML += "<span class=\"redText\">"+history[i]+"</span>&nbsp;"
    }

    if(i != 0) {
      p.innerHTML += ", ";
    }

  }
  div.appendChild(p);
}

function connectWeb3() {
  initWeb3();
}

async function initWeb3() {
  console.log("init web3");

  if (window.ethereum) {
    console.log("Meta detected");
    web3Provider = window.ethereum;
  } else {
    showWarning('You need <a href="https://metamask.io/">Metamask</a> installed and connected to cheapETH.');
  }
  const accounts = await ethereum.request({
    method: 'eth_requestAccounts'
  });
  const account = accounts[0];

  web3 = new Web3(web3Provider);
  web3.eth.getBalance(account, function (error, result) {
    if (!error) {console.log(account + ': ' + result);};
  });
  web3.eth.defaultAccount = account;
  var connected = await web3.eth.net.isListening();

  if (connected) return initContract();
  showWarning('You need <a href="https://metamask.io/">Metamask</a> installed and connected to cheapETH.');
}

async function initContract() {
  var networkID = await web3.eth.net.getId();
  $.getJSON('Roulette.json', (data) => {
    if (networkID == 777) {
      showWarning("Connected to cheapETH network.");
      address = '0x3DEDdb186d7D9ae73Da379E18A7de4Af55802b32';
    } else {
      showWarning("Switch to cheapETH network in Metamask");
      return;
    }
    const abi = data.abi;
    contract = new web3.eth.Contract(abi, address);

    updateUI();
    return initEventListeners();
  })
}

function initEventListeners() {
  const event = contract.events.RandomNumber({}, (err, res) => {
    if (res.blockNumber > lastBlockEvent) {
      const oneRandomNumber = Number(res.returnValues.number);
      wheelSpinCounter += 1;
      var wheel = document.getElementById("wheel");
      wheel.style.transform = "rotate(" + lastPosition + "deg)";
      var numbers = [
        0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27,
        13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1,
        20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
      ];
      var numberDegree = numbers.indexOf(oneRandomNumber) * 360 / numbers.length;
      var numRoundBefore = 3 * wheelSpinCounter;
      var totalDegrees = (numRoundBefore * 360) + numberDegree;
      document.getElementById("wheel").style.transform = "rotate(-" + totalDegrees + "deg)";
      lastPosition = numberDegree;
      setTimeout(function() {
        showBestStatus(oneRandomNumber);
      }, 2000);
      firstBetAfterSpin = true;
      lastBlockEvent = res.blockNumber;
      updateHistory(oneRandomNumber);
    }
  })
}

function showError(msg, err) {
  console.log(err);
  const p = document.getElementById('errorPanel');
  p.innertext = msg;
  setTimeout(function() {
    p.innerHTML = '&nbsp;';
  }, 4000);
}

function hideBets() {
  var div = document.getElementById('betsList');
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
}

function CleanBets() {
  bets.length = 0;
  hideBets();
}

async function placeBet() {
  let area = this.id;
  let bet = {};
  if (/^c\_\d/.test(area)) bet = {type: 0, value: parseInt(area.substr(2))};
  if (/^p\_\d/.test(area)) bet = {type: 1, value: parseInt(area.substr(2))};
  if (/^d\_\d/.test(area)) bet = {type: 2, value: parseInt(area.substr(2))};
  if (/^e\_\d/.test(area)) bet = {type: 3, value: parseInt(area.substr(2))};
  if (/^m\_\d/.test(area)) bet = {type: 4, value: parseInt(area.substr(2))};
  if (/^n\d\d/.test(area)) bet = {type: 5, value: parseInt(area.substr(1))};
  if (bet.hasOwnProperty('type') && bet.hasOwnProperty('value')) {
    const options = {from: web3.eth.defaultAccount, value:BET_AMOUNT, gas:GAS, gasPrice:GAS_PRICE};
    contract.methods.bet(bet.value, bet.type).send(options, (err, res) => {
      if (err) return void showError('not enough money in the bank', err);
      pushBet(bet);
    });
  }
}

function pushBet(hash) {
  if (firstBetAfterSpin) CleanBets();
  firstBetAfterSpin = false;
  bets.push(hash);
  printBet(hash);
}

function printBet(hash) {
  const labelForNum = {
    color: {
      0: 'black',
      1: 'red'
    },
    column: {
      0: 'left',
      1: 'middle',
      2: 'right'
    },
    dozen: {
      0: '1st',
      1: '2nd',
      2: '3rd'
    },
    eighteen: {
      0: '1-18',
      1: '19-36'
    },
    modulus: {
      0: 'even',
      1: 'odd'
    }
  }
  const type = betTypes[hash.type];
  const value = type === 'number' ? hash.value : labelForNum[type][hash.value];
  const div = document.getElementById('betsList');
  const p = document.createElement('p');
  p.innerText = type + ' ' + value + ' ';
  if (hash.hasOwnProperty('status')) {
    p.innerText += (hash.status ? 'WIN' : 'LOST');
  }
  div.appendChild(p);
}

function showBetsStatus(num) {
  hideBets();
  bets.map(function(bet) {
    if (num === 0) {
      bet.status = (bet.type === 5 && bet.value === 0);            // bet on 0
    } else {
      if (bet.type === 5) {                                        // bet on number
        bet.status = (bet.value === num);
      }
      if (bet.type === 4) {                                        // bet on modulus
        if (bet.value === 0) bet.status = (num % 2 === 0);
        if (bet.value === 1) bet.status = (num % 2 === 1);
      }
      if (bet.type === 3) {                                        // bet on eighteen
        if (bet.value === 0) bet.status = (num <= 18);
        if (bet.value === 1) bet.status = (num >= 19);
      }
      if (bet.type === 2) {                                        // bet on dozen
        if (bet.value === 0) bet.status = (num <= 12);
        if (bet.value === 1) bet.status = (num >= 13 && num <= 24);
        if (bet.value === 2) bet.status = (num >= 25);
      }
      if (bet.type === 1) {                                        // bet on column
        if (bet.value === 0) bet.status = (num % 3 === 1);
        if (bet.value === 1) bet.status = (num % 3 === 2);
        if (bet.value === 2) bet.status = (num % 3 === 0);
      }
      if (bet.type === 0) {                                        // bet on color
        if (num <= 10 || (num >= 20 && num <= 28)) {
          if (bet.value === 0) bet.status = (num % 2 === 0)
          if (bet.value === 1) bet.status = (num % 2 === 1)
        } else {
          if (bet.value === 0) bet.status = (num % 2 === 1)
          if (bet.value === 1) bet.status = (num % 2 === 0)
        }
      }
    }
    printBet(bet);
  })
}

function spinWheel() {

  contract.methods.spinWheel().send({from: web3.eth.defaultAccount, value:0, gas:GAS, gasPrice:GAS_PRICE}, (function (err, res)  {
    if (err) return void showError('to soon to play?', err);
    firstBetAfterSpin = true;
  }));
}

function cashOut() {
  contract.methods.cashOut().send({from: web3.eth.defaultAccount, value:0, gas:GAS, gasPrice:GAS_PRICE}, (err, res) => {
    if (err) return void showError('something went wrong with cashOut', err);
  });
}

function toEther(bigNum) {
  return (bigNum / 1000000000000000000).toFixed(2)
}

function updateHTML(value, elId) {
  const span = document.getElementById(elId);
  span.innerText = value;
}

/* call smart contract to get status and update UI */
function getStatus() {

  contract.methods.getStatus().call(function (err, res)  {
    if (err) return void showError('something went wrong with getStatus', err);
    let aux = res;
    // let aux = res.map(x => x.toNumber());
    updateHTML(aux[0],'betsCount');                             // bets count
    aux[1] = toEther(aux[1]);                                   // bets value
    updateHTML(aux[1],'betsValue');
    const now = Math.round(new Date() / 1000);                  // time until next spin
    aux[2] = aux[2] < now ? 0 : (aux[2] - now);
    updateHTML(aux[2],'timeUntilNextSpin');
    aux[3] = toEther(aux[3]);                                   // roulette balance
    updateHTML(aux[3],'balance');
    aux[4] = toEther(aux[4]);                                   // winnings
    updateHTML(aux[4],'winnings');
    web3.eth.getBalance(web3.eth.defaultAccount, (err, balance) => {  // player balance
      balance = toEther(balance);
      updateHTML(balance, 'yourBalance');
    });

    if(aux[2] <= 0) {
      updateHTML('NO MORE BETS. Spin requested','userHelp');
    } else {
      updateHTML('Make bets!','userHelp');
    }
    // userHelp
  });
}

/* every second query smart contract for status */
function updateUI() {
  setInterval(function () {
    getStatus();
  }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
  /* adds click event to roulette table */
  var areas = document.getElementsByTagName('area');
  for (i=0; i<areas.length; i++) {
    areas[i].onclick = placeBet;
  };
  init();
})
