/* =========================================
   1. GLOBAL STATE & CONSTANTS
   ========================================= */
const STORAGE_PROFILES = 'financePro_profiles';
const STORAGE_GOAL = 'financePro_goal';

let profiles = JSON.parse(localStorage.getItem(STORAGE_PROFILES)) || [{ id: 1, name: 'Personal', transactions: [], budgets: {} }];
let activeProfileId = profiles[0].id;
let goal = JSON.parse(localStorage.getItem(STORAGE_GOAL)) || { name: "Savings Goal", target: 50000 };
let goalCelebrated = false;

// --- DOM ELEMENTS ---

// Headers & Filters
const headerTitle = document.getElementById('header-title');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const categoryFilter = document.getElementById('category-filter');

// Lists & Containers
const txList = document.getElementById('tx-list');
const profileList = document.getElementById('profile-list');
const graphContainer = document.getElementById('graph-container');
const notifyContainer = document.createElement('div');
const detailedList = document.getElementById('detailed-graph-list');
const analyticsPage = document.getElementById('analytics-page');

// Balances & Dashboard Text
const netBalText = document.getElementById('net-bal');
const incBalText = document.getElementById('inc-bal');
const expBalText = document.getElementById('exp-bal');
const totalSpendTag = document.getElementById('total-spend-tag');

// Goal Elements
const goalNameText = document.getElementById('goal-name');
const goalPercText = document.getElementById('goal-percent');
const goalBarFill = document.getElementById('goal-bar');
const goalStatusText = document.getElementById('goal-status');

// Transaction Form Elements
const entryForm = document.getElementById('entry-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const editIdInput = document.getElementById('edit-id');
const eDescInput = document.getElementById('e-desc');
const eAmtInput = document.getElementById('e-amt');
const eTypeInput = document.getElementById('e-type');
const eCatInput = document.getElementById('e-cat');

// Analytics Modal Elements
const topCatName = document.getElementById('top-cat-name');
const avgSpendText = document.getElementById('avg-spend');
const survivalDaysText = document.getElementById('survival-days');
const savingsRatioText = document.getElementById('savings-ratio');

// Initialize Notifications
notifyContainer.id = 'notification-container';
document.body.appendChild(notifyContainer);

/* =========================================
   2. DATA PERSISTENCE
   ========================================= */

function save() {
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
    changeProfiles();
    changeDashboard();
}

function resetApp() { 
    if (confirm("Reset everything?")) { 
        localStorage.clear(); 
        location.reload(); 
    } 
}

/* =========================================
   3. UI UPDATES & DASHBOARD
   ========================================= */

function changeDashboard() {
    const p = profiles.find(prof => prof.id === activeProfileId);
    headerTitle.innerText = p.name;
    
    const search = searchInput.value.toLowerCase();
    const filter = filterSelect.value;
    const cat = categoryFilter.value;
    
    let totalInc = 0;
    let totalExp = 0; 
    txList.innerHTML = '';

    p.transactions.forEach(tx => { 
        const amt = parseFloat(tx.amt); 
        amt > 0 ? totalInc += amt : totalExp += Math.abs(amt); 
    });

    // Render filtered list
    p.transactions.filter(tx => 
        tx.desc.toLowerCase().includes(search) && 
        (cat === 'all' || tx.cat === cat) && 
        (filter === 'all' || (filter === 'expenditure' ? tx.amt < 0 : tx.amt > 0))
    ).reverse().forEach(tx => {
        const amt = parseFloat(tx.amt);
        txList.innerHTML += `
            <div class="tx-item">
                <div>
                    <div style="font-weight:600;">${tx.desc}</div>
                    <small class="text-muted">${tx.cat} • ${tx.date}</small>
                </div>
                <div class="tx-right">
                    <div class="${amt > 0 ? 'income-val' : 'expense-val'}">₹${Math.abs(amt).toFixed(2)}</div>
                    <div class="action-btns">
                        <button class="edit-link" onclick="editTx(${tx.id})">Edit</button>
                        <button class="delete-link" onclick="deleteTx(${tx.id})">Delete</button>
                    </div>
                </div>
            </div>`;
    });

    const netBal = totalInc - totalExp;
    netBalText.innerText = `₹${netBal.toFixed(2)}`;
    netBal < 0 ? netBalText.classList.add('negative-bal') : netBalText.classList.remove('negative-bal');
    incBalText.innerText = `₹${totalInc.toFixed(2)}`;
    expBalText.innerText = `₹${totalExp.toFixed(2)}`;

    updateSpendAnalysis(p.transactions);
    updateGoalProgress(netBal);
}

function updateSpendAnalysis(transactions) {
    const p = profiles.find(prof => prof.id === activeProfileId);
    const expenses = transactions.filter(tx => tx.amt < 0);
    const incomes = transactions.filter(tx => tx.amt > 0);

    let totalInc = incomes.reduce((sum, tx) => sum + parseFloat(tx.amt), 0);
    let totalExp = expenses.reduce((sum, tx) => sum + Math.abs(tx.amt), 0);
    let netBal = totalInc - totalExp;

    if (expenses.length === 0) {
        graphContainer.innerHTML = `<small>No data.</small>`;
        totalSpendTag.innerText = '₹0';
        if (detailedList) detailedList.innerHTML = '<small class="text-muted">Add transactions to see insights.</small>';
        topCatName.innerText = "None";
        avgSpendText.innerText = "₹0";
        survivalDaysText.innerText = "0 Days";
        savingsRatioText.innerText = "0%";
        return;
    }

    const totals = {};
    expenses.forEach(tx => { const val = Math.abs(tx.amt); totals[tx.cat] = (totals[tx.cat] || 0) + val; });
    const max = Math.max(...Object.values(totals));
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    totalSpendTag.innerText = `-₹${totalExp.toFixed(0)}`;

    // Dashboard Graph
    graphContainer.innerHTML = sorted.map(item => {
        const budget = p.budgets?.[item[0]];
        let badge = budget ? `<span class="usage-badge ${item[1] > budget ? 'expense-val' : 'income-val'}">${((item[1] / budget) * 100).toFixed(0)}%</span>` : "";
        return `<div style="margin-bottom:12px;"><div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>${item[0]}${badge}</span><span>₹${item[1].toFixed(0)}</span></div>
        <div class="bar-container"><div class="bar-fill ${budget && item[1] > budget ? 'warning' : ''}" style="width:${(item[1] / max) * 100}%"></div></div></div>`;
    }).join('');

    // Modal Metrics
    const dailyBurn = totalExp / 30;
    const survival = dailyBurn > 0 ? Math.floor(netBal / dailyBurn) : 0;
    topCatName.innerText = sorted[0][0];
    avgSpendText.innerText = "₹" + dailyBurn.toFixed(0);
    survivalDaysText.innerText = (survival < 0 ? 0 : survival) + " Days";
    savingsRatioText.innerText = totalInc > 0 ? ((netBal / totalInc) * 100).toFixed(0) + "%" : "0%";

    if (detailedList) {
        detailedList.innerHTML = sorted.map(i => {
            const share = ((i[1] / totalExp) * 100).toFixed(1);
            const budget = p.budgets?.[i[0]];
            let statusHtml = "", barClass = "safe-bar";
            if (budget) {
                const remaining = budget - i[1];
                const isOver = remaining < 0;
                barClass = isOver ? "warning" : "safe-bar";
                statusHtml = `<div class="${isOver ? 'expense-val' : 'income-val'}" style="font-size: 0.7rem; margin-top: 2px;">
                    ${isOver ? 'Over by' : 'Remaining:'} ₹${Math.abs(remaining).toFixed(0)}
                </div>`;
            }
            return `<div class="detail-row"><div style="width: 100%;"><div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><span><strong style="font-size: 0.95rem;">${i[0]}</strong><small class="text-muted" style="margin-left:8px;">${share}%</small>${statusHtml}</span><b style="font-size: 1rem;">₹${i[1].toFixed(0)}</b></div><div class="bar-container" style="margin: 5px 0 0 0; background: #1a1a1a;"><div class="bar-fill ${barClass}" style="width: ${share}%;"></div></div></div></div>`;
        }).join('');
    }
}

/* =========================================
   4. TRANSACTION ACTIONS
   ========================================= */

function editTx(id) {
    const p = profiles.find(prof => prof.id === activeProfileId);
    const tx = p.transactions.find(t => t.id === id);
    editIdInput.value = tx.id;
    eDescInput.value = tx.desc; 
    eAmtInput.value = Math.abs(tx.amt);
    eTypeInput.value = tx.amt > 0 ? 'credit' : 'debit'; 
    eCatInput.value = tx.cat;
    formTitle.innerText = "Edit Entry"; 
    submitBtn.innerText = "Update";
    cancelEditBtn.classList.remove('hidden');
}

function deleteTx(id) { 
    if (confirm("Delete?")) { 
        const p = profiles.find(prof => prof.id === activeProfileId); 
        p.transactions = p.transactions.filter(t => t.id !== id); 
        save(); 
        showNotify("Deleted."); 
    } 
}

function cancelEdit() { 
    editIdInput.value = ""; 
    entryForm.reset(); 
    formTitle.innerText = "New Entry"; 
    submitBtn.innerText = "Add Transaction"; 
    cancelEditBtn.classList.add('hidden'); 
}

function setCategoryBudget() {
    const p = profiles.find(prof => prof.id === activeProfileId);
    const cat = prompt("Category name (e.g. Food):"); if (!cat) return;
    const limit = prompt(`Monthly limit for ${cat}:`);
    if (limit && !isNaN(limit)) { 
        if (!p.budgets) p.budgets = {}; 
        p.budgets[cat] = parseFloat(limit); 
        save(); 
        showNotify("Budget Set!"); 
    }
}

/* =========================================
   5. PROFILE & GOAL MANAGEMENT
   ========================================= */

function switchProfile(id) { 
    activeProfileId = id; 
    cancelEdit(); 
    save(); 
    showNotify("Profile Switched"); 
}

function changeProfiles() { 
    profileList.innerHTML = profiles.map(p => 
        `<div class="profile-btn ${p.id === activeProfileId ? 'active' : ''}" onclick="switchProfile(${p.id})">${p.name}</div>`
    ).join(''); 
}

function addProfile() { 
    const n = prompt("Profile Name:"); 
    if (n) { 
        profiles.push({ id: Date.now(), name: n, transactions: [], budgets: {} }); 
        save(); 
    } 
}

function setNewGoal() { 
    const n = prompt("Goal Name:"), t = prompt("Target Amount:"); 
    if (n && t) { 
        goal = { name: n, target: parseFloat(t) }; 
        localStorage.setItem(STORAGE_GOAL, JSON.stringify(goal)); 
        changeDashboard(); 
    } 
}

function updateGoalProgress(bal) {
    let savings = Math.max(0, bal);
    let perc = (savings / goal.target) * 100;
    let round = Math.min(100, perc).toFixed(0);
    
    goalNameText.innerText = goal.name;
    goalPercText.innerText = `${round}%`;
    goalBarFill.style.width = `${round}%`;
    goalStatusText.innerText = `₹${savings.toFixed(0)} / ₹${goal.target}`;
    
    if (perc >= 100 && !goalCelebrated) { 
        fireConfetti(); 
        showNotify("Goal Reached! 🎉"); 
        goalCelebrated = true; 
    } else if (perc < 100) {
        goalCelebrated = false;
    }
}

/* =========================================
   6. UTILITIES (NOTIFY & VISUALS)
   ========================================= */

function showNotify(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    notifyContainer.appendChild(toast);
    setTimeout(() => { 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function fireConfetti() { 
    const end = Date.now() + 3000; 
    (function frame() { 
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } }); 
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } }); 
        if (Date.now() < end) requestAnimationFrame(frame); 
    }()); 
}

function openFullAnalytics() { analyticsPage.classList.remove('hidden'); }
function closeFullAnalytics() { analyticsPage.classList.add('hidden'); }

/* =========================================
   7. EVENT LISTENERS & INIT
   ========================================= */

entryForm.addEventListener('submit', e => {
    e.preventDefault(); 
    const p = profiles.find(prof => prof.id === activeProfileId);
    const amt = (eTypeInput.value === 'debit') ? -Math.abs(eAmtInput.value) : Math.abs(eAmtInput.value);
    const id = editIdInput.value;

    if (id) { 
        Object.assign(p.transactions.find(t => t.id == id), { 
            desc: eDescInput.value, 
            amt, 
            cat: eCatInput.value 
        }); 
        cancelEdit(); 
    } else { 
        p.transactions.push({ 
            id: Date.now(), 
            desc: eDescInput.value, 
            amt, 
            cat: eCatInput.value, 
            date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) 
        }); 
    }
    save(); 
    showNotify("Saved!");
});

searchInput.addEventListener('input', changeDashboard);

// Initial Execution
changeProfiles(); 
changeDashboard();