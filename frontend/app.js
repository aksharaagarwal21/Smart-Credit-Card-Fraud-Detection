/**
 * FraudShield AI — Frontend Application
 * Smart Credit Card Fraud Detection Dashboard
 * ============================================
 * Chart.js visualizations, D3.js graph, real-time prediction, and navigation
 */

const API = '';
let chartInstances = {};
let currentPage = 'dashboard';
let txnPage = 1;
let txnFraudOnly = false;

// ─── Initialization ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupClock();
    loadPage('dashboard');
});

// ─── Navigation ─────────────────────────────────────────────────

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            loadPage(page);
        });
    });

    document.getElementById('menu-toggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
    });

    // Global search
    document.getElementById('global-search').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            loadPage('transactions');
            setTimeout(() => {
                document.getElementById('txn-search').value = e.target.value;
                loadTransactions(1, false, e.target.value);
            }, 200);
        }
    });
}

function loadPage(page) {
    currentPage = page;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard', transactions: 'Transactions', graph: 'Graph View',
        models: 'Model Performance', alerts: 'Fraud Alerts', predict: 'Predict Fraud',
        analytics: 'Analytics'
    };
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';

    // Load data
    switch (page) {
        case 'dashboard': loadDashboard(); break;
        case 'transactions': setupTransactions(); break;
        case 'graph': loadGraphView(); break;
        case 'models': loadModelPerformance(); break;
        case 'alerts': loadAlerts(); break;
        case 'predict': setupPredictForm(); break;
        case 'analytics': loadAnalytics(); break;
    }

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

// ─── Clock ──────────────────────────────────────────────────────

function setupClock() {
    function updateTime() {
        const now = new Date();
        document.getElementById('time-display').textContent =
            now.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    }
    updateTime();
    setInterval(updateTime, 1000);
}

// ─── API Helper ─────────────────────────────────────────────────

async function apiFetch(endpoint) {
    try {
        const res = await fetch(`${API}${endpoint}`);
        const json = await res.json();
        if (json.status === 'success') return json.data;
        console.error('API Error:', json.message);
        return null;
    } catch (e) {
        console.error('Fetch Error:', e);
        return null;
    }
}

async function apiPost(endpoint, data) {
    try {
        const res = await fetch(`${API}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.status === 'success') return json.data;
        console.error('API Error:', json.message);
        return null;
    } catch (e) {
        console.error('Post Error:', e);
        return null;
    }
}

function formatNumber(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString();
}

function formatCurrency(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── Chart Helpers ──────────────────────────────────────────────

const chartColors = {
    blue: '#4d7cff', red: '#ff4d6a', green: '#2dd4a0', purple: '#a855f7',
    orange: '#f97316', yellow: '#facc15', cyan: '#06b6d4', pink: '#ec4899'
};

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

function defaultChartOptions(title) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#8888a8', font: { family: 'Inter', size: 12 }, padding: 16 } },
            title: title ? { display: true, text: title, color: '#e8e8f0', font: { family: 'Inter', size: 14, weight: 600 } } : undefined
        },
        scales: {
            x: { ticks: { color: '#55557a', font: { size: 11 } }, grid: { color: 'rgba(34,34,58,0.5)' } },
            y: { ticks: { color: '#55557a', font: { size: 11 } }, grid: { color: 'rgba(34,34,58,0.5)' } }
        }
    };
}

// ─── Dashboard ──────────────────────────────────────────────────

async function loadDashboard() {
    const data = await apiFetch('/api/dashboard');
    if (!data) return;

    document.getElementById('stat-total').textContent = formatNumber(data.total_transactions);
    document.getElementById('stat-fraud').textContent = formatNumber(data.fraud_count);
    document.getElementById('stat-legit').textContent = formatNumber(data.legit_count);
    document.getElementById('stat-amount').textContent = formatCurrency(data.total_amount);
    document.getElementById('intl-fraud-rate').textContent = data.international_fraud_rate + '%';
    document.getElementById('online-fraud-rate').textContent = data.online_fraud_rate + '%';
    document.getElementById('avg-fraud-amt').textContent = formatCurrency(data.avg_fraud_amount);
    document.getElementById('model-count').textContent = data.model_count || '—';
    document.getElementById('alert-badge').textContent = data.fraud_count;

    // Hourly chart
    destroyChart('hourly');
    const ctxH = document.getElementById('chart-hourly').getContext('2d');
    chartInstances['hourly'] = new Chart(ctxH, {
        type: 'line',
        data: {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [
                {
                    label: 'Legitimate',
                    data: data.legit_by_hour,
                    borderColor: chartColors.green,
                    backgroundColor: 'rgba(45,212,160,0.1)',
                    fill: true, tension: 0.4, pointRadius: 2
                },
                {
                    label: 'Fraudulent',
                    data: data.fraud_by_hour,
                    borderColor: chartColors.red,
                    backgroundColor: 'rgba(255,77,106,0.1)',
                    fill: true, tension: 0.4, pointRadius: 2
                }
            ]
        },
        options: defaultChartOptions()
    });

    // Fraud rate doughnut
    destroyChart('fraudRate');
    const ctxFR = document.getElementById('chart-fraud-rate').getContext('2d');
    chartInstances['fraudRate'] = new Chart(ctxFR, {
        type: 'doughnut',
        data: {
            labels: ['Legitimate', 'Fraudulent'],
            datasets: [{
                data: [data.legit_count, data.fraud_count],
                backgroundColor: [chartColors.green, chartColors.red],
                borderWidth: 0,
                spacing: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#8888a8', font: { family: 'Inter', size: 12 }, padding: 12 } }
            }
        }
    });

    // Category chart
    destroyChart('category');
    const ctxCat = document.getElementById('chart-category').getContext('2d');
    const topCats = data.category_names.slice(0, 8);
    const topCatData = data.fraud_by_category.slice(0, 8);
    chartInstances['category'] = new Chart(ctxCat, {
        type: 'bar',
        data: {
            labels: topCats,
            datasets: [{
                label: 'Fraud Count',
                data: topCatData,
                backgroundColor: [
                    chartColors.red, chartColors.orange, chartColors.yellow, chartColors.purple,
                    chartColors.blue, chartColors.pink, chartColors.cyan, chartColors.green
                ],
                borderRadius: 6, barPercentage: 0.6
            }]
        },
        options: {
            ...defaultChartOptions(),
            indexAxis: 'y',
            plugins: { legend: { display: false } }
        }
    });

    // Channel risk
    destroyChart('channel');
    const ctxCh = document.getElementById('chart-channel').getContext('2d');
    chartInstances['channel'] = new Chart(ctxCh, {
        type: 'polarArea',
        data: {
            labels: ['Online Fraud', 'In-Store Fraud', 'International', 'Domestic'],
            datasets: [{
                data: [
                    data.online_fraud_rate,
                    100 - data.online_fraud_rate,
                    data.international_fraud_rate,
                    100 - data.international_fraud_rate
                ],
                backgroundColor: [
                    'rgba(255,77,106,0.6)', 'rgba(45,212,160,0.6)',
                    'rgba(168,85,247,0.6)', 'rgba(77,124,255,0.6)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#8888a8', font: { size: 11 }, padding: 10 } } },
            scales: { r: { ticks: { display: false }, grid: { color: 'rgba(34,34,58,0.5)' } } }
        }
    });
}

// ─── Transactions ───────────────────────────────────────────────

function setupTransactions() {
    loadTransactions(1, false);

    document.getElementById('filter-all').addEventListener('click', () => {
        document.getElementById('filter-all').classList.add('active');
        document.getElementById('filter-fraud').classList.remove('active');
        txnFraudOnly = false;
        loadTransactions(1, false);
    });

    document.getElementById('filter-fraud').addEventListener('click', () => {
        document.getElementById('filter-fraud').classList.add('active');
        document.getElementById('filter-all').classList.remove('active');
        txnFraudOnly = true;
        loadTransactions(1, true);
    });

    let searchTimeout;
    document.getElementById('txn-search').addEventListener('keyup', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadTransactions(1, txnFraudOnly, e.target.value);
        }, 400);
    });
}

async function loadTransactions(page = 1, fraudOnly = false, search = '') {
    const params = new URLSearchParams({ page, per_page: 20, fraud_only: fraudOnly });
    if (search) params.set('search', search);

    const data = await apiFetch(`/api/transactions?${params}`);
    if (!data) return;

    const tbody = document.getElementById('txn-body');
    tbody.innerHTML = data.transactions.map(tx => `
        <tr class="${tx.is_fraud ? 'fraud-row' : ''}">
            <td>#${tx.id}</td>
            <td>${tx.card_id}</td>
            <td><strong>$${tx.amount.toLocaleString()}</strong></td>
            <td>${tx.merchant_category}</td>
            <td>${tx.hour}:00</td>
            <td>${tx.day_of_week}</td>
            <td>${tx.is_international ? '🌍 Yes' : 'No'}</td>
            <td>${tx.is_online ? '💻 Yes' : '🏪 No'}</td>
            <td>${tx.distance_from_home} km</td>
            <td><span class="status-badge ${tx.is_fraud ? 'fraud' : 'legit'}">${tx.is_fraud ? 'FRAUD' : 'LEGIT'}</span></td>
        </tr>
    `).join('');

    // Pagination
    const pag = document.getElementById('pagination');
    pag.innerHTML = '';

    const totalPages = data.total_pages;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = page <= 1;
    prevBtn.addEventListener('click', () => loadTransactions(page - 1, fraudOnly, search));
    pag.appendChild(prevBtn);

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === page ? 'active' : '';
        btn.addEventListener('click', () => loadTransactions(i, fraudOnly, search));
        pag.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = page >= totalPages;
    nextBtn.addEventListener('click', () => loadTransactions(page + 1, fraudOnly, search));
    pag.appendChild(nextBtn);
}

// ─── Graph View ─────────────────────────────────────────────────

async function loadGraphView() {
    const loadingEl = document.getElementById('graph-loading');
    loadingEl.style.display = 'flex';

    const data = await apiFetch('/api/graph-data?max_nodes=200');
    if (!data) { loadingEl.innerHTML = '<p>Failed to load graph data</p>'; return; }

    loadingEl.style.display = 'none';

    // Stats
    const stats = data.statistics;
    document.getElementById('graph-stats').textContent =
        `${stats.nodes} nodes · ${stats.edges} edges · ${stats.connected_components} components · density: ${stats.density.toFixed(4)}`;

    // Communities
    const commList = document.getElementById('communities-list');
    commList.innerHTML = (data.communities || []).map(c => `
        <div class="community-item ${c.is_suspicious ? 'suspicious' : 'normal'}">
            <span>Community (${c.size} nodes)</span>
            <span>Fraud: ${c.fraud_count}/${c.size} (${(c.fraud_ratio * 100).toFixed(1)}%)</span>
            <span>Density: ${c.density}</span>
        </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:13px;">No significant communities detected</p>';

    // D3 Graph
    renderForceGraph(data);
}

function renderForceGraph(data) {
    const container = document.getElementById('graph-container');
    const svg = d3.select('#graph-svg');
    svg.selectAll('*').remove();

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const edgeTypeColors = {
        same_card: '#4d7cff', same_merchant: '#f97316',
        temporal: '#a855f7', amount_similar: '#facc15', unknown: '#333'
    };

    const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(40).strength(0.3))
        .force('charge', d3.forceManyBody().strength(-60))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 2));

    // Links
    const link = svg.append('g')
        .selectAll('line')
        .data(data.links)
        .enter().append('line')
        .attr('stroke', d => edgeTypeColors[d.type] || '#333')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-width', d => Math.max(0.5, d.weight));

    // Nodes
    const node = svg.append('g')
        .selectAll('circle')
        .data(data.nodes)
        .enter().append('circle')
        .attr('r', d => d.radius)
        .attr('fill', d => d.is_fraud ? '#ff4d6a' : '#2dd4a0')
        .attr('stroke', d => d.is_fraud ? '#ff8096' : '#5ce6c0')
        .attr('stroke-width', 1.5)
        .attr('fill-opacity', 0.8)
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
            })
        );

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .style('position', 'absolute')
        .style('background', '#1c1c28')
        .style('border', '1px solid #22223a')
        .style('border-radius', '8px')
        .style('padding', '10px 14px')
        .style('font-size', '12px')
        .style('color', '#e8e8f0')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000)
        .style('font-family', 'Inter, sans-serif')
        .style('box-shadow', '0 4px 20px rgba(0,0,0,0.5)');

    node.on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
            .html(`<strong>Transaction #${d.id}</strong><br>Amount: $${d.amount}<br>Status: ${d.is_fraud ? '🔴 Fraud' : '🟢 Legit'}<br>Connections: ${d.degree}<br>Hour: ${d.hour}:00`)
            .style('left', (event.pageX + 14) + 'px')
            .style('top', (event.pageY - 14) + 'px');
    })
    .on('mouseout', () => tooltip.style('opacity', 0));

    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('cx', d => Math.max(d.radius, Math.min(width - d.radius, d.x)))
            .attr('cy', d => Math.max(d.radius, Math.min(height - d.radius, d.y)));
    });
}

// ─── Model Performance ─────────────────────────────────────────

async function loadModelPerformance() {
    const data = await apiFetch('/api/model-performance');
    if (!data) return;

    const metrics = data.metrics;
    const modelNames = Object.keys(metrics);

    // Comparison bar chart
    destroyChart('modelComp');
    const ctxComp = document.getElementById('chart-model-comparison').getContext('2d');
    chartInstances['modelComp'] = new Chart(ctxComp, {
        type: 'bar',
        data: {
            labels: modelNames,
            datasets: [
                { label: 'Precision', data: modelNames.map(n => metrics[n].precision), backgroundColor: chartColors.blue, borderRadius: 4 },
                { label: 'Recall', data: modelNames.map(n => metrics[n].recall), backgroundColor: chartColors.green, borderRadius: 4 },
                { label: 'F1-Score', data: modelNames.map(n => metrics[n].f1_score), backgroundColor: chartColors.purple, borderRadius: 4 },
                { label: 'Accuracy', data: modelNames.map(n => metrics[n].accuracy), backgroundColor: chartColors.orange, borderRadius: 4 },
            ]
        },
        options: { ...defaultChartOptions(), scales: { ...defaultChartOptions().scales, y: { ...defaultChartOptions().scales.y, max: 1.0 } } }
    });

    // AUC Radar
    destroyChart('auc');
    const ctxAuc = document.getElementById('chart-auc').getContext('2d');
    chartInstances['auc'] = new Chart(ctxAuc, {
        type: 'radar',
        data: {
            labels: ['Precision', 'Recall', 'F1-Score', 'AUC-ROC', 'Accuracy'],
            datasets: modelNames.map((name, i) => ({
                label: name,
                data: [metrics[name].precision, metrics[name].recall, metrics[name].f1_score, metrics[name].auc_roc, metrics[name].accuracy],
                borderColor: [chartColors.blue, chartColors.red, chartColors.green, chartColors.purple, chartColors.orange][i % 5],
                backgroundColor: [
                    'rgba(77,124,255,0.1)', 'rgba(255,77,106,0.1)', 'rgba(45,212,160,0.1)',
                    'rgba(168,85,247,0.1)', 'rgba(249,115,22,0.1)'
                ][i % 5],
                pointRadius: 3, borderWidth: 2
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#8888a8', font: { size: 11 }, padding: 10 } } },
            scales: { r: { ticks: { display: false }, grid: { color: 'rgba(34,34,58,0.5)' }, angleLines: { color: 'rgba(34,34,58,0.5)' }, suggestedMin: 0, suggestedMax: 1 } }
        }
    });

    // Model cards
    const cardsEl = document.getElementById('model-cards');
    cardsEl.innerHTML = modelNames.map(name => {
        const m = metrics[name];
        const type = name.includes('GNN') ? 'gnn' : name.includes('Ensemble') ? 'ensemble' : 'ml';
        const typeLabel = name.includes('GNN') ? 'GNN' : name.includes('Ensemble') ? 'ENSEMBLE' : 'ML';
        return `
            <div class="model-card">
                <div class="model-card-header">
                    <h4>${name}</h4>
                    <span class="model-type-badge ${type}">${typeLabel}</span>
                </div>
                <div class="metric-row"><span class="metric-label">Precision</span><span class="metric-value">${(m.precision * 100).toFixed(1)}% <span class="metric-bar"><span class="metric-bar-fill" style="width:${m.precision * 100}%;background:${chartColors.blue}"></span></span></span></div>
                <div class="metric-row"><span class="metric-label">Recall</span><span class="metric-value">${(m.recall * 100).toFixed(1)}% <span class="metric-bar"><span class="metric-bar-fill" style="width:${m.recall * 100}%;background:${chartColors.green}"></span></span></span></div>
                <div class="metric-row"><span class="metric-label">F1-Score</span><span class="metric-value">${(m.f1_score * 100).toFixed(1)}% <span class="metric-bar"><span class="metric-bar-fill" style="width:${m.f1_score * 100}%;background:${chartColors.purple}"></span></span></span></div>
                <div class="metric-row"><span class="metric-label">AUC-ROC</span><span class="metric-value">${(m.auc_roc * 100).toFixed(1)}% <span class="metric-bar"><span class="metric-bar-fill" style="width:${m.auc_roc * 100}%;background:${chartColors.orange}"></span></span></span></div>
                <div class="metric-row"><span class="metric-label">Training Time</span><span class="metric-value">${m.training_time}s</span></div>
            </div>
        `;
    }).join('');

    // GNN info
    if (data.gnn_info && data.gnn_info.type) {
        const gnn = data.gnn_info;
        const gs = gnn.graph_stats || {};
        document.getElementById('gnn-details').innerHTML = `
            <div class="gnn-detail-grid">
                <div class="gnn-detail"><div class="gnn-detail-label">Architecture</div><div class="gnn-detail-value" style="font-size:14px;">${gnn.type}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">Input Dimension</div><div class="gnn-detail-value">${gnn.input_dim}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">Hidden Dimension</div><div class="gnn-detail-value">${gnn.hidden_dim}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">GCN Layers</div><div class="gnn-detail-value">${gnn.num_layers}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">Total Parameters</div><div class="gnn-detail-value">${gnn.total_parameters.toLocaleString()}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">Learning Rate</div><div class="gnn-detail-value">${gnn.learning_rate}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">Graph Nodes</div><div class="gnn-detail-value">${gs.nodes || '—'}</div></div>
                <div class="gnn-detail"><div class="gnn-detail-label">Graph Edges</div><div class="gnn-detail-value">${gs.edges || '—'}</div></div>
            </div>
        `;
    }
}

// ─── Alerts ─────────────────────────────────────────────────────

async function loadAlerts() {
    const data = await apiFetch('/api/alerts?limit=30');
    if (!data) return;

    const listEl = document.getElementById('alerts-list');
    renderAlerts(data, listEl);

    // Filter buttons
    document.querySelectorAll('.alert-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.alert-filters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const sev = btn.dataset.severity;
            const filtered = sev === 'all' ? data : data.filter(a => a.severity === sev);
            renderAlerts(filtered, listEl);
        });
    });
}

function renderAlerts(alerts, container) {
    container.innerHTML = alerts.map(a => `
        <div class="alert-item ${a.severity}">
            <span class="alert-severity ${a.severity}">${a.severity}</span>
            <div class="alert-details">
                <div class="alert-title">${a.alert_type} — Card ${a.card_id}</div>
                <div class="alert-meta">${a.merchant_category} · ${a.hour}:00 · ${a.is_international ? '🌍 International' : 'Domestic'} · ${a.distance} km away</div>
            </div>
            <span class="alert-amount">$${a.amount.toLocaleString()}</span>
            <span class="alert-status ${a.status}">${a.status}</span>
        </div>
    `).join('');
}

// ─── Predict ────────────────────────────────────────────────────

function setupPredictForm() {
    const form = document.getElementById('predict-form');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('predict-btn');
        btn.textContent = 'Analyzing...';
        btn.disabled = true;

        const txnData = {
            amount: parseFloat(document.getElementById('pred-amount').value),
            hour: parseInt(document.getElementById('pred-hour').value),
            day_of_week: parseInt(document.getElementById('pred-day').value),
            merchant_category: parseInt(document.getElementById('pred-category').value),
            is_international: parseInt(document.getElementById('pred-international').value),
            is_online: parseInt(document.getElementById('pred-online').value),
            distance_from_home: parseFloat(document.getElementById('pred-distance').value)
        };

        const result = await apiPost('/api/predict', txnData);

        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Analyze Transaction';
        btn.disabled = false;

        if (!result) return;

        const resultCard = document.getElementById('predict-result');
        resultCard.style.display = 'block';

        // Risk gauge
        const gauge = document.getElementById('risk-gauge');
        const prob = result.fraud_probability;
        const gaugeColor = prob >= 0.6 ? '#ff4d6a' : prob >= 0.3 ? '#f97316' : '#2dd4a0';
        gauge.style.background = `conic-gradient(${gaugeColor} ${prob * 360}deg, #22223a ${prob * 360}deg)`;
        gauge.innerHTML = `<span style="position:absolute;color:${gaugeColor}">${(prob * 100).toFixed(0)}%</span>`;

        // Risk info
        const levelColors = { CRITICAL: '#ff4d6a', HIGH: '#f97316', MEDIUM: '#facc15', LOW: '#4d7cff', SAFE: '#2dd4a0' };
        document.getElementById('risk-level').textContent = result.risk_level;
        document.getElementById('risk-level').style.color = levelColors[result.risk_level];
        document.getElementById('risk-score').textContent = `Fraud Probability: ${(prob * 100).toFixed(2)}%`;

        const recEl = document.getElementById('recommendation');
        recEl.textContent = result.recommendation;
        recEl.className = 'recommendation ' + result.recommendation.toLowerCase();

        // Model predictions
        const modelsEl = document.getElementById('result-models');
        modelsEl.innerHTML = '<h4>Model Predictions</h4>' +
            Object.entries(result.model_predictions).map(([name, score]) => `
                <div class="model-pred-row">
                    <span>${name}</span>
                    <span>${(score * 100).toFixed(1)}%</span>
                    <div class="model-pred-bar"><div class="model-pred-bar-fill" style="width:${score * 100}%"></div></div>
                </div>
            `).join('');

        // Factors
        const factEl = document.getElementById('result-factors');
        if (result.contributing_factors.length > 0) {
            factEl.innerHTML = '<h4>Contributing Factors</h4>' +
                result.contributing_factors.map(f => `<div class="factor-item">${f}</div>`).join('');
        } else {
            factEl.innerHTML = '<h4>Contributing Factors</h4><p style="color:var(--text-muted);font-size:13px;">No significant risk factors detected</p>';
        }
    };
}

// ─── Analytics ──────────────────────────────────────────────────

async function loadAnalytics() {
    const data = await apiFetch('/api/analytics');
    if (!data) return;

    // Amount distribution
    destroyChart('amountDist');
    const ctxAD = document.getElementById('chart-amount-dist').getContext('2d');
    chartInstances['amountDist'] = new Chart(ctxAD, {
        type: 'bar',
        data: {
            labels: data.amount_bins,
            datasets: [
                { label: 'Legitimate', data: data.legit_amount_distribution, backgroundColor: 'rgba(45,212,160,0.7)', borderRadius: 4 },
                { label: 'Fraudulent', data: data.fraud_amount_distribution, backgroundColor: 'rgba(255,77,106,0.7)', borderRadius: 4 }
            ]
        },
        options: defaultChartOptions()
    });

    // Day of week
    destroyChart('day');
    const ctxDay = document.getElementById('chart-day').getContext('2d');
    chartInstances['day'] = new Chart(ctxDay, {
        type: 'bar',
        data: {
            labels: data.days,
            datasets: [{
                label: 'Fraud Count',
                data: data.fraud_by_day,
                backgroundColor: [
                    chartColors.blue, chartColors.purple, chartColors.pink,
                    chartColors.red, chartColors.orange, chartColors.yellow, chartColors.green
                ],
                borderRadius: 6, barPercentage: 0.5
            }]
        },
        options: { ...defaultChartOptions(), plugins: { legend: { display: false } } }
    });

    // Distance
    destroyChart('distance');
    const ctxDist = document.getElementById('chart-distance').getContext('2d');
    chartInstances['distance'] = new Chart(ctxDist, {
        type: 'line',
        data: {
            labels: data.distance_labels,
            datasets: [{
                label: 'Fraud by Distance',
                data: data.fraud_by_distance,
                borderColor: chartColors.purple,
                backgroundColor: 'rgba(168,85,247,0.15)',
                fill: true, tension: 0.4, pointRadius: 4,
                pointBackgroundColor: chartColors.purple
            }]
        },
        options: defaultChartOptions()
    });

    // Online vs Offline
    destroyChart('onlineOffline');
    const ctxOO = document.getElementById('chart-online-offline').getContext('2d');
    const oo = data.online_vs_offline;
    chartInstances['onlineOffline'] = new Chart(ctxOO, {
        type: 'doughnut',
        data: {
            labels: ['Online Fraud', 'Offline Fraud', 'Online Legit', 'Offline Legit'],
            datasets: [{
                data: [oo.online_fraud, oo.offline_fraud, oo.online_legit, oo.offline_legit],
                backgroundColor: [chartColors.red, chartColors.orange, chartColors.green, chartColors.blue],
                borderWidth: 0, spacing: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '55%',
            plugins: { legend: { position: 'bottom', labels: { color: '#8888a8', font: { size: 11 }, padding: 8 } } }
        }
    });

    // International
    destroyChart('intlDomestic');
    const ctxID = document.getElementById('chart-intl-domestic').getContext('2d');
    const intl = data.international_stats;
    chartInstances['intlDomestic'] = new Chart(ctxID, {
        type: 'bar',
        data: {
            labels: ['International', 'Domestic'],
            datasets: [
                { label: 'Fraud', data: [intl.intl_fraud, intl.domestic_fraud], backgroundColor: chartColors.red, borderRadius: 6 },
                { label: 'Legitimate', data: [intl.intl_legit, intl.domestic_legit], backgroundColor: chartColors.green, borderRadius: 6 }
            ]
        },
        options: { ...defaultChartOptions(), plugins: { legend: { labels: { color: '#8888a8', font: { size: 11 } } } } }
    });
}
