#!/usr/bin/env node

// Test directo de conexión a Supabase
const { Pool } = require('pg');

const connectionString = 'postgresql://toolgate_user:LM9DYPUW7OiX9yCX@db.xbgrndafikfttkxlgoct.supabase.co:5432/postgres?sslmode=require';

console.log('🧪 Probando conexión directa a Supabase...');
console.log('URL:', connectionString.replace(/:[^:@]*@/, ':***@')); // Ocultar password

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('📡 Intentando conectar...');
    
    const client = await pool.connect();
    console.log('✅ Conexión exitosa!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Test events table
    const eventsResult = await client.query('SELECT COUNT(*) FROM events');
    console.log('📋 Events table exists, count:', eventsResult.rows[0].count);
    
    // Test approvals table
    const approvalsResult = await client.query('SELECT COUNT(*) FROM approvals');
    console.log('📋 Approvals table exists, count:', approvalsResult.rows[0].count);
    
    client.release();
    console.log('🎉 Test completo - Conexión funciona perfectamente!');
    
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Problema: No se puede resolver el hostname');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Problema: Conexión rechazada (puerto/firewall)');
    } else if (error.code === 'ENETUNREACH') {
      console.log('💡 Problema: Red no alcanzable (IPv6/IPv4)');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
