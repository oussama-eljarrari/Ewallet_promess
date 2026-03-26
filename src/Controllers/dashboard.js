import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "../Model/database.js";
const user = JSON.parse(sessionStorage.getItem("currentUser"));
// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", handleTransfersection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer)


// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter(t => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter(t => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard() {
  const dashboardData = getDashboardData();
  if (dashboardData) {
    greetingName.textContent = dashboardData.userName;
    currentDate.textContent = dashboardData.currentDate;
    solde.textContent = dashboardData.availableBalance;
    incomeElement.textContent = dashboardData.monthlyIncome;
    expensesElement.textContent = dashboardData.monthlyExpenses;
    activecards.textContent = dashboardData.activeCards;
  }
  // Display transactions
  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach(transaction => {
    const transactionItem = document.createElement("div");
    transactionItem.className = "transaction-item";
    transactionItem.innerHTML = `
    <div>${transaction.date}</div>
    <div>${transaction.amount} MAD</div>
    <div class="transaction-type ${transaction.type}">${transaction.type}</div>
    <div class="transaction-status ${transaction.status}">${transaction.status}</div>`;

    transactionsList.appendChild(transactionItem);
  });

}
renderDashboard();

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();
function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + "****" + card.numcards;
    sourceCard.appendChild(option);
  });
}

renderCards();

function isCardExpired(expiry) {
  const [year, month] = String(expiry).split("-").map(Number);
  if (!year || !month) return true;


  const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);
  return new Date() > expiryDate;
}

function checkCardNotExpired(card) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isCardExpired(card.expiry)) {
        reject(new Error("Carte expirée"));
      } else {
        resolve(card);
      }
    }, 200);
  });
}

//###################################  Transfer  #####################################################//

// check function 

/* function checkUser(numcompte, callback) {
  setTimeout(() => {
    const destinataire = finduserbyaccount(numcompte);
    if (destinataire) {
      callback(destinataire);
    } else {
      console.log("Destinataire non trouvé");
    }
  }, 500);
}

function checkSolde(exp, amount, callback) {
  setTimeout(() => {
    const solde = exp.wallet.balance;
    if (solde >= amount) {
      callback("Solde suffisant");
    } else {
      callback("Solde insuffisant");
    }
  }, 400);
}

function updateSolde(exp, destinataire, amount, callback) {
  setTimeout(() => {  
    exp.wallet.balance -= amount;
    destinataire.wallet.balance += amount;
    callback("Solde mis à jour");
  }, 300);
}


function addtransactions(exp, destinataire, amount, callback) {
  setTimeout(() => { 
    // Transaction pour l'expéditeur (débit)
    const transactionDebit = {
      id: Date.now(),
      type: "debit",
      amount: amount,
      from: exp.name,
      to: destinataire.name,
      date: new Date().toLocaleDateString()
    };

    // Transaction pour le destinataire (crédit)
    const transactionCredit = {
      id: Date.now() + 1,
      type: "credit",
      amount: amount,
      from: exp.name,
      to: destinataire.name,
      date: new Date().toLocaleDateString()
    };

    user.wallet.transactions.push(transactionDebit);
    destinataire.wallet.transactions.push(transactionCredit);
    renderDashboard();
    callback("Transaction enregistrée");
  }, 200);
}


export function transferer(exp, numcompte, amount) {
  console.log("\n DÉBUT DU TRANSFERT ");

  // Étape 1: Vérifier le destinataire
  checkUser(numcompte, function afterCheckUser(destinataire) {
    console.log("Étape 1: Destinataire trouvé -", destinataire.name);

    // Étape 2: Vérifier le solde
    checkSolde(exp, amount, function afterCheckSolde(soldemessage) {
      console.log(" Étape 2:", soldemessage);

      if (soldemessage.includes("Solde suffisant")) {
        // Étape 3: Mettre à jour les soldes
        updateSolde(exp, destinataire, amount, function afterUpdateSolde(updatemessage) {
          console.log(" Étape 3:", updatemessage);

          // Étape 4: Enregistrer la transaction
          addtransactions(exp, destinataire, amount, function afterAddTransactions(transactionMessage) {
            console.log(" Étape 4:", transactionMessage);
            console.log(`Transfert de ${amount} réussi!`);
          });
        });
      }
    });
  });
}


function handleTransfer(e) {
 e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount=findbeneficiarieByid(user.id,beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

  
  transferer(user, beneficiaryAccount, amount);

} */

// ── Fonctions wrappees en Promise ──────────────────────────────────────

function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const beneficiary = finduserbyaccount(numcompte);
      if (beneficiary) {
        resolve(beneficiary);
      } else {
        reject(new Error("Beneficiary not found"));
      }
    }, 2000);
  });
}

function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (expediteur.wallet.balance > amount) {
        resolve("Sufficient balance");
      } else {
        reject(new Error("Insufficient balance"));
      }
    }, 3000);
  });
}

function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve({ expediteur, destinataire });
    }, 200);
  });
}

function addTransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toLocaleString();

      const credit = {
        id: Date.now(),
        type: "credit",
        amount,
        date: now,
        from: expediteur.name,
      };
      const debit = {
        id: Date.now(),
        type: "debit",
        amount,
        date: now,
        to: destinataire.name,
      };

      destinataire.wallet.transactions.push(debit);
      expediteur.wallet.transactions.push(credit);

      resolve("Transaction added successfully");
    }, 3000);
  });
}

function findTransferCard(expediteur, sourceCardNum) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = expediteur.wallet.cards.find((c) => c.numcards === sourceCardNum);
      if (card) {
        resolve(card);
      } else {
        reject(new Error("Carte source introuvable"));
      }
    }, 300);
  });
}



function transfer(expediteur, numcompte, amount, sourceCardNum) {
  let _destinataire;

  return checkUser(numcompte) //p0
    .then((destinataire) => { //p1
      console.log("Étape 1 : Destinataire trouvé —", destinataire.name);
      _destinataire = destinataire;
      return findTransferCard(expediteur, sourceCardNum); //p2
    })
    .then((card) => {
      console.log("Étape 2 : Carte source trouvée —", card.type, card.numcards);
      return checkCardNotExpired(card); //p3
    })
    .then(() => {
      console.log("Étape 3 : Carte valide (non expirée)");
      return checkSolde(expediteur, amount);//p4
    })
    .then((message) => {
      console.log("Étape 4 :", message);
      return updateSolde(expediteur, _destinataire, amount);
    })
    .then(({ expediteur: exp, destinataire: dest }) => {
      console.log("Étape 5 : Soldes mis à jour");
      return addTransactions(exp, dest, amount);
    })
    .then((message) => {
      console.log("Étape 6 :", message);
      renderDashboard();
    })
    .catch((err) => {
      console.error("Erreur lors du transfert :", err.message);
    });
}



function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const sourceCardNum = document.getElementById("sourceCard").value;

  const amount = Number(document.getElementById("amount").value);

  transfer(user, beneficiaryAccount, amount, sourceCardNum);

}

//---------------recharge------------------//

const rechargeBtn = document.getElementById("quickTopup");
const rechargeSection = document.getElementById("rechargePopup");
const closeRechargeBtn = document.getElementById("closeRechargeBtn");
const cancelRechargeBtn = document.getElementById("cancelRechargeBtn");
const submitRechargeBtn = document.getElementById("submitRechargeBtn");

rechargeBtn.addEventListener("click", handleRechargeSection);
closeRechargeBtn.addEventListener("click", closeRecharge);
cancelRechargeBtn.addEventListener("click", closeRecharge);
submitRechargeBtn.addEventListener("click", handleRecharge);

function handleRechargeSection() {
  rechargeSection.classList.add("active");
  document.body.classList.add("popup-open");
}

function closeRecharge() {
  rechargeSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

// ── Remplir le select des cartes ──────────────────────────────────────
const rechargeSourceCard = document.getElementById("rechargeSourceCard");
function renderRechargeCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + "****" + card.numcards;
    rechargeSourceCard.appendChild(option);
  });
}
renderRechargeCards();

// ── Étape 0 : Vérifier l'utilisateur ─────────────────────────────────
function checkRechargeUser() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (user && user.id) {
        resolve(user);
      } else {
        reject(new Error("Utilisateur non connecté"));
      }
    }, 200);
  });
}


// ── Étape 1 : Valider le montant ──────────────────────────────────────
function validateRechargeAmount(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isNaN(amount) || amount <= 0) {
        reject(new Error("Montant invalide"));
      } else if (amount < 10) {
        reject(new Error("Montant minimum : 10 MAD"));
      } else if (amount > 5000) {
        reject(new Error("Montant maximum : 5000 MAD"));
      } else {
        resolve(amount);
      }
    }, 500);
  });
}

// ── Étape 2 : Vérifier que la carte existe ────────────────────────────
function findRechargeCard(sourceCardNum) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const card = user.wallet.cards.find(c => c.numcards === sourceCardNum);
      if (card) {
        resolve(card);
      } else {
        reject(new Error("Carte introuvable"));
      }
    }, 1000);
  });
}

// ── etape 3 : Mettre à jour les soldes ───────────────────────────────
function updateRechargeBalance(card, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      user.wallet.balance += amount;
      card.balance += amount;
      resolve({ card, amount });
    }, 200);
  });
}

// ── etape 4 : Enregistrer la transaction ─────────────────────────────
function addRechargeTransaction(card, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const transaction = {
        id: Date.now(),
        type: "recharge",
        status: "success",
        amount: amount,
        date: new Date().toLocaleString(),
        from: card.type + "****" + card.numcards,
      };
      user.wallet.transactions.push(transaction);
      resolve("Recharge enregistrée avec succès");
    }, 1000);
  });
}

function addRechargeFailedTransaction(sourceCardNum, amount, reason) {
  const transaction = {
    id: Date.now(),
    type: "recharge",
    status: "failed",
    amount: Number(amount) || 0,
    date: new Date().toLocaleString(),
    from: sourceCardNum || "unknown-card",
    reason,
  };

  user.wallet.transactions.push(transaction);
}





// ── Chaine principale ─────────────────────────────────────────────────
function recharge(sourceCardNum, amount) {

  return checkRechargeUser()                                // Étape 0
    .then((currentUser) => {
      console.log("Étape 0 : Utilisateur vérifié —", currentUser.name);
      return validateRechargeAmount(amount);                // Étape 1
    })
    .then((validAmount) => {
      console.log("Étape 1 : Montant valide —", validAmount, "MAD");
      return findRechargeCard(sourceCardNum);               // Étape 2
    })
    .then((card) => {
      console.log("Étape 2 : Carte trouvée —", card.type, card.numcards);
      return checkCardNotExpired(card);                     // Étape 3
    })
    .then((card) => {
      console.log("Étape 3 : Carte valide (non expirée)");
      return updateRechargeBalance(card, amount);           // Étape 4
    })
    .then(({ card, amount }) => {
      console.log("Étape 4 : Soldes mis à jour");
      return addRechargeTransaction(card, amount);          // Étape 5
    })
    .then((message) => {
      console.log("Étape 5 :", message);
      renderDashboard();
      alert(message);
      closeRecharge();
    })
    .catch((err) => {
      addRechargeFailedTransaction(sourceCardNum, amount, err.message);
      renderDashboard();
      console.error("Erreur lors de la recharge :", err.message);
      alert(err.message);
    });
}

// ── Handler du formulaire ─────────────────────────────────────────────
function handleRecharge(e) {
  e.preventDefault();
  const sourceCardNum = document.getElementById("rechargeSourceCard").value;
  const amount = Number(document.getElementById("rechargeAmount").value);
  closeRecharge();

  recharge(sourceCardNum, amount);
}