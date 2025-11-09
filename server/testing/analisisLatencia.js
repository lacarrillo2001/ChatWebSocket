// analisisLatencia.js
const fs = require('fs');

const logFile = 'emisor_logs.json';
const outputFile = 'resultadoLatencia.json';

if (!fs.existsSync(logFile)) {
  console.error('❌ No se encontró el archivo de logs del emisor.');
  process.exit(1);
}

const logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
const latencias = logs.filter(l => l.type === 'echo').map(l => l.latencyMs);

if (latencias.length === 0) {
  console.log('⚠️ No se encontraron mediciones de eco.');
  process.exit();
}

const promedio = latencias.reduce((a, b) => a + b, 0) / latencias.length;
const min = Math.min(...latencias);
const max = Math.max(...latencias);

const resultado = {
  totalMediciones: latencias.length,
  latenciaPromedio_ms: promedio.toFixed(2),
  latenciaMinima_ms: min,
  latenciaMaxima_ms: max,
  fecha: new Date().toISOString(),
};

console.log('📊 Resultado del análisis de latencia:');
console.table(resultado);

fs.writeFileSync(outputFile, JSON.stringify(resultado, null, 2), 'utf-8');
console.log(`📁 Resultado guardado en ${outputFile}`);
