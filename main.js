let profiles = JSON.parse(localStorage.getItem('fampay_profiles')) || [
    { id: 1, name: 'Personal', transactions: [] }
];
let activeProfileId = profiles[0].id;
let goal = JSON.parse(localStorage.getItem('fampay_goal')) || { name: "Savings Goal", target: 1000 };


//General Use
const headerTitle = document.getElementById('header-title');
const txListContainer = document.getElementById('tx-list');
const searchInput = document.getElementById('search-input');
const filterSelect = document.getElementById('filter-select');
const profileListContainer = document.getElementById('profile-list');

// Form Elements
const entryForm = document.getElementById('entry-form');
const formCard = document.getElementById('form-card');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');
const editIdInput = document.getElementById('edit-id');
const eTypeInput = document.getElementById('e-type');
const eDescInput = document.getElementById('e-desc');
const eAmtInput = document.getElementById('e-amt');
const eCatInput = document.getElementById('e-cat');

// Stats & Analysis Elements
const netBalText = document.getElementById('net-bal');
const incBalText = document.getElementById('inc-bal');
const expBalText = document.getElementById('exp-bal');
const graphContainer = document.getElementById('graph-container');
const totalSpendTag = document.getElementById('total-spend-tag');

// Goal Elements
const goalNameText = document.getElementById('goal-name');
const goalPercentText = document.getElementById('goal-percent');
const goalBarFill = document.getElementById('goal-bar');
const goalStatusText = document.getElementById('goal-status');


