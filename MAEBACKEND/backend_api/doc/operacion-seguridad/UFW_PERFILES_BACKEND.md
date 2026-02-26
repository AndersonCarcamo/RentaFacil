# UFW perfiles para backend (Tailscale / Público)

Esta guía guarda una configuración reusable de firewall para EasyRent backend en Ubuntu.

## 1) Estado actual recomendado

- Backend/API detrás de Nginx en puertos `8080` y `8443`.
- PostgreSQL en host (`5432`) solo para Tailscale + red Docker.
- Redis en localhost (`127.0.0.1`) o red interna.

---

## 2) Backup de reglas actuales

```bash
sudo ufw status numbered
sudo cp /etc/ufw/user.rules /etc/ufw/user.rules.bak_$(date +%F_%H%M%S)
sudo cp /etc/ufw/user6.rules /etc/ufw/user6.rules.bak_$(date +%F_%H%M%S)
```

---

## 3) Perfil A: privado por Tailscale (recomendado hoy)

Este perfil bloquea acceso público a API y deja acceso solo por `tailscale0`.

```bash
sudo ufw deny 8080/tcp
sudo ufw deny 8443/tcp
sudo ufw allow in on tailscale0 to any port 8080 proto tcp
sudo ufw allow in on tailscale0 to any port 8443 proto tcp
sudo ufw reload
sudo ufw status numbered
```

### PostgreSQL (mantener privado)

```bash
sudo ufw delete allow 5432/tcp 2>/dev/null || true
sudo ufw allow in on tailscale0 to any port 5432 proto tcp
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port 5432 proto tcp
sudo ufw allow in from 172.19.0.0/16 to any port 5432 proto tcp
sudo ufw reload
sudo ufw status numbered
```

> Nota: `172.19.0.0/16` corresponde a la red Docker Compose observada en este servidor.

---

## 4) Perfil B: público para frontend en Vercel

Usar solo cuando quieras exponer API públicamente.

```bash
sudo ufw allow 8080/tcp
sudo ufw allow 8443/tcp
sudo ufw reload
sudo ufw status numbered
```

### Endurecimiento mínimo si abres público

- Mantener PostgreSQL cerrado públicamente (solo tailscale/docker).
- Configurar `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` estrictos.
- Aplicar rate limit en Nginx para endpoints de auth.
- Recomendado: mover a `443` con TLS real y dominio.

---

## 5) Verificación rápida

### En servidor

```bash
sudo ss -ltnp | grep -E ':8080|:8443|:5432|:6379'
sudo ufw status numbered
```

### Localhost

```bash
sudo nmap -Pn -p 8080,8443,5432,6379 127.0.0.1
```

### Desde otro equipo (sin Tailscale)

- Perfil A (privado): `8080/8443` deben aparecer cerrados/filtrados.
- Perfil B (público): `8080/8443` deben responder.

---

## 6) Rollback rápido (si te bloqueas)

Ejecutar desde consola local del servidor:

```bash
sudo ufw disable
sudo ufw enable
sudo ufw status numbered
```

Si restauras backup manual:

```bash
sudo cp /etc/ufw/user.rules.bak_YYYY-MM-DD_HHMMSS /etc/ufw/user.rules
sudo cp /etc/ufw/user6.rules.bak_YYYY-MM-DD_HHMMSS /etc/ufw/user6.rules
sudo ufw reload
```

---

## 7) Checklist operación

- [ ] Perfil A o B aplicado según etapa.
- [ ] PostgreSQL no expuesto a internet.
- [ ] `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` alineados.
- [ ] Prueba de acceso desde equipo externo realizada.
