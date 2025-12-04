const fs = require('fs');
const path = require('path');

let cropsData = [];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { method, body } = req;

  if (method === 'GET') {
    return res.json({ success: true, crops: cropsData });
  }

  if (method === 'POST') {
    const action = req.url.split('/').pop();

    if (action === 'add') {
      const { cropName, quantity, minPrice, location, farmerId, farmerName } = body;
      const newCrop = {
        id: `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cropName, quantity: parseFloat(quantity), minPrice: parseFloat(minPrice),
        currentPrice: parseFloat(minPrice), location, farmerId,
        farmerName: farmerName || 'Unknown Farmer', status: 'active',
        bids: [], createdAt: new Date().toISOString()
      };
      cropsData.push(newCrop);
      return res.json({ success: true, crop: newCrop });
    }

    if (action === 'bid') {
      const { cropId, bidAmount, traderId, traderName } = body;
      const crop = cropsData.find(c => c.id === cropId);
      if (!crop || crop.status !== 'active') return res.status(400).json({ success: false, message: 'Invalid auction' });
      if (parseFloat(bidAmount) <= crop.currentPrice) return res.status(400).json({ success: false, message: 'Bid too low' });
      
      const newBid = { id: `bid_${Date.now()}`, traderId, traderName: traderName || 'Unknown Trader', amount: parseFloat(bidAmount), timestamp: new Date().toISOString() };
      crop.bids.push(newBid);
      crop.currentPrice = parseFloat(bidAmount);
      crop.highestBidder = { traderId, traderName: newBid.traderName };
      return res.json({ success: true, bid: newBid, crop });
    }

    if (action === 'end') {
      const { cropId, farmerId } = body;
      const crop = cropsData.find(c => c.id === cropId && c.farmerId === farmerId);
      if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
      crop.status = 'closed';
      return res.json({ success: true, message: 'Auction ended' });
    }

    if (action === 'payment') {
      const { cropId, traderId, paymentId } = body;
      const crop = cropsData.find(c => c.id === cropId);
      if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });
      crop.payment = { traderId, paymentId, timestamp: new Date().toISOString(), status: 'completed' };
      return res.json({ success: true, message: 'Payment recorded' });
    }
  }

  res.status(405).json({ success: false, message: 'Method not allowed' });
};
