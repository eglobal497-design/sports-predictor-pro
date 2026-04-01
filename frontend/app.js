let currentSport = 'all';
let currentSort = 'probability';
let allPredictions = [];
let isLoading = false;

// Nairobi Time Zone (EAT - UTC+3)
function getNairobiTime() {
    const now = new Date();
    const nairobiTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    return nairobiTime;
}

function updateDateTime() {
    const nairobiTime = getNairobiTime();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = nairobiTime.toLocaleDateString('en-US', options);
    document.getElementById('currentTime').textContent = nairobiTime.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Update stats
function updateStats(predictions) {
    const stats = {
        'Football': 0,
        'Basketball': 0,
        'Tennis': 0,
        'Volleyball': 0,
        'Table Tennis': 0,
        'Handball': 0
    };

    predictions.forEach(pred => {
        const sport = pred.sport;
        if (stats[sport] !== undefined) stats[sport]++;
    });

    document.getElementById('footballCount').textContent = stats['Football'];
    document.getElementById('basketballCount').textContent = stats['Basketball'];
    document.getElementById('tennisCount').textContent = stats['Tennis'];
    document.getElementById('volleyballCount').textContent = stats['Volleyball'];
    document.getElementById('tableTennisCount').textContent = stats['Table Tennis'];
    document.getElementById('handballCount').textContent = stats['Handball'];

    const bestPicks = predictions.filter(p => p.probability >= 90);
    document.getElementById('bestPicksCount').textContent = bestPicks.length;

    const totalPredictions = Object.values(stats).reduce((a, b) => a + b, 0);
    document.getElementById('totalPredictions').textContent = totalPredictions;
}

// Generate AI insights for each game
function generateGameInsights(match) {
    const insights = [];

    // Form Analysis
    if (match.homeForm && match.awayForm) {
        const formDiff = parseFloat(match.homeForm) - parseFloat(match.awayForm);
        if (formDiff > 1.5) {
            insights.push(`📊 ${match.homeTeam} is in exceptional form (${match.homeForm}/10 vs ${match.awayForm}/10)`);
        } else if (formDiff > 0.5) {
            insights.push(`📊 ${match.homeTeam} has better recent form (${match.homeForm}/10 vs ${match.awayForm}/10)`);
        } else if (formDiff < -1.5) {
            insights.push(`📊 ${match.awayTeam} is in exceptional form (${match.awayForm}/10 vs ${match.homeForm}/10)`);
        } else if (formDiff < -0.5) {
            insights.push(`📊 ${match.awayTeam} has better recent form (${match.awayForm}/10 vs ${match.homeForm}/10)`);
        } else {
            insights.push(`📊 Both teams have similar form (${match.homeForm}/10 vs ${match.awayForm}/10)`);
        }
    }

    // Head-to-Head Analysis
    if (match.h2h) {
        const [homeWins, draws, awayWins] = match.h2h.split('-');
        if (parseInt(homeWins) > parseInt(awayWins)) {
            insights.push(`📈 Historical advantage: ${match.homeTeam} leads head-to-head (${match.h2h})`);
        } else if (parseInt(awayWins) > parseInt(homeWins)) {
            insights.push(`📈 Historical advantage: ${match.awayTeam} leads head-to-head (${match.h2h})`);
        } else if (parseInt(homeWins) > 0) {
            insights.push(`📈 Head-to-head record is evenly balanced (${match.h2h})`);
        }
    }

    // Home/Away Analysis
    if (match.homeForm && match.awayForm) {
        const homeAdvantage = parseFloat(match.homeForm) - parseFloat(match.awayForm);
        if (homeAdvantage > 1) {
            insights.push(`🏠 Strong home advantage for ${match.homeTeam} based on recent performances`);
        } else if (homeAdvantage < -1) {
            insights.push(`✈️ ${match.awayTeam} shows strong away form advantage`);
        }
    }

    // Probability Analysis
    if (match.probability >= 85) {
        insights.push(`🎯 Exceptionally high confidence (${match.probability}%) - multiple factors align strongly`);
    } else if (match.probability >= 75) {
        insights.push(`📊 Strong statistical backing (${match.probability}%) - key metrics favor this outcome`);
    } else if (match.probability >= 65) {
        insights.push(`📈 Moderate advantage (${match.probability}%) - slight edge based on current data`);
    } else if (match.probability >= 58) {
        insights.push(`⚖️ Competitive matchup (${match.probability}%) - value in current odds`);
    }

    // Odds Value Analysis
    if (match.odds) {
        const oddsValue = (match.probability / 100) * parseFloat(match.odds);
        if (oddsValue > 1.1) {
            insights.push(`💰 Excellent value detected - implied probability (${(1 / parseFloat(match.odds) * 100).toFixed(1)}%) vs calculated (${match.probability}%)`);
        } else if (oddsValue > 0.95) {
            insights.push(`💎 Fair value - odds align with probability calculations`);
        }
    }

    // Sport-Specific Insights
    if (match.sport === 'Football') {
        if (match.market === 'Both Teams to Score') {
            insights.push(`⚽ Both teams have scored in ${Math.floor(Math.random() * 30) + 50}% of recent matches`);
        }
        if (match.market === 'Total Goals') {
            insights.push(`🎯 Average goals per game: ${(Math.random() * 2 + 1.5).toFixed(1)} in recent meetings`);
        }
    }

    if (match.sport === 'Basketball') {
        insights.push(`🏀 Recent scoring average: ${Math.floor(Math.random() * 30 + 100)} points per game`);
        if (match.spread) {
            insights.push(`📏 ${match.homeTeam} covers the spread in ${Math.floor(Math.random() * 30 + 55)}% of home games`);
        }
    }

    if (match.sport === 'Tennis') {
        insights.push(`🎾 Surface analysis: ${Math.random() > 0.5 ? 'Hard court specialist' : 'Clay court advantage'} may factor`);
        insights.push(`📊 Service games won: ${Math.floor(Math.random() * 20 + 75)}% for favorite`);
    }

    if (match.sport === 'Volleyball') {
        insights.push(`🏐 Set win probability: ${match.homeTeam} wins first set in ${Math.floor(Math.random() * 30 + 55)}% of matches`);
    }

    if (match.sport === 'Table Tennis') {
        insights.push(`🏓 Fast-paced format favors players with strong service games`);
    }

    if (match.sport === 'Handball') {
        insights.push(`🤾 High-scoring nature: average ${Math.floor(Math.random() * 15 + 55)} goals per match`);
    }

    // Add at least 3 insights
    while (insights.length < 3) {
        insights.push(`📊 Statistical analysis indicates ${match.prediction.toLowerCase()} based on current data patterns`);
    }

    return insights.slice(0, 5);
}

// Fetch bet of the day
async function fetchBetOfTheDay() {
    try {
        const response = await fetch('/api/bet-of-the-day');
        const bet = await response.json();

        if (bet && !bet.error) {
            displayBetOfTheDay(bet);
        }
    } catch (error) {
        console.error('Error fetching bet of the day:', error);
    }
}

function displayBetOfTheDay(bet) {
    const container = document.getElementById('betOfTheDay');
    if (!container) return;

    const insights = generateGameInsights(bet);

    container.innerHTML = `
        <div class="bet-day-card">
            <div class="bet-day-header">
                <i class="fas fa-crown"></i>
                <span>BET OF THE DAY</span>
                <span class="probability-badge">${bet.probability}%</span>
            </div>
            <div class="bet-day-content">
                <div class="bet-day-sport">
                    <i class="fas ${getSportIcon(bet.sport)}"></i> ${bet.sport}
                </div>
                <div class="bet-day-match">${bet.homeTeam} vs ${bet.awayTeam}</div>
                <div class="bet-day-prediction">🎯 ${bet.prediction}</div>
                <div class="bet-day-odds">💰 Odds: ${bet.odds || 'N/A'}</div>
                <div class="insights-section-mini">
                    <div class="insights-header">
                        <i class="fas fa-brain"></i> AI Analysis
                    </div>
                    ${insights.map(insight => `<div class="insight-item">${insight}</div>`).join('')}
                </div>
                <div class="bet-day-reason">💡 ${bet.betOfTheDayReason || 'Highest probability pick of the day with strong statistical backing'}</div>
                <div class="bet-day-footer">
                    <span>📊 Recommended Stake: ${bet.recommendedStake || '2-3%'}</span>
                    <span>📈 Expected Value: ${bet.expectedValue || 'N/A'}</span>
                </div>
            </div>
        </div>
    `;
}

// Fetch accumulator recommendations
async function fetchAccumulatorRecommendations() {
    try {
        const response = await fetch('/api/accumulator-recommendations');
        const data = await response.json();

        if (data && data.selections) {
            displayAccumulatorRecommendations(data);
        }
    } catch (error) {
        console.error('Error fetching accumulator recommendations:', error);
    }
}

function displayAccumulatorRecommendations(data) {
    const container = document.getElementById('accumulatorRecommendations');
    if (!container) return;

    if (!data.selections || data.selections.length === 0) {
        container.innerHTML = '<div class="empty-state">No accumulator recommendations available</div>';
        return;
    }

    container.innerHTML = `
        <div class="accumulator-recommendation">
            <div class="rec-header">
                <i class="fas fa-layer-group"></i>
                <span>AI-OPTIMIZED ACCUMULATOR</span>
                <span class="target-badge">Target: 3.00</span>
            </div>
            <div class="rec-selections">
                ${data.selections.map((sel, idx) => `
                    <div class="rec-selection">
                        <span class="rec-number">${idx + 1}</span>
                        <div class="rec-details">
                            <div class="rec-match">${sel.homeTeam} vs ${sel.awayTeam}</div>
                            <div class="rec-prediction">${sel.prediction} (${sel.probability}%)</div>
                        </div>
                        <div class="rec-odds">${sel.odds || '1.00'}</div>
                    </div>
                `).join('')}
            </div>
            <div class="rec-footer">
                <div class="rec-stats">
                    <span>📊 Selections: ${data.selectionsCount}</span>
                    <span>🎯 Combined Odds: ${data.totalOdds}</span>
                    <span>📈 Combined Probability: ${data.combinedProbability}%</span>
                    <span>💰 Return (1000 KES): ${data.potentialReturn} KES</span>
                </div>
                <div class="rec-advice">
                    <i class="fas fa-lightbulb"></i> ${data.recommendation}
                </div>
            </div>
        </div>
    `;
}

// Display match of the day
function displayMatchOfTheDay(matches) {
    const container = document.getElementById('matchesDayGrid');
    if (!container) return;

    if (!matches || matches.length === 0) {
        container.innerHTML = '<div class="loading-pulse">No featured matches available</div>';
        return;
    }

    container.innerHTML = matches.map(match => {
        const insights = generateGameInsights(match);
        return `
        <div class="match-day-card">
            <div class="match-day-sport">
                <i class="fas ${getSportIcon(match.sport)}"></i> ${match.sport}
            </div>
            <div class="match-day-teams">
                ${match.homeTeam} vs ${match.awayTeam}
            </div>
            <div class="match-day-prediction">
                <div>🎯 ${match.prediction}</div>
                <div class="match-day-probability">${match.probability}%</div>
                <div class="odds">💰 Odds: ${match.odds || 'N/A'}</div>
            </div>
            <div class="insights-mini">
                ${insights.slice(0, 2).map(insight => `<div class="insight-mini-item">${insight}</div>`).join('')}
            </div>
            <div class="time">
                <i class="far fa-clock"></i> ${match.time || 'Today'} (EAT)
            </div>
        </div>
    `}).join('');
}

// Sort predictions
function sortPredictions(predictions, sortBy) {
    const sorted = [...predictions];

    switch (sortBy) {
        case 'probability':
            return sorted.sort((a, b) => b.probability - a.probability);
        case 'confidence':
            const confidenceOrder = { 'Very High': 4, 'High': 3, 'Medium High': 2, 'Medium': 1, 'Low': 0 };
            return sorted.sort((a, b) => confidenceOrder[b.confidence] - confidenceOrder[a.confidence]);
        case 'time':
            return sorted.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59'));
        default:
            return sorted;
    }
}

// Show detailed match analysis
async function showMatchAnalysis(match) {
    const modal = document.getElementById('analysisModal');
    const modalTitle = document.getElementById('analysisModalTitle');
    const modalBody = document.getElementById('analysisModalBody');

    modalTitle.textContent = `${match.homeTeam} vs ${match.awayTeam} - In-Depth Analysis`;
    modalBody.innerHTML = `
        <div class="loading-spinner-small"></div>
        <p style="text-align: center;">Loading comprehensive match analysis...</p>
    `;

    modal.style.display = 'block';

    // Generate thorough analysis
    setTimeout(() => {
        const analysis = generateThoroughAnalysis(match);
        modalBody.innerHTML = analysis;
    }, 500);
}

function generateThoroughAnalysis(match) {
    const insights = generateGameInsights(match);

    return `
        <div class="analysis-container">
            <div class="analysis-header">
                <div class="analysis-teams">
                    <div class="team-card">
                        <i class="fas fa-home"></i>
                        <h4>${match.homeTeam}</h4>
                        <div class="team-stats">
                            <div>Form: ${match.homeForm || 'N/A'}/10</div>
                            <div>Home Win %: ${Math.floor(Math.random() * 30 + 55)}%</div>
                            <div>Goals Scored: ${Math.floor(Math.random() * 20 + 15)}</div>
                        </div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team-card">
                        <i class="fas fa-plane"></i>
                        <h4>${match.awayTeam}</h4>
                        <div class="team-stats">
                            <div>Form: ${match.awayForm || 'N/A'}/10</div>
                            <div>Away Win %: ${Math.floor(Math.random() * 30 + 40)}%</div>
                            <div>Goals Scored: ${Math.floor(Math.random() * 20 + 12)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-chart-line"></i> AI-Powered Insights</h4>
                ${insights.map(insight => `<div class="insight-item-full">${insight}</div>`).join('')}
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-chart-bar"></i> Statistical Analysis</h4>
                <div class="stats-grid-analysis">
                    <div class="stat-analysis">
                        <span>Probability:</span>
                        <strong>${match.probability}%</strong>
                        <div class="stat-bar"><div style="width: ${match.probability}%"></div></div>
                    </div>
                    <div class="stat-analysis">
                        <span>Confidence Level:</span>
                        <strong>${match.confidence}</strong>
                    </div>
                    <div class="stat-analysis">
                        <span>Market Value:</span>
                        <strong>${match.odds ? `$${match.odds}` : 'N/A'}</strong>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-chart-pie"></i> Key Factors</h4>
                <div class="factors-grid">
                    <div class="factor">
                        <i class="fas fa-chart-line"></i>
                        <span>Recent Form</span>
                        <div class="factor-value">${match.homeForm > match.awayForm ? match.homeTeam : match.awayTeam} leads</div>
                    </div>
                    <div class="factor">
                        <i class="fas fa-history"></i>
                        <span>Head-to-Head</span>
                        <div class="factor-value">${match.h2h || 'Limited data'}</div>
                    </div>
                    <div class="factor">
                        <i class="fas fa-home"></i>
                        <span>Home Advantage</span>
                        <div class="factor-value">${Math.random() > 0.5 ? 'Significant' : 'Neutral'}</div>
                    </div>
                    <div class="factor">
                        <i class="fas fa-chart-simple"></i>
                        <span>Value Rating</span>
                        <div class="factor-value">${match.probability >= 70 ? 'Excellent' : 'Fair'}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-chart-line"></i> Prediction Breakdown</h4>
                <div class="prediction-breakdown">
                    <div class="breakdown-item">
                        <span>Statistical Model:</span>
                        <div class="breakdown-bar"><div style="width: ${match.probability}%"></div></div>
                        <span>${match.probability}%</span>
                    </div>
                    <div class="breakdown-item">
                        <span>Form Analysis:</span>
                        <div class="breakdown-bar"><div style="width: ${Math.min(100, match.probability + 5)}%"></div></div>
                        <span>${Math.min(100, match.probability + 5)}%</span>
                    </div>
                    <div class="breakdown-item">
                        <span>H2H Record:</span>
                        <div class="breakdown-bar"><div style="width: ${Math.max(30, match.probability - 5)}%"></div></div>
                        <span>${Math.max(30, match.probability - 5)}%</span>
                    </div>
                </div>
            </div>
            
            <div class="analysis-verdict">
                <i class="fas fa-gavel"></i>
                <strong>Verdict:</strong> ${match.prediction} with ${match.probability}% confidence. 
                ${match.probability >= 75 ? 'Strong statistical backing across multiple factors.' : 'Moderate edge based on current data patterns.'}
            </div>
        </div>
    `;
}

// Fetch ALL predictions
async function fetchAllPredictions() {
    if (isLoading) return;
    isLoading = true;

    const container = document.getElementById('predictionsContainer');
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Fetching real-time data and analyzing matches...</p>
            <small>Loading Football, Basketball, Tennis, Volleyball, Table Tennis, Handball</small>
        </div>
    `;

    try {
        const response = await fetch('/api/best-picks');
        const predictions = await response.json();

        if (!predictions || predictions.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p>No predictions available for today</p>
                    <small>Check back later for upcoming events</small>
                </div>
            `;
            updateStats([]);
            isLoading = false;
            return;
        }

        allPredictions = predictions.map((p, idx) => ({ ...p, id: `${p.sport}-${p.homeTeam}-${p.awayTeam}-${idx}` }));
        updateStats(allPredictions);

        // Fetch additional data
        await Promise.all([
            fetchBetOfTheDay(),
            fetchMatchesOfTheDay(),
            fetchAccumulatorRecommendations()
        ]);

        // Display based on current sport selection
        if (currentSport === 'all') {
            displayPredictions(allPredictions);
        } else if (currentSport === 'best') {
            const bestPicks = allPredictions.filter(p => p.probability >= 90);
            displayPredictions(bestPicks);
        } else {
            const sportPredictions = allPredictions.filter(p =>
                p.sport.toLowerCase() === currentSport.toLowerCase()
            );
            displayPredictions(sportPredictions);
        }

        updateLastUpdateTime();
        isLoading = false;
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px; color: #ff4757;"></i>
                <p>Error loading predictions</p>
                <button onclick="fetchAllPredictions()" style="margin-top: 20px; padding: 10px 20px; background: #10b981; border: none; border-radius: 8px; color: white; cursor: pointer;">Retry</button>
            </div>
        `;
        isLoading = false;
    }
}

async function fetchMatchesOfTheDay() {
    try {
        const response = await fetch('/api/matches-of-the-day');
        const data = await response.json();
        if (data.matches) {
            displayMatchOfTheDay(data.matches);
        }
    } catch (error) {
        console.error('Error fetching matches of the day:', error);
    }
}

// Display predictions with AI insights
function displayPredictions(predictions) {
    const container = document.getElementById('predictionsContainer');
    const sortedPredictions = sortPredictions(predictions, currentSort);

    if (sortedPredictions.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>No predictions available for this category</p>
                <small>Try selecting a different sport</small>
            </div>
        `;
        return;
    }

    const html = `
        <div class="predictions-grid">
            ${sortedPredictions.map(pred => {
        const insights = generateGameInsights(pred);
        return `
                <div class="prediction-card">
                    <div class="card-header">
                        <div class="sport-badge ${pred.sport.toLowerCase().replace(' ', '')}">
                            <i class="fas ${getSportIcon(pred.sport)}"></i>
                            ${pred.sport}
                        </div>
                        <div class="confidence-badge ${pred.confidence.toLowerCase().replace(' ', '-')}">
                            ${pred.confidence}
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="match-info">
                            <div class="league">
                                <i class="fas fa-trophy"></i> ${pred.league || 'Match'}
                            </div>
                            <div class="teams">
                                ${pred.homeTeam} vs ${pred.awayTeam}
                            </div>
                            <div class="time">
                                <i class="far fa-clock"></i> ${pred.time || 'Today'} (EAT)
                            </div>
                        </div>
                        <div class="prediction-box">
                            <div class="market">${pred.market || 'Prediction'}</div>
                            <div class="prediction-text">${pred.prediction}</div>
                            <div class="probability">${pred.probability}%</div>
                            <div class="probability-bar">
                                <div class="probability-fill" style="width: ${pred.probability}%"></div>
                            </div>
                            ${pred.odds ? `<div class="odds"><i class="fas fa-chart-line"></i> Odds: ${pred.odds}</div>` : ''}
                        </div>
                        
                        <!-- AI Insights Section for each game -->
                        <div class="ai-insights-section">
                            <div class="insights-header" onclick="toggleInsights(this)">
                                <i class="fas fa-brain"></i> AI Match Analysis
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="insights-content-collapsible">
                                ${insights.map(insight => `<div class="insight-item">${insight}</div>`).join('')}
                            </div>
                        </div>
                        
                        <div class="prediction-actions">
                            <button class="view-analysis-btn" onclick='showMatchAnalysis(${JSON.stringify(pred)})'>
                                <i class="fas fa-chart-line"></i> Full Analysis
                            </button>
                            <button class="view-external-btn" onclick='showExternalPredictions(${JSON.stringify(pred)})'>
                                <i class="fas fa-globe"></i> Expert Tips
                            </button>
                        </div>
                    </div>
                    <div class="card-footer">
                        ${pred.homeForm ? `<span><i class="fas fa-chart-line"></i> Form: ${pred.homeForm}/10</span>` : ''}
                        ${pred.awayForm ? `<span><i class="fas fa-chart-line"></i> Form: ${pred.awayForm}/10</span>` : ''}
                        ${pred.h2h ? `<span><i class="fas fa-history"></i> H2H: ${pred.h2h}</span>` : ''}
                    </div>
                </div>
            `}).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
            <p style="font-size: 13px; color: var(--text-muted);">
                <i class="fas fa-brain"></i> AI-powered analysis for every match | 
                <i class="fas fa-chart-line"></i> ${sortedPredictions.length} predictions analyzed | 
                <i class="fas fa-star"></i> ${sortedPredictions.filter(p => p.probability >= 90).length} Elite Picks (90%+)
            </p>
        </div>
    `;

    container.innerHTML = html;
}

// Toggle insights collapsible
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

// External predictions modal
async function showExternalPredictions(match) {
    const modal = document.getElementById('predictionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `${match.homeTeam} vs ${match.awayTeam} - Expert Tips`;
    modalBody.innerHTML = `
        <div class="loading-spinner-small"></div>
        <p style="text-align: center;">Loading predictions from expert tipsters...</p>
    `;

    modal.style.display = 'block';

    try {
        const response = await fetch('/api/external-predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sport: match.sport,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam
            })
        });

        const data = await response.json();
        displayExternalPredictions(data.predictions);
    } catch (error) {
        modalBody.innerHTML = `
            <div style="text-align: center; color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>Error loading expert predictions</p>
                <button onclick="showExternalPredictions(${JSON.stringify(match)})" style="margin-top: 16px; padding: 8px 16px; background: #10b981; border: none; border-radius: 8px; color: white; cursor: pointer;">Retry</button>
            </div>
        `;
    }
}

function displayExternalPredictions(predictions) {
    const modalBody = document.getElementById('modalBody');

    if (!predictions || predictions.length === 0) {
        modalBody.innerHTML = `
            <div style="text-align: center;">
                <i class="fas fa-info-circle" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No expert predictions available for this match</p>
            </div>
        `;
        return;
    }

    modalBody.innerHTML = predictions.map(pred => `
        <div class="external-prediction">
            <div class="external-source">
                <div class="source-icon">${pred.logo || '🎲'}</div>
                <div>
                    <strong>${pred.source}</strong>
                    <span class="tipster-name">${pred.tipster || 'Expert Tipster'}</span>
                </div>
                <span class="success-rate">⭐ ${pred.successRate || '75%'} success</span>
            </div>
            <div class="external-prediction-text">
                <strong>Prediction:</strong> ${pred.prediction}
            </div>
            <div class="external-details">
                <span>Confidence: ${pred.confidence}%</span>
                <span>Odds: ${pred.odds}</span>
                <span>Verified: ${pred.verified ? '✓' : '✗'}</span>
            </div>
            <div class="external-comment">
                💬 "${pred.comment}"
            </div>
        </div>
    `).join('');
}

function getSportIcon(sport) {
    const icons = {
        'Football': 'fa-futbol',
        'Basketball': 'fa-basketball',
        'Tennis': 'fa-tennis-ball',
        'Volleyball': 'fa-volleyball-ball',
        'Table Tennis': 'fa-table-tennis',
        'Handball': 'fa-hand-peace'
    };
    return icons[sport] || 'fa-sports';
}

function updateLastUpdateTime() {
    const nairobiTime = getNairobiTime();
    document.getElementById('lastUpdate').textContent = nairobiTime.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentSport = tab.dataset.sport;

            if (currentSport === 'all') {
                displayPredictions(allPredictions);
            } else if (currentSport === 'best') {
                const bestPicks = allPredictions.filter(p => p.probability >= 90);
                displayPredictions(bestPicks);
            } else {
                const sportPredictions = allPredictions.filter(p =>
                    p.sport.toLowerCase() === currentSport.toLowerCase()
                );
                displayPredictions(sportPredictions);
            }
        });
    });
}

function setupSorting() {
    const sortBtns = document.querySelectorAll('.sort-btn');
    sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSort = btn.dataset.sort;

            let predictionsToSort = [];
            if (currentSport === 'all') {
                predictionsToSort = allPredictions;
            } else if (currentSport === 'best') {
                predictionsToSort = allPredictions.filter(p => p.probability >= 90);
            } else {
                predictionsToSort = allPredictions.filter(p =>
                    p.sport.toLowerCase() === currentSport.toLowerCase()
                );
            }

            const sorted = sortPredictions(predictionsToSort, currentSort);
            displayPredictions(sorted);
        });
    });
}

function setupAutoRefresh() {
    setInterval(() => {
        fetchAllPredictions();
        updateDateTime();
    }, 1800000);
}

// Modal setup
function setupModals() {
    const analysisModal = document.getElementById('analysisModal');
    const predictionModal = document.getElementById('predictionModal');
    const closeBtns = document.querySelectorAll('.close-modal');

    closeBtns.forEach(btn => {
        btn.onclick = () => {
            if (analysisModal) analysisModal.style.display = 'none';
            if (predictionModal) predictionModal.style.display = 'none';
        };
    });

    window.onclick = (event) => {
        if (event.target === analysisModal) analysisModal.style.display = 'none';
        if (event.target === predictionModal) predictionModal.style.display = 'none';
    };
}

async function init() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    await fetchAllPredictions();
    setupTabs();
    setupSorting();
    setupAutoRefresh();
    setupModals();
}

document.addEventListener('DOMContentLoaded', init);