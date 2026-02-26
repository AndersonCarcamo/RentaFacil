# Baseline Report Template

Fecha: YYYY-MM-DD  
Entorno: local / staging / prod-like  
Commit: <hash>  
Ejecutor: <nombre>

## 1) Configuración de prueba

- Base URL API:
- Dataset usado:
- Variables clave (AUTH_TOKEN, API_PREFIX, etc.):
- Capacidad de infraestructura (CPU/RAM/DB):

## 2) Escenarios ejecutados

- search_read_heavy (3 corridas)
- listing_detail_read_heavy (3 corridas)
- mixed_crud_listings (3 corridas)

## 3) Resultados consolidados

Pegar tabla desde `BASELINE_REPORT.md` generado automáticamente.

## 4) Variabilidad y reproducibilidad

- p95 spread por escenario:
- error rate spread por escenario:
- ¿Cumple reproducibilidad? (sí/no + justificación)

## 5) Hallazgos

- Cuellos de botella observados:
- Endpoints más lentos:
- Fallos más frecuentes:

## 6) Recomendaciones

- Ajustes inmediatos:
- Riesgos detectados:
- Próxima fase propuesta:
