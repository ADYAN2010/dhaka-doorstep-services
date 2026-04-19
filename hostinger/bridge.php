<?php
/**
 * Shebabd Hostinger MySQL Bridge
 * --------------------------------------------------------------
 * Single signed JSON-RPC endpoint. Frontend (Cloudflare Workers)
 * sends:  { action: "<name>", params: {...}, ts: <unix>, nonce }
 *   header: X-Bridge-Sig: hex(hmac_sha256(BRIDGE_SECRET, "<ts>.<nonce>.<body>"))
 *
 * Whitelisted actions only — no dynamic SQL is ever built from the
 * client. Errors return { error: { code, message } } with no traces.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

require __DIR__ . '/config.php'; // defines DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT, BRIDGE_SECRET

// ----- helpers ----------------------------------------------------
function fail(int $http, string $code, string $message): void {
    http_response_code($http);
    echo json_encode(['error' => ['code' => $code, 'message' => $message]]);
    exit;
}

function ok($data): void {
    echo json_encode(['data' => $data]);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            DB_HOST, DB_PORT, DB_NAME
        );
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (Throwable $e) {
            error_log('[bridge] db connect failed: ' . $e->getMessage());
            fail(500, 'db_unavailable', 'Database connection failed.');
        }
    }
    return $pdo;
}

function uuid(): string {
    $d = random_bytes(16);
    $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
    $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}

// ----- request parsing & signature --------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'method_not_allowed', 'POST only.');
}

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 65536) fail(413, 'payload_too_large', 'Request too large.');

$ts    = (int)($_SERVER['HTTP_X_BRIDGE_TS']    ?? 0);
$nonce = (string)($_SERVER['HTTP_X_BRIDGE_NONCE'] ?? '');
$sig   = (string)($_SERVER['HTTP_X_BRIDGE_SIG']   ?? '');

if (!$ts || !$nonce || !$sig) fail(401, 'unsigned', 'Missing signature headers.');
if (abs(time() - $ts) > 300)  fail(401, 'stale', 'Timestamp out of window.');

$expected = hash_hmac('sha256', $ts . '.' . $nonce . '.' . $raw, BRIDGE_SECRET);
if (!hash_equals($expected, $sig)) fail(401, 'bad_signature', 'Signature mismatch.');

$body = json_decode($raw, true);
if (!is_array($body)) fail(400, 'bad_json', 'Invalid JSON.');

$action = (string)($body['action'] ?? '');
$params = (array)($body['params'] ?? []);

// ----- action map -------------------------------------------------
// Each handler returns array (object) or list. They MUST use prepared
// statements. Never interpolate $params into SQL directly.
$actions = [

    // -------- admin auth --------
    'admin.login' => function (array $p): array {
        $email    = trim((string)($p['email'] ?? ''));
        $password = (string)($p['password'] ?? '');
        if ($email === '' || $password === '') {
            fail(400, 'invalid_input', 'Email and password required.');
        }
        $stmt = db()->prepare(
            'SELECT id, email, full_name, password_hash, role, is_active
             FROM admin_users WHERE email = :e LIMIT 1'
        );
        $stmt->execute([':e' => $email]);
        $row = $stmt->fetch();
        if (!$row || !$row['is_active'] || !password_verify($password, $row['password_hash'])) {
            fail(401, 'invalid_credentials', 'Wrong email or password.');
        }
        $upd = db()->prepare('UPDATE admin_users SET last_login_at = NOW() WHERE id = :id');
        $upd->execute([':id' => $row['id']]);
        unset($row['password_hash'], $row['is_active']);
        return $row;
    },

    // -------- dashboard --------
    'dashboard.stats' => function (): array {
        $pdo = db();
        $count = fn(string $sql): int => (int)$pdo->query($sql)->fetchColumn();
        return [
            'customers'        => $count('SELECT COUNT(*) FROM customers'),
            'providers'        => $count("SELECT COUNT(*) FROM providers WHERE status='approved'"),
            'pendingProviders' => $count("SELECT COUNT(*) FROM providers WHERE status='pending'"),
            'bookings'         => $count('SELECT COUNT(*) FROM bookings'),
            'newBookings'      => $count("SELECT COUNT(*) FROM bookings WHERE status='new'"),
            'completedBookings'=> $count("SELECT COUNT(*) FROM bookings WHERE status='completed'"),
            'reviews'          => $count('SELECT COUNT(*) FROM reviews'),
            'openTickets'      => $count("SELECT COUNT(*) FROM support_tickets WHERE status IN ('open','pending')"),
            'categories'       => $count('SELECT COUNT(*) FROM categories WHERE is_active=1'),
            'cities'           => $count('SELECT COUNT(*) FROM cities WHERE is_active=1'),
        ];
    },

    // -------- generic list helpers --------
    'customers.list' => function (array $p): array {
        $limit  = min(max((int)($p['limit']  ?? 50), 1), 200);
        $offset = max((int)($p['offset'] ?? 0), 0);
        $stmt = db()->prepare(
            'SELECT id, full_name, email, phone, area, is_active, created_at
             FROM customers ORDER BY created_at DESC LIMIT :l OFFSET :o'
        );
        $stmt->bindValue(':l', $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':o', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    'providers.list' => function (array $p): array {
        $limit  = min(max((int)($p['limit']  ?? 50), 1), 200);
        $offset = max((int)($p['offset'] ?? 0), 0);
        $status = isset($p['status']) ? (string)$p['status'] : null;
        $sql = 'SELECT id, full_name, email, phone, primary_area, primary_category,
                       status, rating, review_count, created_at
                  FROM providers';
        $args = [];
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE status = :s';
            $args[':s'] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT :l OFFSET :o';
        $stmt = db()->prepare($sql);
        foreach ($args as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':l', $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':o', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    'bookings.list' => function (array $p): array {
        $limit  = min(max((int)($p['limit']  ?? 50), 1), 200);
        $offset = max((int)($p['offset'] ?? 0), 0);
        $status = isset($p['status']) ? (string)$p['status'] : null;
        $sql = 'SELECT id, full_name, phone, email, category, service, area, address,
                       preferred_date, preferred_time_slot, status, customer_id,
                       provider_id, created_at
                  FROM bookings';
        $args = [];
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE status = :s';
            $args[':s'] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT :l OFFSET :o';
        $stmt = db()->prepare($sql);
        foreach ($args as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':l', $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':o', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    'categories.list' => function (): array {
        return db()->query(
            'SELECT id, slug, name, commission_rate, is_active, created_at
             FROM categories ORDER BY name ASC'
        )->fetchAll();
    },

    'services.list' => function (array $p): array {
        $cat = isset($p['categoryId']) ? (string)$p['categoryId'] : null;
        $sql = 'SELECT id, category_id, slug, name, description, base_price,
                       is_active, is_featured, is_seasonal, is_trending, display_order
                  FROM services';
        $args = [];
        if ($cat !== null && $cat !== '') {
            $sql .= ' WHERE category_id = :c';
            $args[':c'] = $cat;
        }
        $sql .= ' ORDER BY display_order ASC, name ASC';
        $stmt = db()->prepare($sql);
        foreach ($args as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    'cities.list' => function (): array {
        return db()->query(
            'SELECT id, slug, name, country, launch_status, is_active, display_order, launched_at
             FROM cities ORDER BY display_order ASC, name ASC'
        )->fetchAll();
    },

    'areas.list' => function (array $p): array {
        $cityId = isset($p['cityId']) ? (string)$p['cityId'] : null;
        $sql = 'SELECT id, city_id, slug, name, is_active, display_order FROM areas';
        $args = [];
        if ($cityId !== null && $cityId !== '') {
            $sql .= ' WHERE city_id = :c';
            $args[':c'] = $cityId;
        }
        $sql .= ' ORDER BY display_order ASC, name ASC';
        $stmt = db()->prepare($sql);
        foreach ($args as $k => $v) $stmt->bindValue($k, $v);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    'reviews.list' => function (array $p): array {
        $limit  = min(max((int)($p['limit']  ?? 50), 1), 200);
        $offset = max((int)($p['offset'] ?? 0), 0);
        $stmt = db()->prepare(
            'SELECT id, booking_id, customer_id, provider_id, rating, comment, created_at
               FROM reviews ORDER BY created_at DESC LIMIT :l OFFSET :o'
        );
        $stmt->bindValue(':l', $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':o', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    'tickets.list' => function (array $p): array {
        $limit  = min(max((int)($p['limit']  ?? 50), 1), 200);
        $offset = max((int)($p['offset'] ?? 0), 0);
        $status = isset($p['status']) ? (string)$p['status'] : null;
        $sql = 'SELECT id, subject, requester_name, requester_email, category,
                       priority, status, assignee_id, created_at, updated_at
                  FROM support_tickets';
        $args = [];
        if ($status !== null && $status !== '') {
            $sql .= ' WHERE status = :s';
            $args[':s'] = $status;
        }
        $sql .= ' ORDER BY created_at DESC LIMIT :l OFFSET :o';
        $stmt = db()->prepare($sql);
        foreach ($args as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':l', $limit,  PDO::PARAM_INT);
        $stmt->bindValue(':o', $offset, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    },

    // -------- basic CRUD examples (extend as needed) --------
    'cities.upsert' => function (array $p): array {
        $id   = (string)($p['id']   ?? uuid());
        $slug = (string)($p['slug'] ?? '');
        $name = (string)($p['name'] ?? '');
        if ($slug === '' || $name === '') fail(400, 'invalid_input', 'slug & name required.');
        $stmt = db()->prepare(
            'INSERT INTO cities (id, slug, name, country, launch_status, is_active, display_order)
             VALUES (:id, :slug, :name, :country, :ls, :a, :o)
             ON DUPLICATE KEY UPDATE
               name = VALUES(name), country = VALUES(country),
               launch_status = VALUES(launch_status), is_active = VALUES(is_active),
               display_order = VALUES(display_order)'
        );
        $stmt->execute([
            ':id'      => $id,
            ':slug'    => $slug,
            ':name'    => $name,
            ':country' => (string)($p['country'] ?? 'Bangladesh'),
            ':ls'      => (string)($p['launchStatus'] ?? 'coming_soon'),
            ':a'       => !empty($p['isActive']) ? 1 : 0,
            ':o'       => (int)($p['displayOrder'] ?? 0),
        ]);
        return ['id' => $id];
    },

    'categories.upsert' => function (array $p): array {
        $id   = (string)($p['id']   ?? uuid());
        $slug = (string)($p['slug'] ?? '');
        $name = (string)($p['name'] ?? '');
        if ($slug === '' || $name === '') fail(400, 'invalid_input', 'slug & name required.');
        $stmt = db()->prepare(
            'INSERT INTO categories (id, slug, name, commission_rate, is_active)
             VALUES (:id, :slug, :name, :cr, :a)
             ON DUPLICATE KEY UPDATE
               name = VALUES(name), commission_rate = VALUES(commission_rate),
               is_active = VALUES(is_active)'
        );
        $stmt->execute([
            ':id'   => $id,
            ':slug' => $slug,
            ':name' => $name,
            ':cr'   => (float)($p['commissionRate'] ?? 10),
            ':a'    => !empty($p['isActive']) ? 1 : 0,
        ]);
        return ['id' => $id];
    },

];

if (!isset($actions[$action])) {
    fail(404, 'unknown_action', 'Action not allowed.');
}

try {
    $result = $actions[$action]($params);
    ok($result);
} catch (Throwable $e) {
    error_log('[bridge] action ' . $action . ' failed: ' . $e->getMessage());
    fail(500, 'internal_error', 'Internal error.');
}
