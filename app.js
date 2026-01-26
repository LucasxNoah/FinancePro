let profiles = JSON.parse(localStorage.getItem('financePro_profiles')) || [{ id: 1, name: 'Personal', transactions: [], budgets: {} }];
let activeProfileId = profiles[0].id;
let goal = JSON.parse(localStorage.getItem('financePro_goal')) || { name: "Savings Goal", target: 50000 };
let goalCelebrated = false;

// Notifications Container
const notifyContainer = document.createElement('div');
notifyContainer.id = 'notification-container';
document.body.appendChild(notifyContainer);

function showNotify(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = msg;
    notifyContainer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

const headerTitle = document.getElementById('header-title'), txList = document.getElementById('tx-list'), searchInput = document.getElementById('search-input'), filterSelect = document.getElementById('filter-select'), categoryFilter = document.getElementById('category-filter'), profileList = document.getElementById('profile-list');
const netBalText = document.getElementById('net-bal'), incBalText = document.getElementById('inc-bal'), expBalText = document.getElementById('exp-bal'), graphContainer = document.getElementById('graph-container'), totalSpendTag = document.getElementById('total-spend-tag');

function save() { 
    localStorage.setItem('financePro_profiles', JSON.stringify(profiles)); 
    changeProfiles(); 
    changeDashboard(); 
}

function changeDashboard() {
    const p = profiles.find(prof => prof.id === activeProfileId);
    headerTitle.innerText = p.name;
    const search = searchInput.value.toLowerCase(), filter = filterSelect.value, cat = categoryFilter.value;
    let totalInc = 0, totalExp = 0; txList.innerHTML = '';

    p.transactions.forEach(tx => { const amt = parseFloat(tx.amt); amt > 0 ? totalInc += amt : totalExp += Math.abs(amt); });

    p.transactions.filter(tx => tx.desc.toLowerCase().includes(search) && (cat === 'all' || tx.cat === cat) && (filter === 'all' || (filter === 'expenditure' ? tx.amt < 0 : tx.amt > 0)))
    .reverse().forEach(tx => {
        const amt = parseFloat(tx.amt);
        txList.innerHTML += `<div class="tx-item"><div><div style="font-weight:600;">${tx.desc}</div><small class="text-muted">${tx.cat} • ${tx.date}</small></div>
        <div class="tx-right"><div class="${amt > 0 ? 'income-val' : 'expense-val'}">₹${Math.abs(amt).toFixed(2)}</div>
        <div class="action-btns"><button class="edit-link" onclick="editTx(${tx.id})">Edit</button><button class="delete-link" onclick="deleteTx(${tx.id})">Delete</button></div></div></div>`;
    });

    const netBal = totalInc - totalExp;
    netBalText.innerText = `₹${netBal.toFixed(2)}`;
    netBal < 0 ? netBalText.classList.add('negative-bal') : netBalText.classList.remove('negative-bal');
    incBalText.innerText = `₹${totalInc.toFixed(2)}`;
    expBalText.innerText = `₹${totalExp.toFixed(2)}`;
    
    // Updated: This now refreshes both Dashboard AND Modal insights
    updateSpendAnalysis(p.transactions);
    updateGoalProgress(netBal);
}

function updateSpendAnalysis(transactions) {
    const p = profiles.find(prof => prof.id === activeProfileId);
    const expenses = transactions.filter(tx => tx.amt < 0);
    const incomes = transactions.filter(tx => tx.amt > 0);
    const detailedList = document.getElementById('detailed-graph-list');
    
    let totalInc = incomes.reduce((sum, tx) => sum + parseFloat(tx.amt), 0);
    let totalExp = expenses.reduce((sum, tx) => sum + Math.abs(tx.amt), 0);
    let netBal = totalInc - totalExp;

    // Reset UI if no data
    if (expenses.length === 0) { 
        graphContainer.innerHTML = `<small>No data.</small>`; 
        totalSpendTag.innerText = '₹0';
        if(detailedList) detailedList.innerHTML = '<small class="text-muted">Add transactions to see insights.</small>';
        document.getElementById('top-cat-name').innerText = "None";
        document.getElementById('avg-spend').innerText = "₹0";
        document.getElementById('survival-days').innerText = "0 Days";
        document.getElementById('savings-ratio').innerText = "0%";
        return; 
    }

    const totals = {}; 
    expenses.forEach(tx => { const val = Math.abs(tx.amt); totals[tx.cat] = (totals[tx.cat] || 0) + val; });
    const max = Math.max(...Object.values(totals));
    const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]);

    totalSpendTag.innerText = `-₹${totalExp.toFixed(0)}`;
    
    // Update Dashboard Graph
    graphContainer.innerHTML = sorted.map(item => {
        const budget = p.budgets?.[item[0]];
        let badge = budget ? `<span class="usage-badge ${item[1] > budget ? 'expense-val' : 'income-val'}">${((item[1]/budget)*100).toFixed(0)}%</span>` : "";
        return `<div style="margin-bottom:12px;"><div style="display:flex; justify-content:space-between; font-size:0.8rem;"><span>${item[0]}${badge}</span><span>₹${item[1].toFixed(0)}</span></div>
        <div class="bar-container"><div class="bar-fill ${budget && item[1] > budget ? 'warning' : ''}" style="width:${(item[1]/max)*100}%"></div></div></div>`;
    }).join('');

    // Dynamic Modal Update
    const dailyBurn = totalExp / 30;
    const survival = dailyBurn > 0 ? Math.floor(netBal / dailyBurn) : 0;
    document.getElementById('top-cat-name').innerText = sorted[0][0];
    document.getElementById('avg-spend').innerText = "₹" + dailyBurn.toFixed(0);
    document.getElementById('survival-days').innerText = (survival < 0 ? 0 : survival) + " Days";
    document.getElementById('savings-ratio').innerText = totalInc > 0 ? ((netBal/totalInc)*100).toFixed(0) + "%" : "0%";

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

            return `
                <div class="detail-row">
                    <div style="width: 100%;">
                        <div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                            <span>
                                <strong style="font-size: 0.95rem;">${i[0]}</strong> 
                                <small class="text-muted" style="margin-left:8px;">${share}%</small>
                                ${statusHtml}
                            </span>
                            <b style="font-size: 1rem;">₹${i[1].toFixed(0)}</b>
                        </div>
                        <div class="bar-container" style="margin: 5px 0 0 0; background: #1a1a1a;">
                            <div class="bar-fill ${barClass}" style="width: ${share}%;"></div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }
}

function updateGoalProgress(bal) {
    let savings = Math.max(0, bal), perc = (savings / goal.target) * 100, round = Math.min(100, perc).toFixed(0);
    document.getElementById('goal-name').innerText = goal.name;
    document.getElementById('goal-percent').innerText = `${round}%`;
    document.getElementById('goal-bar').style.width = `${round}%`;
    document.getElementById('goal-status').innerText = `₹${savings.toFixed(0)} / ₹${goal.target}`;
    if (perc >= 100 && !goalCelebrated) { fireConfetti(); showNotify("Goal Reached! 🎉"); goalCelebrated = true; } else if (perc < 100) goalCelebrated = false;
}

function setCategoryBudget() {
    const p = profiles.find(prof => prof.id === activeProfileId);
    const cat = prompt("Category name (e.g. Food):"); if (!cat) return;
    const limit = prompt(`Monthly limit for ${cat}:`);
    if (limit && !isNaN(limit)) { if (!p.budgets) p.budgets = {}; p.budgets[cat] = parseFloat(limit); save(); showNotify("Budget Set!"); }
}

function editTx(id) {
    const p = profiles.find(prof => prof.id === activeProfileId), tx = p.transactions.find(t => t.id === id);
    document.getElementById('edit-id').value = tx.id;
    document.getElementById('e-desc').value = tx.desc; document.getElementById('e-amt').value = Math.abs(tx.amt);
    document.getElementById('e-type').value = tx.amt > 0 ? 'credit' : 'debit'; document.getElementById('e-cat').value = tx.cat;
    document.getElementById('form-title').innerText = "Edit Entry"; document.getElementById('submit-btn').innerText = "Update";
    document.getElementById('cancel-edit').classList.remove('hidden');
}

function deleteTx(id) { if (confirm("Delete?")) { const p = profiles.find(prof => prof.id === activeProfileId); p.transactions = p.transactions.filter(t => t.id !== id); save(); showNotify("Deleted."); } }
function cancelEdit() { document.getElementById('edit-id').value = ""; document.getElementById('entry-form').reset(); document.getElementById('form-title').innerText = "New Entry"; document.getElementById('submit-btn').innerText = "Add Transaction"; document.getElementById('cancel-edit').classList.add('hidden'); }
function switchProfile(id) { activeProfileId = id; cancelEdit(); save(); showNotify("Profile Switched"); }
function changeProfiles() { profileList.innerHTML = profiles.map(p => `<div class="profile-btn ${p.id === activeProfileId ? 'active' : ''}" onclick="switchProfile(${p.id})">${p.name}</div>`).join(''); }
function addProfile() { const n = prompt("Profile Name:"); if (n) { profiles.push({ id: Date.now(), name: n, transactions: [], budgets: {} }); save(); } }
function resetApp() { if (confirm("Reset everything?")) { localStorage.clear(); location.reload(); } }
function openFullAnalytics() { document.getElementById('analytics-page').classList.remove('hidden'); }
function closeFullAnalytics() { document.getElementById('analytics-page').classList.add('hidden'); }
function setNewGoal() { const n = prompt("Goal Name:"), t = prompt("Target Amount:"); if(n && t) { goal = {name: n, target: parseFloat(t)}; localStorage.setItem('financePro_goal', JSON.stringify(goal)); changeDashboard(); } }
function fireConfetti() { const end = Date.now() + 3000; (function frame() { confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } }); confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } }); if (Date.now() < end) requestAnimationFrame(frame); }()); }

document.getElementById('entry-form').addEventListener('submit', e => {
    e.preventDefault(); const p = profiles.find(prof => prof.id === activeProfileId);
    const amt = (document.getElementById('e-type').value === 'debit') ? -Math.abs(document.getElementById('e-amt').value) : Math.abs(document.getElementById('e-amt').value);
    const id = document.getElementById('edit-id').value;
    if (id) { Object.assign(p.transactions.find(t => t.id == id), { desc: document.getElementById('e-desc').value, amt, cat: document.getElementById('e-cat').value }); cancelEdit(); }
    else { p.transactions.push({ id: Date.now(), desc: document.getElementById('e-desc').value, amt, cat: document.getElementById('e-cat').value, date: new Date().toLocaleDateString('en-IN', {month:'short', day:'numeric', year:'numeric'}) }); }
    save(); showNotify("Saved!");
});

searchInput.addEventListener('input', changeDashboard);
changeProfiles(); changeDashboard();