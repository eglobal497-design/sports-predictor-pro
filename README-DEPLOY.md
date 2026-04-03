# Deploy to Render

## Steps to Deploy

1. Push your code to GitHub repository

2. Log into Render (render.com)

3. Click "New +" and select "Web Service"

4. Connect your GitHub repository

5. Configure the service:
   - Name: sports-predictor-pro
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node src/server.js`

6. Add Environment Variables:
   - RAPIDAPI_KEY = your_rapidapi_key
   - THEODDS_API_KEY = your_theodds_api_key
   - FOOTBALL_API_KEY = your_football_api_key
   - NODE_ENV = production

7. Click "Create Web Service"

## Important Notes for Free Tier

- The service will spin down after 15 minutes of inactivity
- First request after inactivity may take 20-30 seconds to respond
- Database uses in-memory storage (data resets on restart)
- For persistent storage, upgrade to paid tier

## API Endpoints

- Main App: https://your-app.onrender.com
- API Status: https://your-app.onrender.com/api/status
- Predictions: https://your-app.onrender.com/api/best-picks