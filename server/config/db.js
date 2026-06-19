const mongoose = require('mongoose');
const { Resolver } = require('dns').promises;
const { URL } = require('url');

const resolveSrvUri = async (uri) => {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }
  try {
    const parsed = new URL(uri);
    const host = parsed.hostname;
    
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1']);
    
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
    if (!srvRecords || srvRecords.length === 0) {
      throw new Error('No SRV records found');
    }
    
    const hostsList = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
    
    let txtOptions = '';
    try {
      const txtRecords = await resolver.resolveTxt(host);
      if (txtRecords && txtRecords.length > 0) {
        txtOptions = txtRecords.flat().join('&');
      }
    } catch (txtErr) {
      // Ignored if TXT fails
    }
    
    const queryParams = new URLSearchParams(parsed.search);
    if (txtOptions) {
      const txtParams = new URLSearchParams(txtOptions);
      for (const [key, val] of txtParams.entries()) {
        if (!queryParams.has(key)) {
          queryParams.set(key, val);
        }
      }
    }
    
    if (!queryParams.has('ssl')) {
      queryParams.set('ssl', 'true');
    }
    
    const credentials = parsed.username ? `${parsed.username}:${parsed.password}@` : '';
    const database = parsed.pathname || '/';
    
    return `mongodb://${credentials}${hostsList}${database}?${queryParams.toString()}`;
  } catch (err) {
    console.warn(`⚠️ Custom DNS SRV resolution failed: ${err.message}`);
    return uri;
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/railguard';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connection Initialized: ${conn.connection.host}`);
  } catch (error) {
    if (uri.startsWith('mongodb+srv://') && (error.message.includes('querySrv') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED'))) {
      console.log('⚠️ Local DNS failed to resolve MongoDB SRV records. Attempting resolution via public DNS (Google/Cloudflare)...');
      try {
        const resolvedUri = await resolveSrvUri(uri);
        console.log('🔄 Reconnecting using resolved replica set connection string.');
        const conn = await mongoose.connect(resolvedUri);
        console.log(`✅ MongoDB Connection Initialized (Fallback): ${conn.connection.host}`);
        return;
      } catch (fallbackError) {
        console.error(`❌ Fallback MongoDB Connection Error: ${fallbackError.message}`);
      }
    }
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

