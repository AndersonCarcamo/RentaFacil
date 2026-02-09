-- Eliminar listings de prueba duplicados
-- Ejecutar: psql -U postgres -d easyrent -f delete_duplicate_listings.sql

\echo 'Eliminando listings de prueba duplicados...'

DELETE FROM core.listings 
WHERE id IN (
  '2e8fbad4-37c4-4ea9-8932-6020e409120f',
  '1193f653-08b1-4d17-8c94-e2a029447961',
  'f0f53596-c44c-44c6-855f-43607a3267c3',
  '1cf4daac-274e-4d70-b2eb-30626c6237c0'
);

\echo '✓ Listings duplicados eliminados'
\echo ''
\echo 'Listing restante (el más reciente):'
SELECT id, title, created_at 
FROM core.listings 
WHERE id = 'bc7df704-b9a8-410a-baf5-2dc9c891839f';
