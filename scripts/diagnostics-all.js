#!/usr/bin/env node
/**
 * Diagnóstico integral de conexiones para Verifireando
 * - Verifica DNS y salud del backend
 * - Prueba endpoints /healthz y /api/health
 * - Valida CORS con FRONTEND_URL
 * - Intenta handshake de Socket.IO
 * - Detecta posibles desajustes de VITE_API_URL/VITE_SOCKET_URL
 */

const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;

const DEFAULT_BACKEND_URL = 'https://verifireando-backend.onrender.com';

function parseEnvFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch (e) {
    return {};
  }
}

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function hostnameFromUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch (e) {
    return null;
  }
}

async function fetchJson(url, opts = {}) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch (_) { body = text; }
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function fetchHead(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return { ok: res.ok, status: res.status };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function testDns(host) {
  try {
    const result = await dns.lookup(host);
    return { ok: true, address: result.address, family: result.family };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function testCors(origin, url) {
  try {
    const res = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    return {
      ok: res.ok,
      status: res.status,
      allowOrigin
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function testSocketHandshake(baseUrl) {
  const t = Date.now();
  const url = `${baseUrl.replace(/\/$/, '')}/socket.io/?EIO=4&transport=polling&t=${t}`;
  try {
    const res = await fetch(url, { method: 'GET', headers: { 'Accept': '*/*' } });
    const text = await res.text();
    return { ok: res.ok, status: res.status, preview: text.slice(0, 80) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function statusLabel(result) {
  return result && result.ok ? 'PASS' : 'FAIL';
}

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const backendEnv = parseEnvFile(path.join(repoRoot, 'backend', '.env.production'));
  const frontendEnv = parseEnvFile(path.join(repoRoot, 'frontend', '.env.production'));

  const backendArg = getArg('backend');
  const backendUrl = backendArg || process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
  const apiUrlFromFrontend = frontendEnv.VITE_API_URL || '';
  const socketUrlFromFrontend = frontendEnv.VITE_SOCKET_URL || '';
  const frontendUrl = backendEnv.FRONTEND_URL || process.env.FRONTEND_URL || 'https://verifireando.vercel.app';

  const results = { meta: {}, checks: {} };
  results.meta = {
    time: new Date().toISOString(),
    nodeVersion: process.version,
    backendUrl,
    frontendUrl,
    apiUrlFromFrontend,
    socketUrlFromFrontend
  };

  // DNS
  const backendHost = hostnameFromUrl(backendUrl);
  results.checks.backendDns = await testDns(backendHost);
  results.checks.backendDns.status = statusLabel(results.checks.backendDns);

  // Health endpoints
  results.checks.healthz = await fetchJson(`${backendUrl}/healthz`);
  results.checks.healthz.status = statusLabel(results.checks.healthz);
  results.checks.apiHealth = await fetchJson(`${backendUrl}/api/health`);
  results.checks.apiHealth.status = statusLabel(results.checks.apiHealth);

  // CORS preflight
  results.checks.corsPreflight = await testCors(frontendUrl, `${backendUrl}/api/health`);
  results.checks.corsPreflight.status = statusLabel(results.checks.corsPreflight);

  // Socket handshake (contra backend y contra VITE_SOCKET_URL si difiere)
  results.checks.socketBackend = await testSocketHandshake(backendUrl);
  results.checks.socketBackend.status = statusLabel(results.checks.socketBackend);

  if (socketUrlFromFrontend && socketUrlFromFrontend !== backendUrl) {
    results.checks.socketFrontendTarget = await testSocketHandshake(socketUrlFromFrontend);
    results.checks.socketFrontendTarget.status = statusLabel(results.checks.socketFrontendTarget);
  }

  // API URL chequeo básico
  if (apiUrlFromFrontend) {
    const apiHost = hostnameFromUrl(apiUrlFromFrontend);
    results.checks.apiDnsFromFrontend = await testDns(apiHost);
    results.checks.apiDnsFromFrontend.status = statusLabel(results.checks.apiDnsFromFrontend);
    // Intento de HEAD a la raíz del API
    results.checks.apiHeadFromFrontend = await fetchHead(apiUrlFromFrontend.replace(/\/$/, ''));
    results.checks.apiHeadFromFrontend.status = statusLabel(results.checks.apiHeadFromFrontend);
  }

  // MONGO URI presencia (no conectamos desde aquí para no requerir drivers extra)
  const mongoUri = backendEnv.MONGODB_URI || backendEnv.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URI || null;
  results.checks.mongoUriPresence = { ok: !!mongoUri, valuePresent: !!mongoUri };
  results.checks.mongoUriPresence.status = statusLabel(results.checks.mongoUriPresence);
  if (mongoUri) {
    try {
      const hostMatch = mongoUri.match(/mongodb(?:\+srv)?:\/\/[^@]*@([^\/?]+)/);
      const mongoHost = hostMatch ? hostMatch[1] : null;
      if (mongoHost) {
        const dnsRes = await testDns(mongoHost);
        results.checks.mongoDns = dnsRes;
        results.checks.mongoDns.status = statusLabel(dnsRes);
      }
    } catch (e) {
      results.checks.mongoDns = { ok: false, error: e.message, status: 'FAIL' };
    }
  }

  // Sugerencias
  const suggestions = [];
  if (apiUrlFromFrontend.includes('vercel.app')) {
    suggestions.push('VITE_API_URL apunta a Vercel; cámbialo al backend en Render.');
  }
  if (socketUrlFromFrontend.includes('vercel.app')) {
    suggestions.push('VITE_SOCKET_URL apunta a Vercel; cámbialo al backend en Render.');
  }
  if (!results.checks.corsPreflight.ok) {
    suggestions.push('Revisa CORS: FRONTEND_URL en backend debe coincidir con tu dominio.');
  }
  if (!results.checks.healthz.ok || !results.checks.apiHealth.ok) {
    suggestions.push('Health endpoints fallan; revisa logs en Render y variables críticas (MONGODB_URI).');
  }
  results.suggestions = suggestions;

  // Salida
  const summary = Object.fromEntries(
    Object.entries(results.checks).map(([k, v]) => [k, v.status])
  );

  console.log('=== Diagnóstico de Conexiones ===');
  console.log(JSON.stringify({ meta: results.meta, summary, results }, null, 2));
}

main().catch(err => {
  console.error('Error en diagnóstico:', err);
  process.exit(1);
});