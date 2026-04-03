let currentSport = 'all';
let currentSort = 'probability';
let allPredictions = [];
let isLoading = false;

function getNairobiTime() {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
}

function updateDateTime() {
    const nairobiTime = getNairobiTime();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = nairobiTime.toLocaleDateString('en-US', options);
    document.getElementById('currentTime').textContent = nairobiTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function updateStats(predictions) {
    const stats = { 'Football': 0, 'Basketball': 0, 'Tennis': 0, 'Volleyball': 0, 'Table Tennis': 0, 'Handball': 0 };
    predictions.forEach(pred => { if (stats[pred.sport] !== undefined) stats[pred.sport]++; });

    document.getElementById('footballCount').textContent = stats['Football'];
    document.getElementById('basketballCount').textContent = stats['Basketball'];
    document.getElementById('tennisCount').textContent = stats['Tennis'];
    document.getElementById('volleyballCount').textContent = stats['Volleyball'];
    document.getElementById('tableTennisCount').textContent = stats['Table Tennis'];
    document.getElementById('handballCount').textContent = stats['Handball'];

    const safePicks = predictions.filter(p => p.probability >= 70);
    document.getElementById('bestPicksCount').textContent = safePicks.length;
    document.getElementById('totalPredictions').textContent = predictions.length;
}

function generateGameInsights(match) {
    const insights = [];
    if (match.homeForm && match.awayForm) {
        const diff = parseFloat(match.homeForm) - parseFloat(match.awayForm);
        if (diff > 1) insights.push(`📊 ${match.homeTeam} has superior form (${match.homeForm}/10 vs ${match.awayForm}/10)`);
        else if (diff < -1) insights.push(`📊 ${match.awayTeam} has superior form (${match.awayForm}/10 vs ${match.homeForm}/10)`);
        else insights.push(`📊 Form is evenly matched (${match.homeForm}/10 vs ${match.awayForm}/10)`);
    }
    if (match.probability >= 75) insights.push(`🎯 Very high confidence (${match.probability}%) - Safe pick`);
    else if (match.probability >= 65) insights.push(`📈 Good statistical backing (${match.probability}%)`);
    if (match.odds) {
        const value = (match.probability / 100) * parseFloat(match.odds);
        if (value > 1.05) insights.push(`💰 Excellent value detected in current odds`);
    }
    while (insights.length < 2) insights.push(`📊 Statistical analysis supports this prediction`);
    return insights.slice(0, 3);
}

async function fetchAllMarkets() {
    try {
        const response = await fetch('/api/all-markets');
        const data = await response.json();
        const container = document.getElementById('marketsContainer');

        if (data.markets && Object.keys(data.markets).length > 0) {
            container.innerHTML = Object.entries(data.markets).map(([market, items]) => `
                <div class="market-card">
                    <div class="market-header">
                        <span class="market-name">${market}</span>
                        <span class="market-count">${items.length} picks</span>
                    </div>
                    <div class="market-items">
                        ${items.slice(0, 3).map(item => `
                            <div class="market-item">
                                <div class="market-item-info">
                                    <div class="market-item-match">${item.homeTeam} vs ${item.awayTeam}</div>
                                    <div class="market-item-prediction">${item.prediction}</div>
                                </div>
                                <div class="market-item-probability">${item.probability}%</div>
                                <div class="market-item-odds">${item.odds || 'N/A'}</div>
                            </div>
                        `).join('')}
                        ${items.length > 3 ? `<div style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 8px;">+${items.length - 3} more markets</div>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="loading-pulse">No markets available</div>';
        }
    } catch (error) {
        console.error('Error fetching markets:', error);
    }
}

async function fetchAccumulators() {
    try {
        const response = await fetch('/api/accumulator-recommendations');
        const data = await response.json();

        const acc3Container = document.getElementById('accumulator3odds');
        if (data.accumulator3 && data.accumulator3.selections.length > 0) {
            acc3Container.innerHTML = `
                <div class="accumulator-selections-list">
                    ${data.accumulator3.selections.map((sel, idx) => `
                        <div class="accumulator-selection-item">
                            <div class="accumulator-selection-match">${idx + 1}. ${sel.homeTeam} vs ${sel.awayTeam}<br><small>${sel.prediction} (${sel.probability}%)</small></div>
                            <div class="accumulator-selection-odds">${sel.odds || '1.00'}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="accumulator-footer">
                    <span>Total Odds: <strong>${data.accumulator3.totalOdds}</strong></span>
                    <span>Return (${data.accumulator3.stake} UGX): <strong>${data.accumulator3.potentialReturn} UGX</strong></span>
                    <button class="use-acc-btn" onclick="alert('Safe accumulator added! Total odds: ${data.accumulator3.totalOdds}')">Use</button>
                </div>
            `;
        } else {
            acc3Container.innerHTML = '<div class="loading-small">No safe accumulators available</div>';
        }

        const acc12Container = document.getElementById('accumulator12odds');
        if (data.accumulator12 && data.accumulator12.selections.length > 0) {
            acc12Container.innerHTML = `
                <div class="accumulator-selections-list">
                    ${data.accumulator12.selections.map((sel, idx) => `
                        <div class="accumulator-selection-item">
                            <div class="accumulator-selection-match">${idx + 1}. ${sel.homeTeam} vs ${sel.awayTeam}<br><small>${sel.prediction} (${sel.probability}%)</small></div>
                            <div class="accumulator-selection-odds">${sel.odds || '1.00'}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="accumulator-footer">
                    <span>Total Odds: <strong>${data.accumulator12.totalOdds}</strong></span>
                    <span>Return (${data.accumulator12.stake} UGX): <strong>${data.accumulator12.potentialReturn} UGX</strong></span>
                    <button class="use-acc-btn" onclick="alert('Value accumulator added! Total odds: ${data.accumulator12.totalOdds}')">Use</button>
                </div>
            `;
        } else {
            acc12Container.innerHTML = '<div class="loading-small">No value accumulators available</div>';
        }
    } catch (error) {
        console.error('Error fetching accumulators:', error);
    }
}

async function fetchBetOfTheDay() {
    try {
        const response = await fetch('/api/bet-of-the-day');
        const bet = await response.json();
        if (bet && !bet.error) {
            document.getElementById('betOfTheDay').innerHTML = `
                <div class="bet-day-card">
                    <div class="bet-day-header"><i class="fas fa-crown"></i><span class="probability-badge">${bet.probability}%</span></div>
                    <div class="bet-day-match">${bet.homeTeam} vs ${bet.awayTeam}</div>
                    <div class="bet-day-prediction">🎯 ${bet.prediction}</div>
                    <div class="odds">💰 Odds: ${bet.odds || 'N/A'} UGX</div>
                    <div class="bet-day-reason">💡 ${bet.betOfTheDayReason}</div>
                </div>
            `;
        }
    } catch (error) { }
}

async function fetchMatchesOfTheDay() {
    try {
        const response = await fetch('/api/matches-of-the-day');
        const data = await response.json();
        if (data.matches && data.matches.length > 0) {
            document.getElementById('matchesDayGrid').innerHTML = data.matches.slice(0, 4).map(match => `
                <div class="match-day-card">
                    <div class="match-day-sport">${match.sport}</div>
                    <div class="match-day-teams">${match.homeTeam} vs ${match.awayTeam}</div>
                    <div class="match-day-prediction">${match.prediction} <strong class="match-day-probability">${match.probability}%</strong></div>
                    <div class="time">⏰ ${match.time || 'Today'}</div>
                </div>
            `).join('');
        }
    } catch (error) { }
}

async function fetchAllPredictions() {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('predictionsContainer');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>Loading predictions...</p></div>`;

    try {
        const response = await fetch('/api/best-picks');
        const predictions = await response.json();

        if (!predictions || predictions.length === 0) {
            container.innerHTML = `<div class="loading-state"><p>No predictions available</p></div>`;
            isLoading = false;
            return;
        }

        allPredictions = predictions.map((p, idx) => ({ ...p, id: `${p.sport}-${p.homeTeam}-${p.awayTeam}-${idx}` }));
        updateStats(allPredictions);

        await Promise.all([fetchBetOfTheDay(), fetchMatchesOfTheDay(), fetchAccumulators(), fetchAllMarkets()]);

        if (currentSport === 'all') displayPredictions(allPredictions);
        else if (currentSport === 'best') displayPredictions(allPredictions.filter(p => p.probability >= 70));
        else displayPredictions(allPredictions.filter(p => p.sport.toLowerCase() === currentSport.toLowerCase()));

        document.getElementById('lastUpdate').textContent = getNairobiTime().toLocaleTimeString();
        isLoading = false;
    } catch (error) {
        container.innerHTML = `<div class="loading-state"><p>Error loading predictions</p><button onclick="fetchAllPredictions()">Retry</button></div>`;
        isLoading = false;
    }
}

function displayPredictions(predictions) {
    const container = document.getElementById('predictionsContainer');
    const sorted = [...predictions].sort((a, b) => b.probability - a.probability);

    if (sorted.length === 0) {
        container.innerHTML = `<div class="loading-state"><p>No predictions available</p></div>`;
        return;
    }

    container.innerHTML = `
        <div class="predictions-grid">
            ${sorted.map(pred => {
        const insights = generateGameInsights(pred);
        return `
                <div class="prediction-card">
                    <div class="card-header">
                        <div class="sport-badge ${pred.sport.toLowerCase().replace(' ', '')}"><i class="fas ${getSportIcon(pred.sport)}"></i> ${pred.sport}</div>
                        <div class="confidence-badge ${pred.confidence.toLowerCase().replace(' ', '-')}">${pred.confidence}</div>
                    </div>
                    <div class="card-body">
                        <div class="match-info"><div class="league">${pred.league || 'Match'}</div><div class="teams">${pred.homeTeam} vs ${pred.awayTeam}</div><div class="time">⏰ ${pred.time || 'Today'} (EAT)</div></div>
                        <div class="prediction-box"><div class="market">${pred.market || 'Prediction'}</div><div class="prediction-text">${pred.prediction}</div><div class="probability">${pred.probability}%</div><div class="probability-bar"><div class="probability-fill" style="width: ${pred.probability}%"></div></div>${pred.odds ? `<div class="odds">💰 Odds: ${pred.odds}</div>` : ''}</div>
                        <div class="ai-insights-section"><div class="insights-header" onclick="toggleInsights(this)"><i class="fas fa-brain"></i> AI Analysis <i class="fas fa-chevron-down"></i></div><div class="insights-content-collapsible">${insights.map(i => `<div class="insight-item">${i}</div>`).join('')}</div></div>
                        <div class="prediction-actions"><button class="view-analysis-btn" onclick='showMatchAnalysis(${JSON.stringify(pred)})'>📊 Full Analysis</button><button class="view-external-btn" onclick='showExternalPredictions(${JSON.stringify(pred)})'>🌐 Expert Tips</button></div>
                    </div>
                    <div class="card-footer">${pred.homeForm ? `<span>📊 Form: ${pred.homeForm}/10</span>` : ''}${pred.awayForm ? `<span>📊 Form: ${pred.awayForm}/10</span>` : ''}<span>${pred.probability >= 70 ? '✅ Safe Pick' : '⚖️ Value Pick'}</span></div>
                </div>
            `}).join('')}
        </div>
    `;
}

function getSportIcon(sport) {
    const icons = { 'Football': 'fa-futbol', 'Basketball': 'fa-basketball', 'Tennis': 'fa-tennis-ball', 'Volleyball': 'fa-volleyball-ball', 'Table Tennis': 'fa-table-tennis', 'Handball': 'fa-hand-peace' };
    return icons[sport] || 'fa-sports';
}

function toggleInsights(element) {
    const content = element.nextElementSibling;
    const icon = element.querySelector('.fa-chevron-down');
    if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
    }
}

async function showMatchAnalysis(match) {
    const modal = document.getElementById('analysisModal');
    document.getElementById('analysisModalTitle').textContent = `${match.homeTeam} vs ${match.awayTeam} - Analysis`;
    document.getElementById('analysisModalBody').innerHTML = `<div class="loading-spinner-small"></div><p>Loading analysis...</p>`;
    modal.style.display = 'block';

    setTimeout(() => {
        document.getElementById('analysisModalBody').innerHTML = `
            <div class="analysis-container">
                <h4>📊 Statistical Breakdown</h4>
                <p>Probability: <strong>${match.probability}%</strong> ${match.probability >= 70 ? '(Safe Pick)' : '(Value Pick)'}</p>
                <p>Confidence: <strong>${match.confidence}</strong></p>
                <p>${match.homeForm ? `${match.homeTeam} Form: ${match.homeForm}/10` : ''}</p>
                <p>${match.awayForm ? `${match.awayTeam} Form: ${match.awayForm}/10` : ''}</p>
                <h4>🎯 Verdict</h4>
                <p>${match.prediction} with ${match.probability}% confidence based on form analysis and statistical modeling.</p>
                <p>Recommended Stake: ${match.probability >= 70 ? '3-5% of bankroll' : '1-2% of bankroll'}</p>
            </div>
        `;
    }, 500);
}

async function showExternalPredictions(match) {
    const modal = document.getElementById('predictionModal');
    document.getElementById('modalTitle').textContent = `${match.homeTeam} vs ${match.awayTeam} - Expert Tips`;
    document.getElementById('modalBody').innerHTML = `<div class="loading-spinner-small"></div><p>Loading expert tips...</p>`;
    modal.style.display = 'block';

    try {
        const response = await fetch('/api/external-predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sport: match.sport, homeTeam: match.homeTeam, awayTeam: match.awayTeam })
        });
        const data = await response.json();

        if (data.predictions && data.predictions.length > 0) {
            document.getElementById('modalBody').innerHTML = data.predictions.map(p => `
                <div class="external-prediction"><strong>${p.source}</strong> (${p.confidence}% confidence)<br>Prediction: ${p.prediction}<br>Odds: ${p.odds}<br><small>${p.comment}</small></div>
            `).join('');
        } else {
            document.getElementById('modalBody').innerHTML = '<p>No expert tips available</p>';
        }
    } catch (error) {
        document.getElementById('modalBody').innerHTML = '<p>Error loading expert tips</p>';
    }
}

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSport = btn.dataset.sport;
            if (currentSport === 'all') displayPredictions(allPredictions);
            else if (currentSport === 'best') displayPredictions(allPredictions.filter(p => p.probability >= 70));
            else displayPredictions(allPredictions.filter(p => p.sport.toLowerCase() === currentSport.toLowerCase()));
        });
    });
}

function setupSorting() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;
            let sorted = [...allPredictions];
            if (currentSort === 'probability') sorted.sort((a, b) => b.probability - a.probability);
            else if (currentSort === 'confidence') {
                const order = { 'Very High': 4, 'High': 3, 'Medium High': 2, 'Medium': 1 };
                sorted.sort((a, b) => order[b.confidence] - order[a.confidence]);
            }
            else if (currentSort === 'time') sorted.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
            displayPredictions(sorted);
        });
    });
}

function setupModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('analysisModal').style.display = 'none';
            document.getElementById('predictionModal').style.display = 'none';
        };
    });
    window.onclick = (event) => { if (event.target.classList.contains('modal')) event.target.style.display = 'none'; };
}

async function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    await fetchAllPredictions();
    setupTabs();
    setupSorting();
    setupModals();
}

document.addEventListener('DOMContentLoaded', init);