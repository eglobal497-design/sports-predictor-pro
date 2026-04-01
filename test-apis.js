const axios = require('axios');
require('dotenv').config();

async function testAPIs() {
  console.log('Testing APIs...\n');

  // Test Football-Data.org
  console.log('1. Testing Football-Data.org...');
  try {
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      params: { dateFrom: new Date().toISOString().split('T')[0], limit: 5 },
      headers: { 'X-Auth-Token': 'eae6429d362b4ad08ec28ea7e0037c07' }
    });
    console.log(`✓ Found ${response.data.matches?.length || 0} matches`);
  } catch (error) {
    console.log(`✗ Error: ${error.response?.status || error.message}`);
  }

  // Test The Odds API - Basketball
  console.log('\n2. Testing The Odds API - Basketball...');
  try {
    const response = await axios.get('https://api.the-odds-api.com/v4/sports/basketball_nba/odds', {
      params: { apiKey: '980db86333e41aba7d8fd71f5761cc77', regions: 'us', markets: 'h2h' }
    });
    console.log(`✓ Found ${response.data.length} NBA games`);
  } catch (error) {
    console.log(`✗ Error: ${error.response?.status || error.message}`);
  }

  // Test The Odds API - Football
  console.log('\n3. Testing The Odds API - Football...');
  try {
    const response = await axios.get('https://api.the-odds-api.com/v4/sports/soccer/odds', {
      params: { apiKey: '980db86333e41aba7d8fd71f5761cc77', regions: 'uk', markets: 'h2h' }
    });
    console.log(`✓ Found ${response.data.length} football matches`);
  } catch (error) {
    console.log(`✗ Error: ${error.response?.status || error.message}`);
  }

  // Test The Odds API - Tennis
  console.log('\n4. Testing The Odds API - Tennis...');
  try {
    const response = await axios.get('https://api.the-odds-api.com/v4/sports/tennis_atp/odds', {
      params: { apiKey: '980db86333e41aba7d8fd71f5761cc77', regions: 'uk', markets: 'h2h' }
    });
    console.log(`✓ Found ${response.data.length} ATP matches`);
  } catch (error) {
    console.log(`✗ Error: ${error.response?.status || error.message}`);
  }
}

testAPIs();