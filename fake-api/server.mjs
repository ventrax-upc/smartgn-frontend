/*
  SmartGN fake API.

  This server mirrors the public contracts of the four SmartGN backend
  services (IAM, installation/device management, payments/billing and
  support/maintenance) so the Angular SPA can be developed and demoed without
  the real infrastructure.

  Data is persisted back to fake-api/db.json after every write.
*/
import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_FILE = join(__dirname, 'db.json');
const PORT = process.env.PORT || 3000;

const db = JSON.parse(readFileSync(DB_FILE, 'utf8'));

function persist() {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(express.json());

function fail(res, status, code, message) {
  return res.status(status).json({ code, message, timestamp: new Date().toISOString() });
}

function tokenFor(user) {
  return `smartgn.${user.id}`;
}

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = token.startsWith('smartgn.') ? token.slice('smartgn.'.length) : '';
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.status !== 'ACTIVE') {
    return fail(res, 401, 'UNAUTHORIZED', 'Missing or invalid access token');
  }
  req.user = user;
  next();
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = token.startsWith('smartgn.') ? token.slice('smartgn.'.length) : '';
  req.user = db.users.find((u) => u.id === userId && u.status === 'ACTIVE') || null;
  next();
}

function isSuperAdmin(user) {
  return user?.role === 'SUPERADMIN';
}

function isPrincipalUser(user) {
  return user?.role === 'USER' && user?.accountKind === 'PRINCIPAL';
}

function principalId(user) {
  return user.accountKind === 'DELEGATED' ? user.principalAccountId : user.id;
}

function requireSuperAdmin(req, res, next) {
  if (!isSuperAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'SUPERADMIN role is required');
  }
  next();
}

function requirePrincipalUser(req, res, next) {
  if (!isPrincipalUser(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'A principal USER account is required');
  }
  next();
}

function profileFor(accountId) {
  return db.profiles.find((p) => p.accountId === accountId);
}

function displayName(accountId) {
  const profile = profileFor(accountId);
  return profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'SmartGN user';
}

function propertyOf(pointId) {
  const point = db.supplyPoints.find((p) => p.id === pointId);
  if (!point) return null;
  return db.properties.find((p) => p.id === point.propertyId) || null;
}

function enrichPoint(point) {
  const property = db.properties.find((p) => p.id === point.propertyId);
  return { ...point, propertyName: property?.name ?? '' };
}

function enrichInstallation(installation) {
  const property = db.properties.find((p) => p.id === installation.propertyId);
  const point = db.supplyPoints.find((p) => p.id === installation.pointId);
  const installer = db.installers.find((i) => i.id === installation.installerId);
  const device = db.devices.find((d) => d.id === installation.deviceId);
  return {
    ...installation,
    propertyName: property?.name ?? 'Provisional request',
    pointName: point?.locationName ?? 'Pending target',
    installerName: installer ? `${installer.firstName} ${installer.lastName}` : '',
    deviceSerialNumber: device?.serialNumber ?? '',
  };
}

function enrichDevice(device) {
  const property = db.properties.find((p) => p.id === device.propertyId);
  const point = db.supplyPoints.find((p) => p.id === device.pointId);
  return { ...device, propertyName: property?.name ?? '', pointName: point?.locationName ?? '' };
}

function canAccessPoint(user, point) {
  if (!point) return false;
  const property = db.properties.find((p) => p.id === point.propertyId);
  if (!property || !property.active) return false;
  if (isSuperAdmin(user)) return true;
  if (user.accountKind === 'PRINCIPAL') return property.accountId === user.id;
  const subuser = db.subusers.find((s) => s.id === user.id);
  return Boolean(subuser?.grants.some((g) => g.meterId === point.id));
}

function ownedProperty(user, id) {
  return db.properties.find((p) => p.id === id && p.accountId === user.id);
}

function nextDocument(order) {
  const sequence = 124 + db.paymentOrders.reduce((sum, o) => sum + o.documents.length, 0);
  return {
    id: `doc-${randomUUID()}`,
    orderId: order.id,
    type: order.reason === 'INSTALLATION' ? 'INVOICE' : 'RECEIPT',
    number: `F001-${String(sequence).padStart(6, '0')}`,
    issuedAt: new Date().toISOString(),
    total: order.amount,
    currency: order.currency,
    status: 'ISSUED',
  };
}

function settleOrder(order, methodId) {
  const method = db.paymentMethods.find(
    (m) => m.id === methodId && m.accountId === order.accountId && m.active,
  );
  if (!method) return null;
  order.status = 'PAID';
  order.confirmed_at = new Date().toISOString();
  order.attempts.push({
    id: `att-${randomUUID()}`,
    at: order.confirmed_at,
    status: 'PAID',
    providerReference: `LOCAL-${order.id.toUpperCase()}`,
  });
  const document = nextDocument(order);
  order.documents.push(document);
  db.billingDocuments.push(document.id);
  return order;
}

/* ------------------------------------------------------------------ */
/* Authentication                                                      */
/* ------------------------------------------------------------------ */

app.post('/api/v1/auth/sign-in', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user || user.status !== 'ACTIVE' || !user.password || user.password !== password) {
    return fail(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    accountKind: user.accountKind,
    token: tokenFor(user),
  });
});

app.post('/api/v1/auth/forgot-password', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  let resetToken = null;
  if (user) {
    resetToken = `reset.${user.id}.${Date.now()}`;
    user.resetToken = resetToken;
    persist();
  }
  res.status(202).json({
    message:
      'If the email is registered, you will receive instructions to reset your password.',
    // Exposed only by the demo server, never by the real backend.
    demoResetToken: resetToken,
  });
});

app.post('/api/v1/auth/reset-password', (req, res) => {
  const token = String(req.body?.token ?? '');
  const newPassword = String(req.body?.newPassword ?? '');
  if (newPassword.length < 8) {
    return fail(res, 400, 'INVALID_PASSWORD', 'Password must be at least 8 characters');
  }
  const user = db.users.find((u) => u.resetToken === token);
  if (!user) {
    return fail(res, 400, 'INVALID_TOKEN', 'The reset token is invalid or has expired');
  }
  user.password = newPassword;
  user.status = 'ACTIVE';
  delete user.resetToken;
  persist();
  res.status(204).send();
});

app.post('/api/v1/auth/activate-password', (req, res) => {
  const token = String(req.body?.activationToken ?? '');
  const newPassword = String(req.body?.newPassword ?? '');
  if (newPassword.length < 8) {
    return fail(res, 400, 'INVALID_PASSWORD', 'Password must be at least 8 characters');
  }
  const user = db.users.find((u) => u.activationToken === token);
  if (!user) {
    return fail(res, 400, 'INVALID_TOKEN', 'The activation token is invalid or has expired');
  }
  user.password = newPassword;
  user.status = 'ACTIVE';
  delete user.activationToken;
  const subuser = db.subusers.find((s) => s.id === user.id);
  if (subuser) subuser.status = 'ACTIVE';
  persist();
  res.status(204).send();
});

app.post('/api/v1/auth/change-password', authenticate, (req, res) => {
  const current = String(req.body?.currentPassword ?? '');
  const next = String(req.body?.newPassword ?? '');
  if (req.user.password !== current) {
    return fail(res, 400, 'CURRENT_PASSWORD_INVALID', 'The current password is incorrect');
  }
  if (next.length < 8) {
    return fail(res, 400, 'INVALID_PASSWORD', 'Password must be at least 8 characters');
  }
  req.user.password = next;
  req.user.sessionVersion += 1;
  persist();
  res.status(204).send();
});

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

app.get('/api/v1/profiles/me', authenticate, (req, res) => {
  const profile = profileFor(req.user.id);
  if (!profile) {
    return fail(res, 404, 'PROFILE_NOT_FOUND', 'The account does not have a profile yet');
  }
  res.json(profile);
});

app.post('/api/v1/profiles', authenticate, (req, res) => {
  if (profileFor(req.user.id)) {
    return fail(res, 409, 'PROFILE_EXISTS', 'The account already has a profile');
  }
  const profile = {
    id: `prf-${randomUUID()}`,
    accountId: req.user.id,
    firstName: String(req.body?.firstName ?? '').trim(),
    lastName: String(req.body?.lastName ?? '').trim(),
    phone: String(req.body?.phone ?? '').trim(),
    address: String(req.body?.address ?? '').trim(),
  };
  db.profiles.push(profile);
  persist();
  res.status(201).json(profile);
});

app.put('/api/v1/profiles/me', authenticate, (req, res) => {
  const profile = profileFor(req.user.id);
  if (!profile) {
    return fail(res, 404, 'PROFILE_NOT_FOUND', 'The account does not have a profile yet');
  }
  Object.assign(profile, {
    firstName: String(req.body?.firstName ?? '').trim(),
    lastName: String(req.body?.lastName ?? '').trim(),
    phone: String(req.body?.phone ?? '').trim(),
    address: String(req.body?.address ?? '').trim(),
  });
  persist();
  res.json(profile);
});

app.get('/api/v1/profiles/:id', authenticate, (req, res) => {
  const profile = db.profiles.find((p) => p.id === req.params.id);
  if (!profile) return fail(res, 404, 'PROFILE_NOT_FOUND', 'Profile not found');
  if (profile.accountId !== req.user.id && !isSuperAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'The profile belongs to another account');
  }
  res.json(profile);
});

app.put('/api/v1/profiles/:id', authenticate, (req, res) => {
  const profile = db.profiles.find((p) => p.id === req.params.id);
  if (!profile) return fail(res, 404, 'PROFILE_NOT_FOUND', 'Profile not found');
  if (profile.accountId !== req.user.id) {
    return fail(res, 403, 'FORBIDDEN', 'The profile belongs to another account');
  }
  Object.assign(profile, {
    firstName: String(req.body?.firstName ?? '').trim(),
    lastName: String(req.body?.lastName ?? '').trim(),
    phone: String(req.body?.phone ?? '').trim(),
    address: String(req.body?.address ?? '').trim(),
  });
  persist();
  res.json(profile);
});

/* ------------------------------------------------------------------ */
/* Subusers and grants                                                 */
/* ------------------------------------------------------------------ */

app.get('/api/v1/subusers', authenticate, requirePrincipalUser, (req, res) => {
  res.json(db.subusers.filter((s) => s.accountId === req.user.id));
});

app.post('/api/v1/subusers', authenticate, requirePrincipalUser, (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const firstName = String(req.body?.firstName ?? '').trim();
  const lastName = String(req.body?.lastName ?? '').trim();
  if (!email || !firstName || !lastName) {
    return fail(res, 400, 'INVALID_INPUT', 'Email, first name and last name are required');
  }
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return fail(res, 409, 'EMAIL_TAKEN', 'This email is already registered');
  }
  const activationToken = `act-${randomUUID()}`;
  const account = {
    id: `usr-${randomUUID()}`,
    email,
    password: null,
    role: 'USER',
    accountKind: 'DELEGATED',
    status: 'PENDING_ACTIVATION',
    principalAccountId: req.user.id,
    sessionVersion: 1,
    activationToken,
  };
  db.users.push(account);
  const profile = {
    id: `prf-${randomUUID()}`,
    accountId: account.id,
    firstName,
    lastName,
    phone: '',
    address: '',
  };
  db.profiles.push(profile);
  const subuser = {
    id: account.id,
    accountId: req.user.id,
    email,
    firstName,
    lastName,
    role: 'USER',
    accountKind: 'DELEGATED',
    status: account.status,
    principalAccountId: req.user.id,
    createdAt: new Date().toISOString(),
    grants: [],
  };
  db.subusers.push(subuser);
  persist();
  res.status(201).json({ ...subuser, activationToken });
});

app.put('/api/v1/subusers/:id/grants', authenticate, requirePrincipalUser, (req, res) => {
  const subuser = db.subusers.find(
    (s) => s.id === req.params.id && s.accountId === req.user.id,
  );
  if (!subuser) return fail(res, 404, 'NOT_FOUND', 'Subuser not found');
  const meterId = String(req.body?.meterId ?? '');
  const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
  const point = db.supplyPoints.find((p) => p.id === meterId);
  const property = point ? db.properties.find((p) => p.id === point.propertyId) : null;
  if (!point || property?.accountId !== req.user.id) {
    return fail(res, 404, 'NOT_FOUND', 'Supply point not found');
  }
  const existing = subuser.grants.find((g) => g.meterId === meterId);
  if (existing) existing.permissions = permissions;
  else subuser.grants.push({ meterId, permissions });
  persist();
  res.status(204).send();
});

app.get('/api/v1/subusers/:id/grants/:meterId', authenticate, requirePrincipalUser, (req, res) => {
  const subuser = db.subusers.find(
    (s) => s.id === req.params.id && s.accountId === req.user.id,
  );
  if (!subuser) return fail(res, 404, 'NOT_FOUND', 'Subuser not found');
  const grant = subuser.grants.find((g) => g.meterId === req.params.meterId);
  res.json(grant?.permissions ?? []);
});

app.delete('/api/v1/subusers/:id/grants/:meterId', authenticate, requirePrincipalUser, (req, res) => {
  const subuser = db.subusers.find(
    (s) => s.id === req.params.id && s.accountId === req.user.id,
  );
  if (!subuser) return fail(res, 404, 'NOT_FOUND', 'Subuser not found');
  subuser.grants = subuser.grants.filter((g) => g.meterId !== req.params.meterId);
  persist();
  res.status(204).send();
});

/* ------------------------------------------------------------------ */
/* Properties and supply points                                        */
/* ------------------------------------------------------------------ */

app.get('/api/v1/properties', authenticate, requirePrincipalUser, (req, res) => {
  res.json(db.properties.filter((p) => p.accountId === req.user.id));
});

app.post('/api/v1/properties', authenticate, requirePrincipalUser, (req, res) => {
  const property = {
    id: `prp-${randomUUID()}`,
    accountId: req.user.id,
    name: String(req.body?.name ?? '').trim(),
    address: String(req.body?.address ?? '').trim(),
    propertyType: String(req.body?.propertyType ?? 'HOUSE'),
    active: true,
    version: 0,
  };
  if (!property.name || !property.address) {
    return fail(res, 400, 'INVALID_INPUT', 'Name and address are required');
  }
  db.properties.push(property);
  persist();
  res.status(201).json(property);
});

app.get('/api/v1/properties/:id', authenticate, requirePrincipalUser, (req, res) => {
  const property = ownedProperty(req.user, req.params.id);
  if (!property) return fail(res, 404, 'NOT_FOUND', 'Property not found');
  res.json(property);
});

app.put('/api/v1/properties/:id', authenticate, requirePrincipalUser, (req, res) => {
  const property = ownedProperty(req.user, req.params.id);
  if (!property) return fail(res, 404, 'NOT_FOUND', 'Property not found');
  if (Number(req.body?.version) !== property.version) {
    return fail(res, 409, 'VERSION_CONFLICT', 'The property was modified by another session');
  }
  property.name = String(req.body?.name ?? property.name).trim();
  property.address = String(req.body?.address ?? property.address).trim();
  property.propertyType = String(req.body?.propertyType ?? property.propertyType);
  property.version += 1;
  persist();
  res.json(property);
});

app.delete('/api/v1/properties/:id', authenticate, requirePrincipalUser, (req, res) => {
  const property = ownedProperty(req.user, req.params.id);
  if (!property) return fail(res, 404, 'NOT_FOUND', 'Property not found');
  if (Number(req.query.version) !== property.version) {
    return fail(res, 409, 'VERSION_CONFLICT', 'The property was modified by another session');
  }
  property.active = false;
  property.version += 1;
  persist();
  res.json(property);
});

app.get('/api/v1/properties/:propertyId/supply-points', authenticate, requirePrincipalUser, (req, res) => {
  const property = ownedProperty(req.user, req.params.propertyId);
  if (!property) return fail(res, 404, 'NOT_FOUND', 'Property not found');
  res.json(db.supplyPoints.filter((p) => p.propertyId === property.id));
});

app.post('/api/v1/properties/:propertyId/supply-points', authenticate, requirePrincipalUser, (req, res) => {
  const property = ownedProperty(req.user, req.params.propertyId);
  if (!property || !property.active) {
    return fail(res, 404, 'NOT_FOUND', 'Property not found');
  }
  const point = {
    id: `sp-${randomUUID()}`,
    propertyId: property.id,
    serialNumber: String(req.body?.serialNumber ?? '').trim().toUpperCase(),
    locationName: String(req.body?.locationName ?? '').trim(),
    active: true,
    version: 0,
  };
  if (!point.serialNumber || !point.locationName) {
    return fail(res, 400, 'INVALID_INPUT', 'Serial number and location are required');
  }
  if (db.supplyPoints.some((p) => p.serialNumber === point.serialNumber)) {
    return fail(res, 409, 'SERIAL_TAKEN', 'A supply point with that serial number already exists');
  }
  db.supplyPoints.push(point);
  persist();
  res.status(201).json(point);
});

app.get('/api/v1/supply-points/:id', authenticate, (req, res) => {
  const point = db.supplyPoints.find((p) => p.id === req.params.id);
  if (!point || !canAccessPoint(req.user, point)) {
    return fail(res, 404, 'NOT_FOUND', 'Supply point not found');
  }
  res.json(point);
});

app.put('/api/v1/supply-points/:id', authenticate, requirePrincipalUser, (req, res) => {
  const point = db.supplyPoints.find((p) => p.id === req.params.id);
  const property = point ? ownedProperty(req.user, point.propertyId) : null;
  if (!point || !property) return fail(res, 404, 'NOT_FOUND', 'Supply point not found');
  if (Number(req.body?.version) !== point.version) {
    return fail(res, 409, 'VERSION_CONFLICT', 'The supply point was modified by another session');
  }
  point.locationName = String(req.body?.locationName ?? point.locationName).trim();
  point.version += 1;
  persist();
  res.json(point);
});

app.get('/api/v1/meters', authenticate, (req, res) => {
  if (isSuperAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Principal or delegated USER is required');
  }
  const allPermissions = [
    'VIEW_CONSUMPTION',
    'VIEW_HISTORY',
    'VIEW_ALERTS',
    'USE_REPORTS',
    'USE_TICKETS',
    'USE_VISITS',
  ];
  if (req.user.accountKind === 'DELEGATED') {
    const subuser = db.subusers.find((s) => s.id === req.user.id);
    const result = [];
    for (const grant of subuser?.grants ?? []) {
      const point = db.supplyPoints.find((p) => p.id === grant.meterId && p.active);
      if (!point) continue;
      const property = db.properties.find(
        (p) => p.id === point.propertyId && p.accountId === subuser.accountId && p.active,
      );
      if (!property) continue;
      result.push({ meter: enrichPoint(point), permissions: grant.permissions });
    }
    return res.json(result);
  }
  const result = [];
  for (const property of db.properties.filter((p) => p.accountId === req.user.id && p.active)) {
    for (const point of db.supplyPoints.filter((p) => p.propertyId === property.id && p.active)) {
      result.push({ meter: enrichPoint(point), permissions: allPermissions });
    }
  }
  res.json(result);
});

/* ------------------------------------------------------------------ */
/* Installers                                                          */
/* ------------------------------------------------------------------ */

app.get('/api/v1/installers', authenticate, requireSuperAdmin, (_req, res) => {
  res.json(db.installers);
});

app.get('/api/v1/installers/:id', authenticate, requireSuperAdmin, (req, res) => {
  const installer = db.installers.find((i) => i.id === req.params.id);
  if (!installer) return fail(res, 404, 'NOT_FOUND', 'Installer not found');
  res.json(installer);
});

app.post('/api/v1/installers', authenticate, requireSuperAdmin, (req, res) => {
  const installer = {
    id: `ins-${randomUUID()}`,
    firstName: String(req.body?.firstName ?? '').trim(),
    lastName: String(req.body?.lastName ?? '').trim(),
    identification: String(req.body?.identification ?? '').trim(),
    phone: String(req.body?.phone ?? '').trim(),
    email: String(req.body?.email ?? '').trim(),
    enabled: true,
    version: 0,
    accreditationCode: String(req.body?.accreditationCode ?? '').trim(),
    available: Boolean(req.body?.available),
  };
  if (!installer.firstName || !installer.lastName || !installer.accreditationCode) {
    return fail(res, 400, 'INVALID_INPUT', 'Name and accreditation code are required');
  }
  db.installers.push(installer);
  persist();
  res.status(201).json(installer);
});

app.put('/api/v1/installers/:id', authenticate, requireSuperAdmin, (req, res) => {
  const installer = db.installers.find((i) => i.id === req.params.id);
  if (!installer) return fail(res, 404, 'NOT_FOUND', 'Installer not found');
  if (Number(req.body?.version) !== installer.version) {
    return fail(res, 409, 'VERSION_CONFLICT', 'The installer was modified by another session');
  }
  const input = req.body?.installer ?? {};
  Object.assign(installer, {
    firstName: String(input.firstName ?? installer.firstName).trim(),
    lastName: String(input.lastName ?? installer.lastName).trim(),
    identification: String(input.identification ?? installer.identification).trim(),
    phone: String(input.phone ?? installer.phone).trim(),
    email: String(input.email ?? installer.email).trim(),
    accreditationCode: String(input.accreditationCode ?? installer.accreditationCode).trim(),
    available: Boolean(input.available),
    version: installer.version + 1,
  });
  persist();
  res.json(installer);
});

app.patch('/api/v1/installers/:id/status', authenticate, requireSuperAdmin, (req, res) => {
  const installer = db.installers.find((i) => i.id === req.params.id);
  if (!installer) return fail(res, 404, 'NOT_FOUND', 'Installer not found');
  if (Number(req.body?.version) !== installer.version) {
    return fail(res, 409, 'VERSION_CONFLICT', 'The installer was modified by another session');
  }
  installer.enabled = Boolean(req.body?.enabled);
  installer.version += 1;
  persist();
  res.json(installer);
});

/* ------------------------------------------------------------------ */
/* Installations                                                       */
/* ------------------------------------------------------------------ */

app.get('/api/v1/installations', authenticate, requireSuperAdmin, (req, res) => {
  let items = db.installations;
  if (req.query.status) items = items.filter((i) => i.status === req.query.status);
  res.json([...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(enrichInstallation));
});

app.post('/api/v1/installations', optionalAuth, (req, res) => {
  const propertyId = String(req.body?.propertyId ?? '');
  const pointId = String(req.body?.pointId ?? '');
  const property = db.properties.find((p) => p.id === propertyId);
  const point = db.supplyPoints.find((p) => p.id === pointId && p.propertyId === propertyId);
  if (!property || !point) {
    return fail(res, 400, 'INVALID_TARGET', 'A valid property and supply point are required');
  }
  const installation = {
    id: `stl-${randomUUID()}`,
    accountId: property.accountId,
    propertyId,
    pointId,
    installerId: null,
    status: 'PENDING',
    deviceId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    version: 0,
  };
  db.installations.push(installation);
  persist();
  res.status(201).json(enrichInstallation(installation));
});

app.get('/api/v1/installations/:id', authenticate, requireSuperAdmin, (req, res) => {
  const installation = db.installations.find((i) => i.id === req.params.id);
  if (!installation) return fail(res, 404, 'NOT_FOUND', 'Installation not found');
  res.json(enrichInstallation(installation));
});

app.post('/api/v1/installations/:id/assign', authenticate, requireSuperAdmin, (req, res) => {
  const installation = db.installations.find((i) => i.id === req.params.id);
  if (!installation) return fail(res, 404, 'NOT_FOUND', 'Installation not found');
  const installer = db.installers.find((i) => i.id === req.body?.installerId);
  if (!installer || !installer.enabled) {
    return fail(res, 400, 'INVALID_INSTALLER', 'An enabled installer is required');
  }
  installation.installerId = installer.id;
  installation.status = 'ASSIGNED';
  installation.version += 1;
  persist();
  res.json(enrichInstallation(installation));
});

app.patch('/api/v1/installations/:id/status', authenticate, requireSuperAdmin, (req, res) => {
  const installation = db.installations.find((i) => i.id === req.params.id);
  if (!installation) return fail(res, 404, 'NOT_FOUND', 'Installation not found');
  const status = String(req.body?.status ?? '');
  if (!['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return fail(res, 400, 'INVALID_STATUS', 'Unsupported installation transition');
  }
  if (status === 'IN_PROGRESS' && !installation.installerId) {
    return fail(res, 409, 'NOT_ASSIGNED', 'Assign an installer before starting the work');
  }
  installation.status = status;
  installation.completedAt = status === 'COMPLETED' ? new Date().toISOString() : null;
  installation.version += 1;
  persist();
  res.json(enrichInstallation(installation));
});

app.post('/api/v1/installations/:id/cancel', authenticate, requireSuperAdmin, (req, res) => {
  const installation = db.installations.find((i) => i.id === req.params.id);
  if (!installation) return fail(res, 404, 'NOT_FOUND', 'Installation not found');
  if (Number(req.body?.version) !== installation.version) {
    return fail(res, 409, 'VERSION_CONFLICT', 'The installation was modified by another session');
  }
  installation.status = 'CANCELLED';
  installation.version += 1;
  persist();
  res.json(enrichInstallation(installation));
});

/* ------------------------------------------------------------------ */
/* Devices                                                             */
/* ------------------------------------------------------------------ */

function provisioningReceipt(device) {
  return {
    device: enrichDevice(device),
    credential: {
      clientId: `smartgn-${device.serialNumber.toLowerCase()}`,
      username: `device-${device.id}`,
      password: `gn-${randomUUID().slice(0, 12)}`,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
    testMode: true,
  };
}

app.get('/api/v1/devices', authenticate, (req, res) => {
  let items = db.devices;
  if (!isSuperAdmin(req.user)) {
    const propertyIds = db.properties
      .filter((p) => p.accountId === principalId(req.user))
      .map((p) => p.id);
    items = items.filter((d) => propertyIds.includes(d.propertyId));
  }
  if (req.query.pointId) items = items.filter((d) => d.pointId === req.query.pointId);
  if (req.query.status) items = items.filter((d) => d.status === req.query.status);
  res.json(items.map(enrichDevice));
});

app.post('/api/v1/devices', authenticate, requireSuperAdmin, (req, res) => {
  const point = db.supplyPoints.find((p) => p.id === req.body?.supplyPointId);
  const installation = db.installations.find((i) => i.id === req.body?.installationId);
  const installer = db.installers.find((i) => i.id === req.body?.installerId);
  if (!point || !installation || !installer) {
    return fail(res, 400, 'INVALID_INPUT', 'Installation, supply point and installer are required');
  }
  const device = {
    id: req.body?.deviceId || `dev-${randomUUID()}`,
    serialNumber: String(req.body?.serialNumber ?? '').trim().toUpperCase(),
    accountId: installation.accountId,
    propertyId: installation.propertyId,
    pointId: point.id,
    installationId: installation.id,
    installerId: installer.id,
    location: String(req.body?.location ?? point.locationName).trim(),
    installedAt: req.body?.installedAt || new Date().toISOString(),
    status: 'PENDING',
    associationVersion: 1,
    brokerConfirmed: false,
    telemetryConfirmed: false,
    version: 1,
  };
  if (!device.serialNumber) {
    return fail(res, 400, 'INVALID_INPUT', 'Serial number is required');
  }
  db.devices.push(device);
  installation.deviceId = device.id;
  persist();
  res.status(202).json(provisioningReceipt(device));
});

app.get('/api/v1/devices/:id', authenticate, (req, res) => {
  const device = db.devices.find((d) => d.id === req.params.id);
  if (!device) return fail(res, 404, 'NOT_FOUND', 'Device not found');
  res.json(enrichDevice(device));
});

app.post('/api/v1/devices/:id/credentials/rotate', authenticate, requireSuperAdmin, (req, res) => {
  const device = db.devices.find((d) => d.id === req.params.id);
  if (!device) return fail(res, 404, 'NOT_FOUND', 'Device not found');
  device.brokerConfirmed = false;
  persist();
  res.status(202).json(provisioningReceipt(device));
});

app.post('/api/v1/devices/:id/credentials/revoke', authenticate, requireSuperAdmin, (req, res) => {
  const device = db.devices.find((d) => d.id === req.params.id);
  if (!device) return fail(res, 404, 'NOT_FOUND', 'Device not found');
  device.status = 'REVOKED';
  device.brokerConfirmed = false;
  device.telemetryConfirmed = false;
  device.version += 1;
  persist();
  res.status(202).json(enrichDevice(device));
});

app.post('/api/v1/devices/:id/associations', authenticate, requireSuperAdmin, (req, res) => {
  const device = db.devices.find((d) => d.id === req.params.id);
  const installation = db.installations.find((i) => i.id === req.body?.installationId);
  if (!device || !installation) {
    return fail(res, 404, 'NOT_FOUND', 'Device or installation not found');
  }
  device.installationId = installation.id;
  device.propertyId = installation.propertyId;
  device.pointId = installation.pointId;
  device.associationVersion += 1;
  device.status = 'PENDING';
  device.brokerConfirmed = false;
  device.telemetryConfirmed = false;
  device.version += 1;
  persist();
  res.status(202).json(provisioningReceipt(device));
});

/* ------------------------------------------------------------------ */
/* Support (mirrors smartgn-support-maintenance)                       */
/* ------------------------------------------------------------------ */

function ticketById(id) {
  return db.tickets.find((ticket) => ticket.ticketId === id);
}

function visitById(id) {
  return db.visits.find((visit) => visit.visitId === id);
}

function canAccessTicket(user, ticket) {
  if (!ticket) return false;
  if (isSuperAdmin(user)) return true;
  if (ticket.principalAccountId !== principalId(user)) return false;
  const meter = db.supplyPoints.find((point) => point.id === ticket.meterId);
  return canAccessPoint(user, meter);
}

function canAccessVisit(user, visit) {
  return Boolean(visit) && canAccessTicket(user, ticketById(visit.ticketId));
}

function requireTicketAccess(req, res, ticket) {
  if (!canAccessTicket(req.user, ticket)) {
    fail(res, 403, 'FORBIDDEN', 'This ticket belongs to another account');
    return false;
  }
  return true;
}

/* Knowledge articles ------------------------------------------------ */

app.get('/api/v1/support/articles', authenticate, (_req, res) => {
  res.json(
    db.articles
      .filter((article) => article.active)
      .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')),
  );
});

app.post('/api/v1/support/articles', authenticate, requireSuperAdmin, (req, res) => {
  const title = String(req.body?.title ?? '').trim();
  const category = String(req.body?.category ?? '').trim();
  const contentReference = String(req.body?.contentReference ?? '').trim();
  if (!title || !category || !contentReference) {
    return fail(res, 400, 'INVALID_INPUT', 'Title, category and content reference are required');
  }
  const article = {
    articleId: `art-${randomUUID()}`,
    title,
    category,
    contentReference,
    publishedAt: new Date().toISOString(),
    active: true,
  };
  db.articles.push(article);
  persist();
  res.status(201).json(article);
});

/* Technicians ------------------------------------------------------- */

app.get('/api/v1/support/technicians', authenticate, (_req, res) => {
  res.json(db.technicians.filter((technician) => technician.available && technician.active));
});

app.post('/api/v1/support/technicians', authenticate, requireSuperAdmin, (req, res) => {
  const fullName = String(req.body?.fullName ?? '').trim();
  const accreditationCode = String(req.body?.accreditationCode ?? '').trim();
  const email = String(req.body?.email ?? '').trim();
  const phone = String(req.body?.phone ?? '').trim();
  if (!fullName || !accreditationCode || !email || !phone) {
    return fail(res, 400, 'INVALID_INPUT', 'Full name, accreditation code, email and phone are required');
  }
  if (db.technicians.some((technician) => technician.accreditationCode === accreditationCode)) {
    return fail(res, 409, 'DUPLICATE_ACCREDITATION', 'The accreditation code is already registered');
  }
  const technician = {
    technicianId: `tec-${randomUUID()}`,
    fullName,
    accreditationCode,
    email,
    phone,
    available: true,
    active: true,
  };
  db.technicians.push(technician);
  persist();
  res.status(201).json(technician);
});

/* Tickets ----------------------------------------------------------- */

app.get('/api/v1/support/tickets', authenticate, (req, res) => {
  const items = isSuperAdmin(req.user)
    ? db.tickets
    : db.tickets.filter((ticket) => canAccessTicket(req.user, ticket));
  res.json([...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
});

app.post('/api/v1/support/tickets', authenticate, (req, res) => {
  if (isSuperAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'SUPERADMIN cannot open customer tickets');
  }
  const meterId = String(req.body?.meterId ?? '').trim();
  const subject = String(req.body?.subject ?? '').trim();
  const message = String(req.body?.message ?? '').trim();
  if (!meterId || !subject || !message) {
    return fail(res, 400, 'INVALID_INPUT', 'Meter, subject and message are required');
  }
  const meter = db.supplyPoints.find((point) => point.id === meterId);
  if (!meter || !canAccessPoint(req.user, meter)) {
    return fail(res, 404, 'NOT_FOUND', 'Supply point not found');
  }
  const ticket = {
    ticketId: `tkt-${randomUUID()}`,
    principalAccountId: principalId(req.user),
    meterId,
    subject,
    message,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    closedAt: null,
  };
  db.tickets.push(ticket);
  persist();
  res.status(201).json(ticket);
});

app.get('/api/v1/support/tickets/:ticketId', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  res.json(ticket);
});

app.put('/api/v1/support/tickets/:ticketId/close', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  const now = new Date().toISOString();
  ticket.status = 'CLOSED';
  ticket.closedAt = now;
  if (!ticket.resolvedAt) ticket.resolvedAt = now;
  persist();
  res.json(ticket);
});

/* Replies ----------------------------------------------------------- */

app.get('/api/v1/support/tickets/:ticketId/replies', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  res.json(
    db.ticketReplies
      .filter((reply) => reply.ticketId === ticket.ticketId)
      .sort((a, b) => a.postedAt.localeCompare(b.postedAt)),
  );
});

app.post('/api/v1/support/tickets/:ticketId/replies', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  const body = String(req.body?.body ?? '').trim();
  if (!body) return fail(res, 400, 'INVALID_INPUT', 'Reply body is required');
  const reply = {
    replyId: `rep-${randomUUID()}`,
    ticketId: ticket.ticketId,
    authorAccountId: req.user.id,
    body,
    postedAt: new Date().toISOString(),
  };
  db.ticketReplies.push(reply);
  persist();
  res.status(201).json(reply);
});

/* Photos ------------------------------------------------------------ */

app.get('/api/v1/support/tickets/:ticketId/photos', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  res.json(db.ticketPhotos.filter((photo) => photo.ticketId === ticket.ticketId));
});

app.post('/api/v1/support/tickets/:ticketId/photos', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  const objectReference = String(req.body?.objectReference ?? '').trim();
  if (!objectReference) {
    return fail(res, 400, 'INVALID_INPUT', 'An object reference is required');
  }
  const photo = {
    photoId: `pho-${randomUUID()}`,
    ticketId: ticket.ticketId,
    objectReference,
    uploadedByAccountId: req.user.id,
    uploadedAt: new Date().toISOString(),
  };
  db.ticketPhotos.push(photo);
  persist();
  res.status(201).json(photo);
});

/* Rating ------------------------------------------------------------ */

app.get('/api/v1/support/tickets/:ticketId/rating', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  const rating = db.serviceRatings.find((item) => item.ticketId === ticket.ticketId);
  if (!rating) return fail(res, 404, 'NOT_FOUND', 'The ticket has not been rated');
  res.json(rating);
});

app.post('/api/v1/support/tickets/:ticketId/rating', authenticate, (req, res) => {
  if (isSuperAdmin(req.user)) {
    return fail(res, 403, 'FORBIDDEN', 'Only the customer can rate the service');
  }
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  const score = Number(req.body?.score);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return fail(res, 400, 'INVALID_INPUT', 'The score must be between 1 and 5');
  }
  if (db.serviceRatings.some((item) => item.ticketId === ticket.ticketId)) {
    return fail(res, 409, 'ALREADY_RATED', 'The ticket already has a rating');
  }
  const now = new Date().toISOString();
  ticket.status = 'CLOSED';
  ticket.closedAt = now;
  if (!ticket.resolvedAt) ticket.resolvedAt = now;
  const rating = {
    ratingId: `rat-${randomUUID()}`,
    ticketId: ticket.ticketId,
    score,
    comment: String(req.body?.comment ?? '').trim() || null,
    ratedAt: now,
  };
  db.serviceRatings.push(rating);
  persist();
  res.status(201).json(rating);
});

/* Visits ------------------------------------------------------------ */

app.get('/api/v1/support/tickets/:ticketId/visits', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  res.json(db.visits.filter((visit) => visit.ticketId === ticket.ticketId));
});

app.post('/api/v1/support/tickets/:ticketId/visits', authenticate, (req, res) => {
  const ticket = ticketById(req.params.ticketId);
  if (!ticket) return fail(res, 404, 'NOT_FOUND', 'Ticket not found');
  if (!requireTicketAccess(req, res, ticket)) return;
  if (ticket.status === 'CLOSED') {
    return fail(res, 409, 'TICKET_CLOSED', 'A visit cannot be requested for a closed ticket');
  }
  const requestedWindowStart = req.body?.requestedWindowStart;
  const requestedWindowEnd = req.body?.requestedWindowEnd;
  if (!requestedWindowStart || !requestedWindowEnd) {
    return fail(res, 400, 'INVALID_INPUT', 'The visit window start and end are required');
  }
  ticket.status = 'VISIT_REQUESTED';
  const visit = {
    visitId: `vst-${randomUUID()}`,
    ticketId: ticket.ticketId,
    requestedWindowStart,
    requestedWindowEnd,
    status: 'REQUESTED',
    completedAt: null,
  };
  db.visits.push(visit);
  persist();
  res.status(201).json(visit);
});

app.post('/api/v1/support/visits/:visitId/assignments', authenticate, requireSuperAdmin, (req, res) => {
  const visit = visitById(req.params.visitId);
  if (!visit) return fail(res, 404, 'NOT_FOUND', 'Visit not found');
  const technician = db.technicians.find(
    (item) => item.technicianId === String(req.body?.technicianId ?? ''),
  );
  if (!technician) return fail(res, 404, 'NOT_FOUND', 'Technician not found');
  visit.status = 'ASSIGNED';
  technician.available = false;
  const assignment = {
    assignmentId: `asg-${randomUUID()}`,
    visitId: visit.visitId,
    technicianId: technician.technicianId,
    assignedAt: new Date().toISOString(),
    active: true,
  };
  db.technicianAssignments.push(assignment);
  persist();
  res.status(201).json(assignment);
});

app.get('/api/v1/support/visits/:visitId/diagnosis', authenticate, (req, res) => {
  const visit = visitById(req.params.visitId);
  if (!visit) return fail(res, 404, 'NOT_FOUND', 'Visit not found');
  if (!canAccessVisit(req.user, visit)) {
    return fail(res, 403, 'FORBIDDEN', 'This visit belongs to another account');
  }
  const diagnosis = db.visitDiagnoses.find((item) => item.visitId === visit.visitId);
  if (!diagnosis) return fail(res, 404, 'NOT_FOUND', 'The visit has no diagnosis yet');
  res.json(diagnosis);
});

app.post('/api/v1/support/visits/:visitId/diagnosis', authenticate, requireSuperAdmin, (req, res) => {
  const visit = visitById(req.params.visitId);
  if (!visit) return fail(res, 404, 'NOT_FOUND', 'Visit not found');
  const summary = String(req.body?.summary ?? '').trim();
  const finalCost = Number(req.body?.finalCost);
  if (!summary || !Number.isFinite(finalCost) || finalCost < 0) {
    return fail(res, 400, 'INVALID_INPUT', 'A summary and a non-negative final cost are required');
  }
  if (db.visitDiagnoses.some((item) => item.visitId === visit.visitId)) {
    return fail(res, 409, 'ALREADY_DIAGNOSED', 'The visit already has a diagnosis');
  }
  const now = new Date().toISOString();
  visit.status = 'COMPLETED';
  visit.completedAt = now;
  const ticket = ticketById(visit.ticketId);
  if (ticket) {
    ticket.status = 'RESOLVED';
    ticket.resolvedAt = now;
  }
  const diagnosis = {
    diagnosisId: `dia-${randomUUID()}`,
    visitId: visit.visitId,
    summary,
    finalCost,
    billingReferenceId: randomUUID(),
    createdAt: now,
  };
  db.visitDiagnoses.push(diagnosis);
  persist();
  res.status(201).json(diagnosis);
});

/* ------------------------------------------------------------------ */
/* Payments and billing                                                */
/* ------------------------------------------------------------------ */

app.get('/api/v1/subscriptions/me', authenticate, requirePrincipalUser, (req, res) => {
  const subscription = db.subscriptions.find((s) => s.accountId === req.user.id);
  if (!subscription) return fail(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription not initialized');
  res.json(subscription);
});

app.post('/api/v1/subscriptions/pro', authenticate, requirePrincipalUser, (req, res) => {
  const subscription = db.subscriptions.find((s) => s.accountId === req.user.id);
  if (!subscription) return fail(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription not initialized');
  if (!subscription.installationCompleted) {
    return fail(res, 409, 'INSTALLATION_REQUIRED', 'A completed installation is required');
  }
  const method = db.paymentMethods.find(
    (m) => m.id === req.body?.paymentMethodId && m.accountId === req.user.id && m.active,
  );
  if (!method) return fail(res, 400, 'INVALID_METHOD', 'A valid payment method is required');
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);
  subscription.proActive = true;
  subscription.plan = 'PRO';
  subscription.periodStartsAt = now.toISOString();
  subscription.periodEndsAt = end.toISOString();
  subscription.autoRenew = Boolean(req.body?.autoRenew);
  persist();
  res.json(subscription);
});

app.patch('/api/v1/subscriptions/me/renewal', authenticate, requirePrincipalUser, (req, res) => {
  const subscription = db.subscriptions.find((s) => s.accountId === req.user.id);
  if (!subscription) return fail(res, 404, 'SUBSCRIPTION_NOT_FOUND', 'Subscription not initialized');
  if (req.body?.autoRenew) {
    const hasRecurring = db.paymentMethods.some(
      (m) => m.accountId === req.user.id && m.active && m.recurringAuthorized,
    );
    if (!hasRecurring) {
      return fail(res, 409, 'RECURRING_REQUIRED', 'An authorized recurring method is required');
    }
  }
  subscription.autoRenew = Boolean(req.body?.autoRenew);
  persist();
  res.status(204).send();
});

app.get('/api/v1/payment-methods', authenticate, requirePrincipalUser, (req, res) => {
  res.json(
    db.paymentMethods
      .filter((m) => m.accountId === req.user.id && m.active)
      .map(({ id, brand, last_four, is_default, active }) => ({
        id,
        brand,
        last_four,
        is_default,
        active,
      })),
  );
});

app.post('/api/v1/payment-methods', authenticate, requirePrincipalUser, (req, res) => {
  const lastFour = String(req.body?.lastFour ?? '').slice(-4) || '0000';
  const method = {
    id: `pm-${randomUUID()}`,
    accountId: req.user.id,
    providerToken: String(req.body?.providerToken ?? `tok_${randomUUID()}`),
    brand: String(req.body?.brand ?? 'VISA').toUpperCase(),
    last_four: lastFour,
    is_default: !db.paymentMethods.some((m) => m.accountId === req.user.id && m.active),
    active: true,
    recurringAuthorized: true,
  };
  db.paymentMethods.push(method);
  persist();
  res.status(201).json({ id: method.id, testMode: true });
});

app.put('/api/v1/payment-methods/:id/default', authenticate, requirePrincipalUser, (req, res) => {
  const method = db.paymentMethods.find(
    (m) => m.id === req.params.id && m.accountId === req.user.id && m.active,
  );
  if (!method) return fail(res, 404, 'NOT_FOUND', 'Card unavailable');
  db.paymentMethods
    .filter((m) => m.accountId === req.user.id)
    .forEach((m) => (m.is_default = false));
  method.is_default = true;
  persist();
  res.status(204).send();
});

app.delete('/api/v1/payment-methods/:id', authenticate, requirePrincipalUser, (req, res) => {
  const method = db.paymentMethods.find(
    (m) => m.id === req.params.id && m.accountId === req.user.id && m.active,
  );
  if (!method) return fail(res, 404, 'NOT_FOUND', 'Card unavailable');
  method.active = false;
  method.is_default = false;
  persist();
  res.status(204).send();
});

app.get('/api/v1/payments/history', authenticate, requirePrincipalUser, (req, res) => {
  let items = db.paymentOrders.filter((o) => o.accountId === req.user.id);
  if (req.query.reason) items = items.filter((o) => o.reason === req.query.reason);
  if (req.query.status) items = items.filter((o) => o.status === req.query.status);
  const offset = Number(req.query.offset ?? 0);
  const limit = Number(req.query.limit ?? 50);
  res.json([...items].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(offset, offset + limit));
});

app.get('/api/v1/payments/orders/:id', authenticate, requirePrincipalUser, (req, res) => {
  const order = db.paymentOrders.find(
    (o) => o.id === req.params.id && o.accountId === req.user.id,
  );
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Payment order not found');
  res.json(order);
});

app.post('/api/v1/payments/orders/:id/pay', authenticate, requirePrincipalUser, (req, res) => {
  const order = db.paymentOrders.find(
    (o) => o.id === req.params.id && o.accountId === req.user.id,
  );
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Payment order not found');
  if (order.status === 'PAID') return res.json(order);
  const settled = settleOrder(order, req.body?.paymentMethodId);
  if (!settled) return fail(res, 400, 'INVALID_METHOD', 'A valid payment method is required');
  persist();
  res.json(order);
});

app.post('/api/v1/payments/orders/:id/retry', authenticate, requirePrincipalUser, (req, res) => {
  const order = db.paymentOrders.find(
    (o) => o.id === req.params.id && o.accountId === req.user.id,
  );
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Payment order not found');
  if (!['FAILED', 'PENDING'].includes(order.status)) {
    return fail(res, 409, 'INVALID_STATE', 'Only failed or pending orders can be retried');
  }
  const settled = settleOrder(order, req.body?.paymentMethodId);
  if (!settled) return fail(res, 400, 'INVALID_METHOD', 'A valid payment method is required');
  persist();
  res.json(order);
});

app.get('/api/v1/billing-documents/:id', authenticate, requirePrincipalUser, (req, res) => {
  const order = db.paymentOrders.find(
    (o) => o.accountId === req.user.id && o.documents.some((d) => d.id === req.params.id),
  );
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Billing document not found');
  res.json(order.documents.find((d) => d.id === req.params.id));
});

app.get('/api/v1/billing-documents/:id/download', authenticate, requirePrincipalUser, (req, res) => {
  const order = db.paymentOrders.find(
    (o) => o.accountId === req.user.id && o.documents.some((d) => d.id === req.params.id),
  );
  if (!order) return fail(res, 404, 'NOT_FOUND', 'Billing document not found');
  const document = order.documents.find((d) => d.id === req.params.id);
  const format = String(req.query.format ?? 'pdf');
  const extension = format === 'cdr' ? 'zip' : format;
  const body =
    format === 'xml'
      ? `<?xml version="1.0" encoding="UTF-8"?><Invoice><Number>${document.number}</Number><Total>${document.total}</Total><Currency>${document.currency}</Currency></Invoice>`
      : format === 'cdr'
        ? `SmartGN CDR placeholder for ${document.number}`
        : `%PDF-1.4\n% SmartGN billing document ${document.number}\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF`;
  res.setHeader(
    'Content-Type',
    format === 'xml' ? 'application/xml' : format === 'cdr' ? 'application/zip' : 'application/pdf',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${document.number}.${extension}"`,
  );
  res.send(body);
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'smartgn-fake-api' }));

app.use((_req, res) => fail(res, 404, 'NOT_FOUND', 'Endpoint not found'));

app.listen(PORT, () => {
  console.log(`SmartGN fake API listening on http://localhost:${PORT}/api/v1`);
});
