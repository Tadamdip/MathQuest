<?php
declare(strict_types=1);

require __DIR__ . '/db.php';

function get_scores(PDO $pdo): array
{
    $statement = $pdo->query(
        'SELECT id, player_name, score, moves, correct_answers, wrong_answers, created_at
         FROM scores
         ORDER BY score DESC, moves ASC, created_at ASC
         LIMIT 10'
    );

    return array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'playerName' => $row['player_name'],
            'score' => (int) $row['score'],
            'moves' => (int) $row['moves'],
            'correctAnswers' => (int) $row['correct_answers'],
            'wrongAnswers' => (int) $row['wrong_answers'],
            'createdAt' => $row['created_at'],
        ];
    }, $statement->fetchAll());
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['scores' => get_scores($pdo)]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload.']);
    exit;
}

$playerName = trim((string) ($payload['playerName'] ?? ''));
$score = filter_var($payload['score'] ?? null, FILTER_VALIDATE_INT);
$moves = filter_var($payload['moves'] ?? null, FILTER_VALIDATE_INT);
$correctAnswers = filter_var($payload['correctAnswers'] ?? null, FILTER_VALIDATE_INT);
$wrongAnswers = filter_var($payload['wrongAnswers'] ?? null, FILTER_VALIDATE_INT);

if ($playerName === '' || mb_strlen($playerName) > 80 || $score === false || $moves === false || $correctAnswers === false || $wrongAnswers === false) {
    http_response_code(422);
    echo json_encode(['error' => 'Please provide a valid player name and score data.']);
    exit;
}

$statement = $pdo->prepare(
    'INSERT INTO scores (player_name, score, moves, correct_answers, wrong_answers)
     VALUES (:player_name, :score, :moves, :correct_answers, :wrong_answers)'
);

$statement->execute([
    ':player_name' => $playerName,
    ':score' => $score,
    ':moves' => max(0, $moves),
    ':correct_answers' => max(0, $correctAnswers),
    ':wrong_answers' => max(0, $wrongAnswers),
]);

http_response_code(201);
echo json_encode([
    'saved' => true,
    'scores' => get_scores($pdo),
]);
